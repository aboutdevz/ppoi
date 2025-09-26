import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Session } from "next-auth";
import { authOptions } from "@/lib/auth-config";

// This endpoint will sync users between NextAuth and our Worker database
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = (await request.json()) as { action: string };
    const { action } = body;

    switch (action) {
      case "create_or_sync":
        return await createOrSyncUser(session);
      case "get_profile":
        return await getUserProfile(session);
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("User API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function createOrSyncUser(session: Session) {
  try {
    // Call our Worker API to create or sync the user
    const workerUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787/v1";

    const response = await fetch(`${workerUrl}/users/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-API": "true", // Special header for internal API calls
      },
      body: JSON.stringify({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to sync user with Worker");
    }

    const userData = await response.json();

    return NextResponse.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error("User sync error:", error);
    return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
  }
}

async function getUserProfile(session: Session) {
  try {
    const workerUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787/v1";

    const response = await fetch(`${workerUrl}/users/${session.user.id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-PPOI-User": session.user.id || "",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get user profile");
    }

    const userData = await response.json();

    return NextResponse.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Failed to get profile" },
      { status: 500 },
    );
  }
}
