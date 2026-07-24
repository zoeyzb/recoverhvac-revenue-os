import runtimeWorker from "../../../../worker/index.js";

export const dynamic = "force-dynamic";
export const maxDuration = 30;
export const runtime = "nodejs";

type RuntimeWorker = {
  fetch: (
    request: Request,
    environment: NodeJS.ProcessEnv,
  ) => Promise<Response>;
};

function jsonError(code: string, message: string, status: number) {
  return Response.json(
    { error: { code, message } },
    {
      status,
      headers: {
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    },
  );
}

async function handle(request: Request) {
  try {
    const response = await (runtimeWorker as RuntimeWorker).fetch(
      request,
      process.env,
    );
    const type = response.headers.get("content-type") || "";
    if (
      new URL(request.url).pathname.startsWith("/api/") &&
      !type.includes("application/json")
    ) {
      return jsonError(
        "INVALID_API_RESPONSE",
        "The operational API returned an invalid response",
        502,
      );
    }
    return response;
  } catch (error) {
    const message =
      error instanceof Error && error.message.length < 180
        ? error.message
        : "The operational API is unavailable";
    return jsonError("OPERATIONAL_API_ERROR", message, 503);
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;

