import { NextResponse } from "next/server";

// Stub endpoint: email/password registration to be implemented with D1 + hashing.
// For now, use OAuth providers on the sign-up page.
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message: "Email/password sign-up is not yet available. Please use Google or Discord.",
    },
    { status: 501 },
  );
}
