# Recover Voice Agent

Isolated LiveKit Agents service for realtime inbound and approved outbound calls. Deploy it as a separate long-running service on Railway or LiveKit Cloud; it does not run inside the Sites Worker.

It uses server-verified per-job metadata, natural-turn guidance and authenticated backend tools. Opt-outs are persisted immediately; transfer and callback requests enter the operator approval queue; final outcomes are written to the audit trail.

Required configuration: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `SIP_OUTBOUND_TRUNK_ID`, `RECOVER_API_URL`, `VOICE_AGENT_SHARED_SECRET`, `VOICE_DISPATCH_SECRET`, and optionally `CARTESIA_VOICE_ID`. The same service exposes authenticated `POST /dispatch` and `GET /health`. `VOICE_TEST_CONTEXT_JSON` is only a local console fallback; production calls use LiveKit job metadata.

Run locally with `python -m recover_voice.agent console`; run in production with `python -m recover_voice.agent start`.
