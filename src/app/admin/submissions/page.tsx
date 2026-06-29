"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";

interface Submission {
  id: string;
  team_id: string;
  team_name: string;
  level_id: number;
  answer: string;
  proof_url: string;
  status: string;
  submitted_at: string;
  ai_strikes: number;
  hints_used: number;
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
    const interval = setInterval(fetchSubmissions, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch("/api/admin/submissions");
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: "approve" | "reject" | "strike", submissionId: string, teamId: string) => {
    if (action === "strike" && !confirm("Are you sure you want to flag this for AI usage? The team will get a strike.")) return;

    // Optimistic UI update
    setSubmissions(prev => prev.map(s =>
      s.id === submissionId ? { ...s, status: action === 'strike' ? 'rejected_ai' : action === 'approve' ? 'approved' : 'rejected' } : s
    ));

    try {
      const res = await fetch("/api/admin/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, submission_id: submissionId, team_id: teamId })
      });

      const data = await res.json();
      if (data.success) {
        if (action === "strike") {
          if (data.disqualified) {
            alert(`CRITICAL: Team has received their 3rd strike and is DISQUALIFIED!`);
          } else {
            alert(`Strike applied! Team now has ${data.strikes}/3 strikes.`);
          }
        }
      }
    } catch (err) {
      console.error(err);
      fetchSubmissions(); // revert optimistic update
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg text-accent font-mono animate-pulse">
        Loading Mission Control feed...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg bg-grid-pattern p-6">
      <header className="flex justify-between items-center mb-8 border-b border-surface2 pb-4 bg-surface/80 backdrop-blur px-6 rounded-xl border">
        <div>
          <h1 className="text-2xl font-display font-bold text-accent tracking-widest uppercase mb-1 flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /></svg>
            MISSION CONTROL
          </h1>
          <p className="text-text3 font-mono text-xs">MONITORING ALL INCOMING INTEL UPLOADS</p>
        </div>
        <div className="text-right">
          <div className="text-white font-bold mb-1 tracking-widest text-sm uppercase">PENDING APPROVALS: {submissions.length}</div>
          <Link href="/" className="text-text3 hover:text-accent font-mono text-xs border border-surface2 px-4 py-2 hover:border-accent rounded transition-colors uppercase tracking-widest">
            Return to Base
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {submissions.map((sub) => (
          <div key={sub.id} className="bg-surface border border-surface2 rounded-xl p-4 flex flex-col shadow-lg">

            <div className="flex justify-between items-start mb-3 border-b border-surface2 pb-3">
              <div>
                <div className="text-accent font-mono font-bold text-sm truncate max-w-[150px]">{sub.team_name}</div>
                <div className="text-text3 font-mono text-[10px] mt-1">
                  LVL {sub.level_id} &middot; {new Date(sub.submitted_at).toLocaleTimeString()}
                </div>
                <div className="text-accent/80 font-mono text-[10px] mt-1 uppercase tracking-wider">
                  Hints Used: {sub.hints_used}
                </div>
              </div>
              <div className="flex gap-1" title={`${sub.ai_strikes}/3 AI Strikes`}>
                {[1, 2, 3].map(i => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i <= sub.ai_strikes ? 'bg-red shadow-[0_0_8px_#ff3c3c]' : 'bg-surface2 border border-surface2'}`} />
                ))}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-text3 text-[10px] tracking-widest uppercase mb-1">Decrypted Flag:</div>
              <div className="text-white font-mono bg-bg p-2 border border-surface2 rounded">{sub.answer}</div>
            </div>

            <div className="text-text3 text-[10px] tracking-widest uppercase mb-1 flex justify-between">
              <span>Uploaded Proof:</span>
              <span className={`font-bold ${sub.status === 'pending' ? 'text-accent' :
                  sub.status === 'approved' ? 'text-green-500' :
                    'text-red'
                }`}>{sub.status.toUpperCase()}</span>
            </div>
            <div className="relative aspect-video w-full bg-bg rounded mb-4 overflow-hidden border border-surface2">
              <a href={sub.proof_url} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sub.proof_url}
                  alt={`Proof from ${sub.team_name}`}
                  className="object-contain w-full h-full opacity-90 hover:opacity-100 hover:scale-105 transition-all cursor-pointer"
                />
              </a>
            </div>

            {sub.status === "pending" && (
              <>
                <div className="mt-auto grid grid-cols-2 gap-2 mb-2">
                  <Button
                    variant="primary"
                    className="w-full text-xs py-2 bg-accent/20 text-accent border border-accent/50 hover:bg-accent hover:text-bg"
                    onClick={() => handleAction("approve", sub.id, sub.team_id)}
                  >
                    APPROVE
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-xs py-2 border border-surface2 hover:bg-surface2"
                    onClick={() => handleAction("reject", sub.id, sub.team_id)}
                  >
                    REJECT
                  </Button>
                </div>

                <Button
                  variant="danger"
                  className="w-full text-xs py-2 mt-2 bg-red/10 text-red border border-red/30 hover:bg-red hover:text-white"
                  onClick={() => handleAction("strike", sub.id, sub.team_id)}
                >
                  ⚡ AI STRIKE
                </Button>
              </  >
            )}
          </div>
        ))}

        {submissions.length === 0 && (
          <div className="col-span-full py-16 text-center text-text3 font-mono border border-dashed border-surface2 rounded-xl bg-surface/50">
            <div className="text-accent mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            NO INCOMING DATA STREAMS DETECTED
          </div>
        )}
      </div>
    </div>
  );
}
