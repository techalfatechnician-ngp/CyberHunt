import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // 1. Create Test Teams
    const teams = [
      { id: "TEST-ALPHA", name: "Test Squad Alpha", email: "test@example.com", level: 1, score: 0 },
      { id: "TEST-BETA", name: "Beta Hackers", email: "beta@example.com", level: 3, score: 2500 },
      { id: "TEST-GAMMA", name: "Gamma Ray", email: "gamma@example.com", level: 2, score: 1000 },
      { id: "TEST-DELTA", name: "Delta Force", email: "delta@example.com", level: 5, score: 4800 },
      { id: "TEST-EPSILON", name: "Epsilon Elite", email: "epsilon@example.com", level: 4, score: 3600 },
      { id: "TEST-ZETA", name: "Zeta Zero", email: "zeta@example.com", level: 2, score: 900 },
      { id: "TEST-ETA", name: "Eta Echo", email: "eta@example.com", level: 6, score: 5000 },
      { id: "TEST-THETA", name: "Theta Protocol", email: "theta@example.com", level: 1, score: 100 },
      { id: "TEST-IOTA", name: "Iota Insight", email: "iota@example.com", level: 8, score: 7200 },
      { id: "TEST-KAPPA", name: "Kappa Killers", email: "kappa@example.com", level: 3, score: 2100 }
    ];

    for (const t of teams) {
      const { error: upsertError } = await supabase.from("teams").upsert({
        team_id: t.id,
        team_name: t.name,
        leader_email: t.email,
        is_disqualified: false,
        global_hints_used: 0,
        ai_strikes: 0,
        current_level: t.level,
        score: t.score,
        fragments: Array(9).fill(""),
        last_submission_at: new Date().toISOString()
      });

      if (upsertError) throw upsertError;

      // Add a dummy submission for each so they show up in the Admin Panel
      await supabase.from("submissions").insert({
        team_id: t.id,
        team_name: t.name,
        level_id: t.level,
        answer: `DUMMY_FLAG_${t.level}`,
        proof_url: "https://via.placeholder.com/800x400.png?text=Dummy+Proof",
        status: t.id === "TEST-ALPHA" ? "pending" : (Math.random() > 0.5 ? "approved" : "rejected")
      });
    }

    // 2. Create the 10 Levels
    const levels = [
      { level_id: 1, hint_1: "Look at the commit history in the CyberHunt repo.", hint_link: "https://instagram.com" },
      { level_id: 2, hint_1: "Check the hidden branch.", hint_link: "https://instagram.com" },
      { level_id: 3, hint_1: "Inspect the network tab.", hint_link: "https://instagram.com" },
      { level_id: 4, hint_1: "Look inside the cookies.", hint_link: "https://instagram.com" },
      { level_id: 5, hint_1: "Decode the Base64 string.", hint_link: "https://instagram.com" },
      { level_id: 6, hint_1: "Check the image EXIF data.", hint_link: "https://instagram.com" },
      { level_id: 7, hint_1: "Find the hidden CSS class.", hint_link: "https://instagram.com" },
      { level_id: 8, hint_1: "Look for the invisible text.", hint_link: "https://instagram.com" },
      { level_id: 9, hint_1: "Check the console logs.", hint_link: "https://instagram.com" },
      { level_id: 10, hint_1: "Combine all fragments.", hint_link: "https://instagram.com" }
    ];

    await supabase.from("levels").upsert(levels);

    // 3. Create Event Config
    await supabase.from("event_settings").upsert({
      id: "config",
      start_time: new Date().toISOString(),
      is_active: true
    });

    // 4. Clear old activity logs to start fresh
    await supabase.from("activity_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

    // Log the event start
    await supabase.from("activity_logs").insert({
      message: "SYSTEM: Operation Techalfa Vault has officially launched. Test data seeded successfully."
    });

    return NextResponse.json({ 
      success: true, 
      message: "Database seeded successfully with NoSQL schema!",
      test_team: {
        email: "test@example.com",
        team_id: "TEST-ALPHA"
      },
      admin: {
        url: "/admin/login",
        passphrase: "TECHALFA_ADMIN_2026"
      }
    });

  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Failed to seed database" }, { status: 500 });
  }
}
