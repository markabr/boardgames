import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // OAuth callback handler - to be implemented with Supabase Auth
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/(auth)/login", request.url));
  }

  // TODO: Exchange code for session using Supabase
  return NextResponse.redirect(new URL("/home", request.url));
}
