import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const teamsSnapshot = await db
      .collection("teams")
      .where("is_disqualified", "==", false)
      .orderBy("score", "desc")
      .orderBy("current_level", "desc")
      .orderBy("last_submission_at", "asc")
      .limit(10)
      .get();

    const leaderboard = teamsSnapshot.docs.map((doc, idx) => {
      const data = doc.data();
      return {
        rank: idx + 1,
        team_name: data.team_name,
        college_name: data.college_name || "N/A",
        score: data.score || 0,
        current_level: data.current_level || 1,
        hints_used: data.global_hints_used || 0
      };
    });

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
