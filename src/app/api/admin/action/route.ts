import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";
// In a real app we'd verify admin JWT, but for this event we'll skip or use a simple hardcoded secret for now.

export async function POST(request: NextRequest) {
  try {
    const { action, submission_id, team_id } = await request.json();

    if (!action || !submission_id || !team_id) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const teamRef = db.collection("teams").doc(team_id);
    const subRef = db.collection("submissions").doc(submission_id);

    const [teamDoc, subDoc] = await Promise.all([teamRef.get(), subRef.get()]);

    if (!teamDoc.exists || !subDoc.exists) {
      return NextResponse.json({ error: "Data not found" }, { status: 404 });
    }

    const teamData = teamDoc.data()!;
    const subData = subDoc.data()!;

    if (action === "approve") {
      await subRef.update({ status: "approved" });
      const newLevel = (teamData.current_level || 1) + 1;
      const scoreInc = 1000 - (teamData.global_hints_used || 0) * 100;
      const newScore = (teamData.score || 0) + (scoreInc > 0 ? scoreInc : 100);

      const fragments = teamData.fragments || Array(9).fill("");
      // Safely store the submitted fragment in the array based on their level
      const levelIndex = (subData.level_id || 1) - 1;
      if (levelIndex >= 0 && levelIndex < 9) {
        fragments[levelIndex] = subData.answer.substring(0, 1).toUpperCase();
      }

      await teamRef.update({
        current_level: newLevel,
        score: newScore,
        last_submission_at: new Date(),
        fragments
      });

      await db.collection("activity_logs").add({
        message: `Mission Control APPROVED Level ${subData.level_id} intel for ${teamData.team_name}. Proceeding to Level ${newLevel}.`,
        timestamp: new Date()
      });

      return NextResponse.json({ success: true });
    }

    if (action === "reject") {
      await subRef.update({ status: "rejected" });
      
      await db.collection("activity_logs").add({
        message: `Mission Control REJECTED intel for ${teamData.team_name}.`,
        timestamp: new Date()
      });

      return NextResponse.json({ success: true });
    }

    if (action === "strike") {
      await subRef.update({ status: "rejected_ai" });
      
      const newStrikes = (teamData.ai_strikes || 0) + 1;
      const isDisqualified = newStrikes >= 3; // 3 strikes = elimination

      await teamRef.update({
        ai_strikes: newStrikes,
        is_disqualified: isDisqualified
      });

      await db.collection("activity_logs").add({
        message: `WARNING: ${teamData.team_name} received an AI Strike. (${newStrikes}/3)`,
        timestamp: new Date()
      });

      if (isDisqualified) {
        await db.collection("activity_logs").add({
          message: `CRITICAL: ${teamData.team_name} has been DISQUALIFIED for repeated AI violations.`,
          timestamp: new Date()
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
