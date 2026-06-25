import { NextRequest, NextResponse } from "next/server";
import { db, storage } from "@/lib/firebase/admin";
import { getAuthUser } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const action = formData.get("action");

    const teamDocRef = db.collection("teams").doc(user.team_id);

    if (action === "save_fragments") {
      const fragmentsStr = formData.get("fragments") as string;
      const fragments = JSON.parse(fragmentsStr);
      await teamDocRef.update({ fragments });
      return NextResponse.json({ success: true });
    }

    if (action === "hint") {
      const teamDoc = await teamDocRef.get();
      const current_level = teamDoc.data()?.current_level || 1;
      const hints_used = teamDoc.data()?.global_hints_used || 0;
      
      const levelDoc = await db.collection("levels").doc(current_level.toString()).get();
      if (!levelDoc.exists) return NextResponse.json({ error: "Level not found" }, { status: 404 });
      
      const hintData = levelDoc.data()?.hint_1 || "No hint available for this level.";
      const hintLinkData = levelDoc.data()?.hint_link || null;
      
      await teamDocRef.update({
        global_hints_used: hints_used + 1
      });

      // Log activity
      await db.collection("activity_logs").add({
        message: `${teamDoc.data()?.team_name} decrypted a hint for Level ${current_level}`,
        timestamp: new Date()
      });

      return NextResponse.json({ success: true, hint: hintData, hintLink: hintLinkData });
    }

    if (action === "submit") {
      const answer = formData.get("answer") as string;
      const proofBase64 = formData.get("proofBase64") as string;
      
      if (!answer || !proofBase64) return NextResponse.json({ error: "Answer and proof are required" }, { status: 400 });

      const teamDoc = await teamDocRef.get();
      const current_level = teamDoc.data()?.current_level || 1;

      // We store the submission for Admin approval
      await db.collection("submissions").add({
        team_id: user.team_id,
        team_name: teamDoc.data()?.team_name,
        level_id: current_level,
        answer: answer.toUpperCase().trim(),
        proof_url: proofBase64,
        status: "pending",
        timestamp: new Date()
      });

      // INSTANT ADVANCEMENT: User advances immediately, gets fragment, and score
      const newLevel = current_level + 1;
      const teamData = teamDoc.data();
      const scoreInc = 1000 - (teamData?.global_hints_used || 0) * 100;
      const newScore = (teamData?.score || 0) + (scoreInc > 0 ? scoreInc : 100);

      const fragments = teamData?.fragments || Array(9).fill("");
      const levelIndex = current_level - 1;
      if (levelIndex >= 0 && levelIndex < 9) {
        fragments[levelIndex] = answer.substring(0, 1).toUpperCase();
      }

      await teamDocRef.update({
        current_level: newLevel,
        score: newScore,
        last_submission_at: new Date(),
        fragments
      });

      await db.collection("activity_logs").add({
        message: `${teamData?.team_name} uploaded Intel for Level ${current_level} and instantly advanced to Level ${newLevel}.`,
        timestamp: new Date()
      });

      return NextResponse.json({ success: true, message: `Submission sent! You have advanced to Level ${newLevel}.` });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Dashboard action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
