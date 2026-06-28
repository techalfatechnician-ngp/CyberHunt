import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";


export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const action = formData.get("action");

    if (action === "save_fragments") {
      const fragmentsStr = formData.get("fragments") as string;
      const fragments = JSON.parse(fragmentsStr);
      await supabase.from("teams").update({ fragments }).eq("team_id", user.team_id);
      return NextResponse.json({ success: true });
    }

    if (action === "hint") {
      const level_id = formData.get("level_id") || "1";
      
      const { data: team } = await supabase.from("teams").select("*").eq("team_id", user.team_id).single();
      if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
      
      const hints_used = team.global_hints_used || 0;
      
      const { data: levelDoc } = await supabase.from("levels").select("*").eq("level_id", parseInt(level_id.toString())).single();
      
      if (!levelDoc) return NextResponse.json({ error: "Level not found" }, { status: 404 });
      
      const hintData = levelDoc.hint_1 || "No hint available for this level.";
      const hintLinkData = levelDoc.hint_link || null;
      
      await supabase.from("teams").update({
        global_hints_used: hints_used + 1,
        score: Math.max(0, (team.score || 0) - 200)
      }).eq("team_id", user.team_id);

      // Log activity
      await supabase.from("activity_logs").insert({
        message: `${team.team_name} decrypted a hint for Level ${level_id}`
      });

      return NextResponse.json({ success: true, hint: hintData, hintLink: hintLinkData });
    }

    if (action === "submit") {
      const answer = formData.get("answer") as string;
      const proofBase64 = formData.get("proofBase64") as string;
      const level_id_str = formData.get("level_id") as string;
      const level_id = parseInt(level_id_str, 10) || 1;
      
      if (!answer || !proofBase64) return NextResponse.json({ error: "Answer and proof are required" }, { status: 400 });

      const { data: teamData } = await supabase.from("teams").select("*").eq("team_id", user.team_id).single();
      if (!teamData) return NextResponse.json({ error: "Team not found" }, { status: 404 });

      // Store the submission for Admin review
      await supabase.from("submissions").insert({
        team_id: user.team_id,
        team_name: teamData.team_name,
        level_id: level_id,
        answer: answer.toUpperCase().trim(),
        proof_url: proofBase64,
        status: "pending"
      });

      // INSTANT ADVANCEMENT: User unlocks fragment immediately
      const scoreInc = 1000;
      const newScore = (teamData.score || 0) + scoreInc;

      const fragments = teamData.fragments || Array(9).fill("");
      const levelIndex = level_id - 1;
      
      if (levelIndex >= 0 && levelIndex < 9) {
        fragments[levelIndex] = answer.substring(0, 1).toUpperCase();
      } else if (levelIndex === 9) {
        // Level 10 submission (final word)
      }

      await supabase.from("teams").update({
        score: newScore,
        last_submission_at: new Date().toISOString(),
        fragments
      }).eq("team_id", user.team_id);

      await supabase.from("activity_logs").insert({
        message: `${teamData.team_name} uploaded Intel for Level ${level_id}.`
      });

      return NextResponse.json({ success: true, message: `Submission for Level ${level_id} sent!` });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Dashboard action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
