import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: configDoc } = await supabase.from("event_settings").select("*").eq("id", "config").single();
    const config = configDoc || {};
    
    // For now, assume results are always "published" in this simple version,
    // or you can check config.results_published
    const isPublished = config.results_published === true;
    
    if (!isPublished) {
      return NextResponse.json({ 
        published: false,
        message: "Results are still being verified."
      });
    }

    const { data: teamsSnapshot } = await supabase
      .from("teams")
      .select("*")
      .eq("is_disqualified", false)
      .order("score", { ascending: false })
      .order("current_level", { ascending: false })
      .order("last_submission_at", { ascending: true })
      .limit(3);

    const winners = (teamsSnapshot || []).map((data) => {
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
