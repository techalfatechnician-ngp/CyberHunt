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
      await supabase.from("submissions").update({ status: "rejected" }).eq("id", submission_id);
      
      await supabase.from("activity_logs").insert({
        message: `Mission Control REJECTED intel for ${teamData.team_name}.`
      });

      return NextResponse.json({ success: true });
    }

    if (action === "strike") {
      await supabase.from("submissions").update({ status: "rejected_ai" }).eq("id", submission_id);
      
      const newStrikes = (teamData.ai_strikes || 0) + 1;
      const isDisqualified = newStrikes >= 3; // 3 strikes = elimination

      await supabase.from("teams").update({
        ai_strikes: newStrikes,
        is_disqualified: isDisqualified
      }).eq("team_id", team_id);

      await supabase.from("activity_logs").insert({
        message: `WARNING: ${teamData.team_name} received an AI Strike. (${newStrikes}/3)`
      });

      if (isDisqualified) {
        await supabase.from("activity_logs").insert({
          message: `CRITICAL: ${teamData.team_name} has been DISQUALIFIED for repeated AI violations.`
        });
      }

      return NextResponse.json({ success: true, strikes: newStrikes, disqualified: isDisqualified });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Admin action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
