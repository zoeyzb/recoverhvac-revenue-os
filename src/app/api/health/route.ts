export const dynamic = "force-static";

export function GET() {
  return Response.json({
    data: { status: "healthy", mode: "test", providers: {}, timestamp: "build-time" },
  });
}
