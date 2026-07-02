import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { action, submission_id, team_id } = await request.json();

    if (!action || !submission_id || !team_id) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const { data: teamData } = await supabase.from("teams").select("*").eq("team_id", team_id).single();
    const { data: subData } = await supabase.from("submissions").select("*").eq("id", submission_id).single();

    if (!teamData || !subData) {
      return NextResponse.json({ error: "Data not found" }, { status: 404 });
    }

    if (action === "approve") {
      await supabase.from("submissions").update({ status: "approved" }).eq("id", submission_id);

      await supabase.from("activity_logs").insert({
        message: `Mission Control APPROVED Level ${subData.level_id} intel for ${teamData.team_name}.`
      });

      return NextResponse.json({ success: true });
    }

    if (action === "reject") {
      // Calculate points to deduct
      const level_id = subData.level_id;
      const POINTS_MAP = [100, 150, 220, 320, 450, 600, 800, 1050, 1350, 2000];
      const basePoints = POINTS_MAP[level_id - 1] || 1000;
      
      const hintsUsed = teamData.level_hints?.[level_id.toString()] || 0;
      let multiplier = 1.0;
      if (hintsUsed === 1) multiplier = 0.8;
      else if (hintsUsed >= 2) multiplier = 0.5;
      
      const scoreDec = Math.floor(basePoints * multiplier);
      const newScore = Math.max(0, (teamData.score || 0) - scoreDec);

      // Remove the fragment
      const fragments = teamData.fragments || Array(9).fill("");
      if (level_id >= 1 && level_id <= 9) {
        fragments[level_id - 1] = "";
      }

      await supabase.from("teams").update({ 
        score: newScore,
        fragments: fragments 
      }).eq("team_id", team_id);

      await supabase.from("submissions").update({ status: "rejected" }).eq("id", submission_id);
      
      await supabase.from("activity_logs").insert({
        message: `Mission Control REJECTED intel for ${teamData.team_name}. Penalty applied.`
      });

      return NextResponse.json({ success: true });
    }

    if (action === "strike") {
      const newStrikes = (teamData.ai_strikes || 0) + 1;
      
      if (newStrikes <= 3) {
        // Accept the submission but mark it as AI
        await supabase.from("submissions").update({ status: "approved_ai" }).eq("id", submission_id);
        
        await supabase.from("teams").update({
          ai_strikes: newStrikes
        }).eq("team_id", team_id);

        await supabase.from("activity_logs").insert({
          message: `WARNING: ${teamData.team_name} used an AI Submission slot. (${newStrikes}/3)`
        });
        
        return NextResponse.json({ success: true, strikes: newStrikes, disqualified: false });
      } else {
        // 4th strike = disqualification
        await supabase.from("submissions").update({ status: "rejected_ai" }).eq("id", submission_id);
        
        await supabase.from("teams").update({
          ai_strikes: newStrikes,
          is_disqualified: true
        }).eq("team_id", team_id);

        await supabase.from("activity_logs").insert({
          message: `CRITICAL: ${teamData.team_name} has been DISQUALIFIED for exceeding AI limits.`
        });
        
        return NextResponse.json({ success: true, strikes: newStrikes, disqualified: true });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Admin action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
