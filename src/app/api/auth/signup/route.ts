import { NextResponse } from "next/server";
import { accountEnvironment, createAccount, normalizedEmail, validRequestOrigin } from "@/lib/account-auth";

function retryAfterSeconds(message: string) {
  const match = message.match(/after\s+(\d+)\s+seconds?/i);
  return match ? Math.max(1, Number(match[1])) : 60;
}

export async function POST(request: Request) {
  try {
    if (!validRequestOrigin(request)) {
      return NextResponse.json(
        { error: { code: "ORIGIN_REJECTED", message: "Request origin was rejected" } },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const businessName = String(body.businessName || "").trim();
    const email = normalizedEmail(body.email);
    const password = String(body.password || "");
    const timezone = String(body.timezone || "America/Chicago").slice(0, 100);

    if (businessName.length < 2 || businessName.length > 160) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Enter your business name" } },
        { status: 422 },
      );
    }

    if (password.length < 10 || password.length > 256) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Use at least 10 characters for your password" } },
        { status: 422 },
      );
    }

    const env = accountEnvironment();
    const { session, organization } = await createAccount({ businessName, email, password, timezone }, env);
    const result = NextResponse.json(
      { data: { accountCreated: true, emailConfirmationRequired: !session.access_token, organization } },
      { status: 201 },
    );

    if (session.access_token) {
      result.cookies.set("recover_access", session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: Number(session.expires_in) || 3600,
      });
      result.cookies.set("recover_refresh", session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 2592000,
      });
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create your account";

    if (/security purposes.*after\s+\d+\s+seconds?|rate limit/i.test(message)) {
      const retryAfter = retryAfterSeconds(message);
      return NextResponse.json(
        {
          error: {
            code: "SIGNUP_RATE_LIMITED",
            message: `Too many signup attempts. Wait ${retryAfter} seconds, then try once.`,
            retryAfter,
          },
        },
        { status: 429, headers: { "retry-after": String(retryAfter) } },
      );
    }

    return NextResponse.json(
      {
        error: {
          code: message === "AUTH_NOT_CONFIGURED" ? "AUTH_NOT_CONFIGURED" : "SIGNUP_FAILED",
          message: message === "AUTH_NOT_CONFIGURED" ? "Account creation is not configured yet" : message,
        },
      },
      { status: message === "AUTH_NOT_CONFIGURED" ? 503 : 400 },
    );
  }
}
