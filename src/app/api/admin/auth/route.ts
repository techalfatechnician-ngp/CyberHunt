import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSPHRASE = process.env.ADMIN_PASSPHRASE || "TECHALFA_ADMIN_2026";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    let cleanPassword = (password || "").trim();
    const prefixMatch = cleanPassword.match(/^admin\s*:\s*(.*)$/i);
    if (prefixMatch) {
      cleanPassword = prefixMatch[1].trim();
    }

    if (cleanPassword === ADMIN_PASSPHRASE) {
      const response = NextResponse.json({ success: true });
      
      // Set the admin cookie
      response.cookies.set({
        name: "cyberhunt_admin_token",
        value: "VERIFIED",
        httpOnly: true,
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      });

      return response;
    }

    return NextResponse.json({ error: "Invalid passphrase" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
