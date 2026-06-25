import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";

export async function GET() {
  try {
    const submissionsSnapshot = await db
      .collection("submissions")
      .orderBy("timestamp", "desc")
      .get();

    const submissions = await Promise.all(
      submissionsSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        // Fetch the associated team to get current strikes
        const teamDoc = await db.collection("teams").doc(data.team_id).get();
        const teamData = teamDoc.data() || {};
        const ts = data.timestamp;
        const date = ts?.toDate ? ts.toDate() : ts instanceof Date ? ts : new Date(ts || Date.now());

        return {
          id: doc.id,
          team_id: data.team_id,
          team_name: data.team_name,
          level_id: data.level_id,
          answer: data.answer,
          proof_url: data.proof_url,
          status: data.status,
          submitted_at: date.toISOString(),
          ai_strikes: teamData.ai_strikes || 0
        };
      })
    );

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("Admin submissions fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
