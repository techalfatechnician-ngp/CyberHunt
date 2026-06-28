import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: teamsSnapshot } = await supabase.from("teams").select("*");

    const allTeams = (teamsSnapshot || [])
      .filter(data => data.is_disqualified !== true); // Filter out disqualified teams

    // Sort in memory: Highest score, then highest level, then earliest submission
    allTeams.sort((a, b) => {
      if ((b.score || 0) !== (a.score || 0)) {
        return (b.score || 0) - (a.score || 0); // Descending score
      }
      if ((b.current_level || 1) !== (a.current_level || 1)) {
        return (b.current_level || 1) - (a.current_level || 1); // Descending level
      }
      
      const timeA = a.last_submission_at ? new Date(a.last_submission_at).getTime() : 0;
      const timeB = b.last_submission_at ? new Date(b.last_submission_at).getTime() : 0;
      return timeA - timeB; // Ascending time
    });

    const leaderboard = allTeams.slice(0, 10).map((data, idx) => {
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
