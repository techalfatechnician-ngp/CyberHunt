import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";
import { signToken, COOKIE_NAME } from "@/lib/jwt";
import type { AuthPayload } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, team_id } = body;

    if (!email || !team_id) {
      return NextResponse.json(
        { error: "Email and Team ID are required" },
        { status: 400 }
      );
    }

    const teamDocRef = db.collection("teams").doc(team_id.toUpperCase().trim());
    const teamDoc = await teamDocRef.get();

    if (!teamDoc.exists) {
      return NextResponse.json(
        { error: "Invalid Team ID" },
        { status: 401 }
      );
    }

    const team = teamDoc.data()!;

    if (team.leader_email.toLowerCase() !== email.toLowerCase().trim()) {
      return NextResponse.json(
        { error: "Invalid email for this Team ID" },
        { status: 401 }
      );
    }

    if (team.is_disqualified) {
      return NextResponse.json(
        { error: "This team has been disqualified" },
        { status: 403 }
      );
    }

    const payload: AuthPayload = {
      team_id: team.team_id,
      leader_email: team.leader_email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 6 * 60 * 60,
    };

    const token = await signToken(payload);

    const currentLevel = team.current_level || 1;

    const response = NextResponse.json({
      message: "Login successful",
      team_name: team.team_name,
      current_level: currentLevel,
      team_id: team.team_id,
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 6 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
