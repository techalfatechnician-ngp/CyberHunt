import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: submissionsSnapshot } = await supabase
      .from("submissions")
      .select("*")
      .order("timestamp", { ascending: false });

    const submissionsData = submissionsSnapshot || [];

    const submissions = await Promise.all(
      submissionsData.map(async (data) => {
        // Fetch the associated team to get current strikes
        const { data: teamData } = await supabase.from("teams").select("ai_strikes").eq("team_id", data.team_id).single();
        const ai_strikes = teamData?.ai_strikes || 0;
        
        const ts = data.timestamp;
        const date = new Date(ts || Date.now());

        return {
          id: data.id,
          team_id: data.team_id,
          team_name: data.team_name,
          level_id: data.level_id,
          answer: data.answer,
          proof_url: data.proof_url,
          status: data.status,
          submitted_at: date.toISOString(),
          ai_strikes
        };
      })
    );

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("Admin submissions fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
