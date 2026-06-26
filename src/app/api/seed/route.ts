import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";

export async function GET() {
  try {
    // 1. Create Test Teams
    const teams = [
      { id: "TEST-ALPHA", name: "Test Squad Alpha", email: "test@example.com", level: 1, score: 0 },
      { id: "TEST-BETA", name: "Beta Hackers", email: "beta@example.com", level: 3, score: 2500 },
      { id: "TEST-GAMMA", name: "Gamma Ray", email: "gamma@example.com", level: 2, score: 1000 },
      { id: "TEST-DELTA", name: "Delta Force", email: "delta@example.com", level: 5, score: 4800 },
      { id: "TEST-EPSILON", name: "Epsilon Elite", email: "epsilon@example.com", level: 4, score: 3600 },
      { id: "TEST-ZETA", name: "Zeta Zero", email: "zeta@example.com", level: 2, score: 900 }
    ];

    for (const t of teams) {
      await db.collection("teams").doc(t.id).set({
        team_id: t.id,
        team_name: t.name,
        leader_email: t.email,
        is_disqualified: false,
        global_hints_used: 0,
        ai_strikes: 0,
        current_level: t.level,
        score: t.score,
        fragments: Array(9).fill(""),
        last_submission_at: new Date()
      });

      // Add a dummy submission for each so they show up in the Admin Panel
      await db.collection("submissions").add({
        team_id: t.id,
        team_name: t.name,
        level_id: t.level,
        answer: `DUMMY_FLAG_${t.level}`,
        proof_url: "https://via.placeholder.com/800x400.png?text=Dummy+Proof",
        status: t.id === "TEST-ALPHA" ? "pending" : (Math.random() > 0.5 ? "approved" : "rejected"),
        timestamp: new Date()
      });
    }

    // 2. Create the 10 Levels
    const levels = [
      { level_id: "1", answer_hash: "START", fragment: "C", hint_1: "Look at the commit history in the CyberHunt repo.", hint_link: "https://instagram.com" },
      { level_id: "2", answer_hash: "FLAG2", fragment: "Y", hint_1: "Check the hidden branch.", hint_link: "https://instagram.com" },
      { level_id: "3", answer_hash: "FLAG3", fragment: "B", hint_1: "Inspect the network tab.", hint_link: "https://instagram.com" },
      { level_id: "4", answer_hash: "FLAG4", fragment: "E", hint_1: "Look inside the cookies.", hint_link: "https://instagram.com" },
      { level_id: "5", answer_hash: "FLAG5", fragment: "R", hint_1: "Decode the Base64 string.", hint_link: "https://instagram.com" },
      { level_id: "6", answer_hash: "FLAG6", fragment: "H", hint_1: "Check the image EXIF data.", hint_link: "https://instagram.com" },
      { level_id: "7", answer_hash: "FLAG7", fragment: "U", hint_1: "Find the hidden CSS class.", hint_link: "https://instagram.com" },
      { level_id: "8", answer_hash: "FLAG8", fragment: "N", hint_1: "Look for the invisible text.", hint_link: "https://instagram.com" },
      { level_id: "9", answer_hash: "FLAG9", fragment: "T", hint_1: "Check the console logs.", hint_link: "https://instagram.com" },
      { level_id: "10", answer_hash: "FINAL", fragment: "!", hint_1: "Combine all fragments.", hint_link: "https://instagram.com" }
    ];

    const batch = db.batch();
    levels.forEach(level => {
      const ref = db.collection("levels").doc(level.level_id);
      batch.set(ref, level);
    });

    await batch.commit();

    // 3. Create Event Config
    await db.collection("event_settings").doc("config").set({
      event_start: new Date(),
      is_paused: false
    });

    // 4. Clear old activity logs to start fresh
    const logs = await db.collection("activity_logs").get();
    const deleteBatch = db.batch();
    logs.docs.forEach(doc => {
      deleteBatch.delete(doc.ref);
    });
    await deleteBatch.commit();

    // Log the event start
    await db.collection("activity_logs").add({
      message: "SYSTEM: Operation Techalfa Vault has officially launched. Test data seeded successfully.",
      timestamp: new Date()
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
