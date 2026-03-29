import { NextResponse } from "next/server";

const APP_PASSWORD = process.env.APP_PASSWORD;

export async function POST(request: Request) {
  // If no password is set, auth is disabled
  if (!APP_PASSWORD) {
    return NextResponse.json({ success: true });
  }

  try {
    const { password } = await request.json();
    if (password === APP_PASSWORD) {
      const response = NextResponse.json({ success: true });
      // Set a cookie that lasts 30 days
      response.cookies.set("pomoflow-auth", APP_PASSWORD, {
        httpOnly: true,
        secure: false, // Allow HTTP for local network
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
      return response;
    }
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function GET(request: Request) {
  // Check if user is authenticated
  if (!APP_PASSWORD) {
    return NextResponse.json({ authenticated: true });
  }

  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/pomoflow-auth=([^;]+)/);
  const authenticated = match?.[1] === APP_PASSWORD;

  return NextResponse.json({ authenticated });
}
