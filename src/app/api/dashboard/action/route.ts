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
      const proof = formData.get("proof") as File;
      
      if (!answer || !proof) return NextResponse.json({ error: "Answer and proof are required" }, { status: 400 });

      const teamDoc = await teamDocRef.get();
      const current_level = teamDoc.data()?.current_level || 1;

      // Upload proof to Firebase Storage
      const fileBuffer = await proof.arrayBuffer();
      const fileName = `proofs/${user.team_id}/level_${current_level}_${uuidv4()}_${proof.name}`;
      const bucket = storage.bucket();
      const file = bucket.file(fileName);
      
      await file.save(Buffer.from(fileBuffer), {
        metadata: { contentType: proof.type }
      });

      // Construct standard Firebase Storage URL without calling makePublic() which crashes on new buckets
      const proofUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;

      // We just store the submission for Admin approval
      // In a real automated system we might check answer hash here, but the user said Admin approves proofs.
      await db.collection("submissions").add({
        team_id: user.team_id,
        team_name: teamDoc.data()?.team_name,
        level_id: current_level,
        answer: answer.toUpperCase().trim(),
        proof_url: proofUrl,
        status: "pending",
        timestamp: new Date()
      });

      await db.collection("activity_logs").add({
        message: `${teamDoc.data()?.team_name} uploaded Intel for Level ${current_level}`,
        timestamp: new Date()
      });

      return NextResponse.json({ success: true, message: "Submission sent to Mission Control for verification." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Dashboard action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
