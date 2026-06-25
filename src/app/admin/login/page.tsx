"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.push("/admin/submissions");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red/10 via-bg to-bg">
      <header className="flex items-center justify-between px-6 py-4 border-b border-red/20 bg-surface/80 backdrop-blur-md">
        <Link href="/" className="font-display text-lg font-bold tracking-widest uppercase">
          <span className="text-white">&lt;</span>
          <span className="text-red drop-shadow-[0_0_8px_rgba(255,60,60,0.8)]">MISSION_CONTROL</span>
          <span className="text-white"> /&gt;</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-hidden">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none"></div>

        <div className="w-full max-w-md relative z-10 bg-surface/50 p-8 rounded-xl border border-red/20 shadow-[0_0_30px_rgba(255,60,60,0.1)] backdrop-blur-md">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold mb-2 text-red uppercase tracking-widest drop-shadow-[0_0_8px_rgba(255,60,60,0.8)]">Restricted Area</h1>
            <p className="text-text3 text-xs font-mono tracking-widest uppercase">Enter administrative passphrase</p>
          </div>

          {error && (
            <div className="bg-red/10 border border-red/50 text-red rounded px-4 py-3 mb-6 text-xs font-mono text-center tracking-widest uppercase shadow-[0_0_10px_rgba(255,60,60,0.2)]">
              ACCESS DENIED: {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] text-text mb-2 uppercase tracking-widest font-bold">PASSPHRASE</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-red font-mono text-sm opacity-50">root@admin:~$</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-bg/80 border border-red/30 rounded pl-[140px] pr-4 py-4 text-sm text-white placeholder:text-text3/50 focus:outline-none focus:border-red focus:bg-red/5 transition-all font-mono tracking-widest shadow-inner"
                  placeholder="******"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red/10 border border-red text-red font-bold py-4 mt-8 hover:bg-red hover:text-white shadow-[0_0_15px_rgba(255,60,60,0.2)] hover:shadow-[0_0_25px_rgba(255,60,60,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest font-mono rounded"
            >
              {loading ? "AUTHENTICATING..." : "AUTHORIZE"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
