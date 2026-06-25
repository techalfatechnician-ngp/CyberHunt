import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const teamDocRef = db.collection("teams").doc(user.team_id);
    const teamDoc = await teamDocRef.get();
    
    if (!teamDoc.exists) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    let teamData = teamDoc.data()!;

    // Initialize game timer on first dashboard load
    if (!teamData.started_at) {
      const now = new Date();
      await teamDocRef.update({ started_at: now });
      teamData.started_at = now;
    }

    const startTime = teamData.started_at?.toMillis ? teamData.started_at.toMillis() : teamData.started_at instanceof Date ? teamData.started_at.getTime() : Date.now();
    // Fetch active agents (other teams)
    const teamsSnapshot = await db.collection("teams").orderBy("score", "desc").limit(50).get();
    const activeAgents = teamsSnapshot.docs.map(doc => {
      const data = doc.data();
      const lastSub = data.last_submission_at;
      const subTime = lastSub?.toMillis ? lastSub.toMillis() : lastSub?.getTime ? lastSub.getTime() : Date.now();
      
      return {
        id: data.team_id,
        name: data.team_name,
        level: data.current_level || 1,
        status: data.is_disqualified ? "Disqualified" : (Date.now() - subTime > 1000 * 60 * 60 * 2) ? "Stuck" : "Active"
      };
    });

    // Fetch Live Network Feed
    const feedSnapshot = await db.collection("activity_logs").orderBy("timestamp", "desc").limit(10).get();
    const liveFeed = feedSnapshot.docs.map(doc => {
      const data = doc.data();
      const ts = data.timestamp;
      const date = ts?.toDate ? ts.toDate() : ts instanceof Date ? ts : new Date(ts || Date.now());
      const timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
      return {
        id: doc.id,
        time: timeString,
        text: data.message
      };
    });

    return NextResponse.json({
      team: {
        id: teamData.team_id,
        name: teamData.team_name,
        current_level: teamData.current_level || 1,
        hints_used: teamData.global_hints_used || 0,
        ai_strikes: teamData.ai_strikes || 0,
        score: teamData.score || 0,
        fragments: teamData.fragments || Array(9).fill(""),
        startedAt: startTime,
      },
      liveFeed,
      activeAgents,
      total_levels: 10
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: error.message || "Internal server error", stack: error.stack }, { status: 500 });
  }
}
