import { NextResponse } from "next/server";
import {
  parsePublicIntake,
  savePublicIntake,
  validRequestOrigin,
} from "@/lib/public-intake";

export async function POST(request: Request) {
  if (!validRequestOrigin(request)) {
    return NextResponse.json(
      { error: { code: "ORIGIN_REJECTED", message: "Request origin was rejected" } },
      { status: 403 },
    );
  }

  if (Number(request.headers.get("content-length") || 0) > 32_768) {
    return NextResponse.json(
      { error: { code: "PAYLOAD_TOO_LARGE", message: "Request is too large" } },
      { status: 413 },
    );
  }

  try {
    const input = parsePublicIntake(await request.json());
    const saved = await savePublicIntake(input);
    return NextResponse.json(
      { data: { received: true, requestId: saved.id } },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "INTAKE_NOT_CONFIGURED") {
      return NextResponse.json(
        {
          error: {
            code: message,
            message: "Online requests are being connected. Please email hello@recoverhq.com for immediate help.",
          },
        },
        { status: 503 },
      );
    }
    if (message === "INTAKE_STORAGE_FAILED" || error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: {
            code: "INTAKE_UNAVAILABLE",
            message: "We could not save your request. Please try again or email hello@recoverhq.com.",
          },
        },
        { status: message === "INTAKE_STORAGE_FAILED" ? 503 : 422 },
      );
    }
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: message || "Check the form and try again",
        },
      },
      { status: 422 },
    );
  }
}
