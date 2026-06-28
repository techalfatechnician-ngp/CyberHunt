import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: team, error } = await supabase
      .from("teams")
      .select("*")
      .eq("team_id", user.team_id)
      .single();
    
    if (error || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

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
