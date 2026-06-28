import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

// In-memory cache to prevent Firebase quota exhaustion (50k reads/day limit)
let globalCache = {
  activeAgents: [] as any[],
  liveFeed: [] as any[],
  lastFetch: 0
};

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: team, error } = await supabase
      .from("teams")
      .select("*")
      .eq("team_id", user.team_id)
      .single();
    
    if (error || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    let teamData = team;

    // Initialize game timer on first dashboard load
    if (!teamData.started_at) {
      const now = new Date().toISOString();
      await supabase.from("teams").update({ started_at: now }).eq("team_id", user.team_id);
      teamData.started_at = now;
    }

    const startTime = new Date(teamData.started_at).getTime();
    
    const now = Date.now();
    // Cache for 30 seconds to drastically reduce DB reads
    if (now - globalCache.lastFetch > 30000) {
      // Fetch active agents (other teams)
      const { data: teamsSnapshot } = await supabase
        .from("teams")
        .select("*")
        .order("score", { ascending: false })
        .limit(50);
        
      globalCache.activeAgents = (teamsSnapshot || []).map(data => {
        const lastSub = data.last_submission_at;
        const subTime = lastSub ? new Date(lastSub).getTime() : Date.now();
        
        return {
          id: data.team_id,
          name: data.team_name,
          level: data.current_level || 1,
          status: data.is_disqualified ? "Disqualified" : (Date.now() - subTime > 1000 * 60 * 60 * 2) ? "Stuck" : "Active"
        };
      });

      // Fetch Live Network Feed
      const { data: feedSnapshot } = await supabase
        .from("activity_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(10);
        
      globalCache.liveFeed = (feedSnapshot || []).map(data => {
        const ts = data.timestamp;
        const date = new Date(ts || Date.now());
        const timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
        return {
          id: data.id,
          time: timeString,
          text: data.message
        };
      });

      globalCache.lastFetch = now;
    }

    return NextResponse.json({
      team: {
        id: teamData.team_id,
        name: teamData.team_name,
        current_level: teamData.current_level || 1,
        hints_used: teamData.global_hints_used || 0,
        ai_strikes: teamData.ai_strikes || 0,
        score: teamData.score || 0,
        fragments: teamData.fragments || Array(9).fill(""),
        is_disqualified: teamData.is_disqualified || false,
        startedAt: startTime,
      },
      liveFeed: globalCache.liveFeed,
      activeAgents: globalCache.activeAgents,
      total_levels: 10
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: error.message || "Internal server error", stack: error.stack }, { status: 500 });
  }
}
