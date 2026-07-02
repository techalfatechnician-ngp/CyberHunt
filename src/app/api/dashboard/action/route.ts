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
      const hint_num_str = formData.get("hint_num") || "1";
      const hint_num = parseInt(hint_num_str.toString(), 10);
      const lvl = parseInt(level_id.toString(), 10);
      
      const { data: team } = await supabase.from("teams").select("*").eq("team_id", user.team_id).single();
      if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
      
      const { data: levelDoc } = await supabase.from("levels").select("*").eq("level_id", lvl).single();
      
      if (!levelDoc) return NextResponse.json({ error: "Level not found" }, { status: 404 });
      
      // Determine time penalty (in minutes)
      let timePenaltyMins = 0;
      if (lvl >= 1 && lvl <= 3) timePenaltyMins = 4;
      else if (lvl >= 4 && lvl <= 6) timePenaltyMins = 5;
      else if (lvl >= 7 && lvl <= 9) timePenaltyMins = 6;
      
      // Shift started_at backwards to deduct time
      let newStartedAt = team.started_at;
      if (timePenaltyMins > 0 && team.started_at) {
        const startedDate = new Date(team.started_at);
        startedDate.setMinutes(startedDate.getMinutes() - timePenaltyMins);
        newStartedAt = startedDate.toISOString();
      }

      // Track hints per level
      const levelHints = team.level_hints || {};
      const currentHintsForLevel = levelHints[lvl.toString()] || 0;
      let globalHints = team.global_hints_used || 0;
      // Only increment if they haven't already taken this hint number
      if (hint_num > currentHintsForLevel) {
        levelHints[lvl.toString()] = hint_num;
        globalHints += 1;
      }
      
      const hintData = (hint_num === 2 ? levelDoc.hint_2 : levelDoc.hint_1) || "No hint available for this level.";
      
      await supabase.from("teams").update({
        started_at: newStartedAt,
        level_hints: levelHints,
        global_hints_used: globalHints
      }).eq("team_id", user.team_id);

      // Log activity
      await supabase.from("activity_logs").insert({
        message: `${team.team_name} decrypted Hint ${hint_num} for Level ${lvl} (-${timePenaltyMins}m penalty)`
      });

      return NextResponse.json({ success: true, hint: hintData });
    }

    if (action === "submit") {
      const answer = formData.get("answer") as string;
      const proofBase64 = formData.get("proofBase64") as string;
      const level_id_str = formData.get("level_id") as string;
      const level_id = parseInt(level_id_str, 10) || 1;
      
      if (!answer || !proofBase64) return NextResponse.json({ error: "Answer and proof are required" }, { status: 400 });

      const { data: teamData } = await supabase.from("teams").select("*").eq("team_id", user.team_id).single();
      if (!teamData) return NextResponse.json({ error: "Team not found" }, { status: 404 });

      if (level_id === 10) {
        const attempts = teamData.level10_attempts || 0;
        if (attempts >= 2) {
          return NextResponse.json({ error: "MAXIMUM ATTEMPTS REACHED. MISSION LOCKED." }, { status: 403 });
        }
        if (answer.toUpperCase().trim() !== "ARCHLINUX") {
          await supabase.from("teams").update({ level10_attempts: attempts + 1 }).eq("team_id", user.team_id);
          const remaining = 2 - (attempts + 1);
          if (remaining <= 0) {
            return NextResponse.json({ error: "INCORRECT KEY. Maximum attempts reached. Mission locked." }, { status: 403 });
          } else {
            return NextResponse.json({ error: `INCORRECT KEY. You have ${remaining} chance(s) remaining.` }, { status: 400 });
          }
        }
      }

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
      const POINTS_MAP = [100, 150, 220, 320, 450, 600, 800, 1050, 1350, 2000];
      const basePoints = POINTS_MAP[level_id - 1] || 1000;
      
      // Apply point penalty based on hints used for THIS level
      const hintsUsed = teamData.level_hints?.[level_id.toString()] || 0;
      let multiplier = 1.0;
      if (hintsUsed === 1) multiplier = 0.8; // -20%
      else if (hintsUsed >= 2) multiplier = 0.5; // -50% (-20% then -30%)
      
      const scoreInc = Math.floor(basePoints * multiplier);
      const newScore = (teamData.score || 0) + scoreInc;

      const fragments = teamData.fragments || Array(9).fill("");
      const levelIndex = level_id - 1;
      
      if (levelIndex >= 0 && levelIndex < 9) {
        fragments[levelIndex] = answer.substring(0, 1).toUpperCase();
      } else if (levelIndex === 9) {
        // Level 10 submission (final word)
      }
      
      const updatePayload: any = {
        score: newScore,
        last_submission_at: new Date().toISOString(),
        fragments,
        current_level: Math.max(teamData.current_level || 1, level_id < 10 ? level_id + 1 : 10)
      };

      if (level_id === 9) {
        updatePayload.level10_started_at = new Date().toISOString();
      }

      await supabase.from("teams").update(updatePayload).eq("team_id", user.team_id);

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
