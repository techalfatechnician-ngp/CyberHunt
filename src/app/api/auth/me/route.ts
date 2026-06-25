import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { db } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teamDoc = await db.collection("teams").doc(user.team_id).get();
    
    if (!teamDoc.exists) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const team = teamDoc.data()!;
    const currentLevel = team.current_level || 1;

    return NextResponse.json({
      team_id: team.team_id,
      team_name: team.team_name,
      leader_email: team.leader_email,
      current_level: currentLevel,
      score: team.score || 0,
      hints_used: team.global_hints_used || 0
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
