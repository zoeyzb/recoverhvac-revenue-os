import json
import os
import asyncio
import urllib.request
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from dataclasses import dataclass

from livekit import api
from livekit.agents import Agent, AgentServer, AgentSession, JobContext, RunContext, cli, function_tool, inference

from .prompt import CallContext, build_instructions


@dataclass
class VoiceSessionData:
    tenant_id: str
    call_request_id: str
    contact_id: str
    approved_payment_amount_minor: int | None = None
    payment_currency: str = "USD"


def _required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def _load_context(ctx: JobContext) -> tuple[VoiceSessionData, CallContext]:
    metadata = getattr(ctx.job, "metadata", "") or os.getenv("VOICE_TEST_CONTEXT_JSON", "")
    if not metadata:
        raise RuntimeError("Voice job metadata is required")
    raw = json.loads(metadata)
    session = VoiceSessionData(
        tenant_id=str(raw["tenant_id"]),
        call_request_id=str(raw["call_request_id"]),
        contact_id=str(raw["contact_id"]),
        approved_payment_amount_minor=int(raw["approved_payment_amount_minor"]) if raw.get("approved_payment_amount_minor") else None,
        payment_currency=str(raw.get("payment_currency", "USD")),
    )
    context = CallContext(
        represented_company=str(raw["represented_company"]),
        assistant_name=str(raw.get("assistant_name", "Alex")),
        purpose=str(raw["purpose"]),
        verified_pain_point=str(raw["verified_pain_point"]),
        disclosure=str(raw.get("disclosure", "the automated assistant")),
        transfer_label=str(raw.get("transfer_label", "a person on the team")),
    )
    return session, context


def _post_tool(payload: dict[str, object]) -> dict[str, object]:
    request = urllib.request.Request(
        f"{_required('RECOVER_API_URL').rstrip('/')}/api/internal/voice/tool",
        data=json.dumps(payload).encode("utf-8"),
        headers={"authorization": f"Bearer {_required('VOICE_AGENT_SHARED_SECRET')}", "content-type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))["data"]


async def _tool(run: RunContext[VoiceSessionData], action: str, **values: object) -> dict[str, object]:
    return await asyncio.to_thread(_post_tool, {"action": action, "tenant_id": run.userdata.tenant_id, "contact_id": run.userdata.contact_id, "call_request_id": run.userdata.call_request_id, **values})


class RecoverAgent(Agent):
    def __init__(self, context: CallContext) -> None:
        super().__init__(instructions=build_instructions(context))

    @function_tool
    async def mark_dnc(self, run: RunContext[VoiceSessionData], reason: str) -> dict[str, object]:
        """Stop after a do-not-call, opt-out, or wrong-number request."""
        return await _tool(run, "suppress", reason=reason)

    @function_tool
    async def request_human_transfer(self, run: RunContext[VoiceSessionData], reason: str) -> dict[str, object]:
        """Request a warm transfer without inventing staff availability."""
        return await _tool(run, "human_transfer", reason=reason)

    @function_tool
    async def request_callback(self, run: RunContext[VoiceSessionData], requested_window: str) -> dict[str, object]:
        """Request a callback; the backend must confirm availability first."""
        return await _tool(run, "callback", requested_window=requested_window)

    @function_tool
    async def book_appointment(self, run: RunContext[VoiceSessionData], starts_at: str, ends_at: str) -> dict[str, object]:
        """Book a confirmed slot only after the caller explicitly agrees; times must be ISO-8601."""
        return await _tool(run, "booking", starts_at=starts_at, ends_at=ends_at, summary="Service appointment")

    @function_tool
    async def send_payment_link(self, run: RunContext[VoiceSessionData]) -> dict[str, object]:
        """Send the server-approved payment amount after the caller explicitly agrees."""
        if not run.userdata.approved_payment_amount_minor:
            return {"ok": False, "code": "APPROVED_AMOUNT_REQUIRED"}
        return await _tool(run, "payment_link", amount_minor=run.userdata.approved_payment_amount_minor, currency=run.userdata.payment_currency, description="Approved service deposit")

    @function_tool
    async def record_outcome(self, run: RunContext[VoiceSessionData], outcome: str) -> dict[str, object]:
        """Persist the explicit final call outcome before ending the call."""
        return await _tool(run, "outcome", outcome=outcome)


server = AgentServer()


@server.rtc_session(agent_name="recover-voice")
async def entrypoint(ctx: JobContext) -> None:
    session_data, call_context = _load_context(ctx)
    session = AgentSession[VoiceSessionData](
        userdata=session_data,
        vad=inference.VAD(),
        stt=inference.STT("deepgram/nova-3", language="multi"),
        llm=inference.LLM("openai/gpt-4.1-mini"),
        tts=inference.TTS("cartesia/sonic-3", voice=os.getenv("CARTESIA_VOICE_ID", "9626c31c-bec5-4cca-baa8-f8ba9e84c8bc")),
    )
    await session.start(agent=RecoverAgent(call_context), room=ctx.room)
    if json.loads(getattr(ctx.job, "metadata", "{}") or "{}").get("phone_number"):
        await ctx.wait_for_participant(identity=f"callee-{session_data.call_request_id}")
    await session.generate_reply(instructions="Deliver the approved opening now. Ask one question, then listen.")


async def _dispatch_call(payload: dict[str, object]) -> dict[str, object]:
    phone_number = str(payload["phone_number"])
    call_request_id = str(payload["call_request_id"])
    room_name = f"recover-{call_request_id}"
    metadata = json.dumps(payload, separators=(",", ":"))
    async with api.LiveKitAPI() as client:
        dispatch = await client.agent_dispatch.create_dispatch(api.CreateAgentDispatchRequest(agent_name="recover-voice", room=room_name, metadata=metadata))
        participant = await client.sip.create_sip_participant(api.CreateSIPParticipantRequest(room_name=room_name, sip_trunk_id=_required("SIP_OUTBOUND_TRUNK_ID"), sip_call_to=phone_number, participant_identity=f"callee-{call_request_id}", participant_name="Customer", play_dialtone=True))
    return {"dispatch_id": dispatch.id, "participant_id": getattr(participant, "participant_id", None), "room_name": room_name}


class DispatchHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        self.send_response(200 if self.path == "/health" else 404); self.end_headers(); self.wfile.write(b"ok" if self.path == "/health" else b"not found")

    def do_POST(self) -> None:
        if self.path != "/dispatch" or self.headers.get("authorization") != f"Bearer {os.getenv('VOICE_DISPATCH_SECRET', '')}":
            self.send_response(401); self.end_headers(); return
        try:
            payload = json.loads(self.rfile.read(int(self.headers.get("content-length", "0"))))
            result = asyncio.run(_dispatch_call(payload))
            encoded = json.dumps(result).encode(); self.send_response(202); self.send_header("content-type", "application/json"); self.send_header("content-length", str(len(encoded))); self.end_headers(); self.wfile.write(encoded)
        except Exception as error:
            encoded = json.dumps({"error": str(error)}).encode(); self.send_response(503); self.send_header("content-type", "application/json"); self.end_headers(); self.wfile.write(encoded)

    def log_message(self, format: str, *args: object) -> None:
        return


def _start_dispatch_server() -> None:
    port = int(os.getenv("PORT", "8080")); threading.Thread(target=ThreadingHTTPServer(("0.0.0.0", port), DispatchHandler).serve_forever, daemon=True).start()


if __name__ == "__main__":
    _start_dispatch_server()
    cli.run_app(server)
