export const dynamic = "force-static";

// Static export placeholder. The production Worker handles POST requests.
export function GET() {
  return Response.json(
    { error: { code: "METHOD_NOT_ALLOWED", message: "Use POST" } },
    { status: 405 },
  );
}
