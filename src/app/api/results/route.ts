import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const configDoc = await db.collection("event_settings").doc("config").get();
    const config = configDoc.data() || {};
    
    // For now, assume results are always "published" in this simple version,
    // or you can check config.results_published
    const isPublished = config.results_published === true;
    
    if (!isPublished) {
      return NextResponse.json({ 
        published: false,
        message: "Results are still being verified."
      });
    }

    const teamsSnapshot = await db
      .collection("teams")
      .where("is_disqualified", "==", false)
      .orderBy("score", "desc")
      .orderBy("current_level", "desc")
      .orderBy("last_submission_at", "asc")
      .limit(3)
      .get();

    const winners = teamsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        team_id: data.team_id,
        team_name: data.team_name,
        score: data.score || 0,
        level: data.current_level || 1,
      };
    });

    return NextResponse.json({
      published: true,
      winners,
      disqualified_count: 0 // Optional query
    });
  } catch (error) {
    console.error("Results error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
