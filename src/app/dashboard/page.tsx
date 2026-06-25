"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface DashboardData {
  team: {
    id: string;
    name: string;
    current_level: number;
    hints_used: number;
    ai_strikes: number;
    score: number;
    fragments: string[];
    startedAt: number;
  };
  liveFeed: { id: string; time: string; text: string; }[];
  activeAgents: { id: string; name: string; level: number; status: string; }[];
  total_levels: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [fragments, setFragments] = useState<string[]>(Array(9).fill(""));
  const [submission, setSubmission] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hintWarning, setHintWarning] = useState(false);
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [activeHintLink, setActiveHintLink] = useState<string | null>(null);

  const [timeLeft, setTimeLeft] = useState("90:00:00");
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [selectedHintId, setSelectedHintId] = useState<number | null>(null);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.status === 401) {
        router.push("/");
        return;
      }
      const json = await res.json();
      if (json.error) {
        console.error("Dashboard API returned an error:", json.error, json.stack);
        return;
      }
      setData(json);
      if (loading && json.team) {
        setFragments(json.team.fragments);
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!data?.team?.startedAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - data.team.startedAt;
      const remaining = Math.max(0, 90 * 60 * 1000 - elapsed);
      
      const totalSeconds = Math.floor(remaining / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      
      setTimeLeft(
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
      setElapsedMinutes(Math.floor(elapsed / 60000));
    }, 1000);

    return () => clearInterval(interval);
  }, [data?.team?.startedAt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission || !proofFile) return;
    setSubmitting(true);

    try {
      // Compress image to Base64 to bypass Firebase Storage paywalls and fit within Firestore limits
      const reader = new FileReader();
      reader.readAsDataURL(proofFile);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Export as compressed JPEG base64 (quality 0.6)
          const base64Proof = canvas.toDataURL("image/jpeg", 0.6);

          const formData = new FormData();
          formData.append("action", "submit");
          formData.append("answer", submission);
          formData.append("proofBase64", base64Proof); // Send the base64 string instead of the file

          const res = await fetch("/api/dashboard/action", { method: "POST", body: formData });
          const json = await res.json();
          if (json.success) {
            setSubmission("");
            setProofFile(null);
            alert("Success! " + json.message);
          } else {
            alert("Error: " + json.error);
          }
          setSubmitting(false);
        };
      };
    } catch (err) {
      console.error(err);
      alert("Submission failed. Please try again.");
      setSubmitting(false);
    }
  };

  const handleHintClick = (hintId: number) => {
    setSelectedHintId(hintId);
    setHintWarning(true);
  };
  const confirmHint = async () => {
    setHintWarning(false);
    try {
      const formData = new FormData();
      formData.append("action", "hint");
      formData.append("hintId", data?.team.current_level.toString() || "1");
      const res = await fetch("/api/dashboard/action", { method: "POST", body: formData });
      const json = await res.json();
      if (json.success) {
        setActiveHint(json.hint);
        setActiveHintLink(json.hintLink);
        fetchDashboardData();
      } else {
        alert("Error: " + json.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setActiveHint(null);
    setActiveHintLink(null);
  }, [data?.team?.current_level]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-bg bg-grid-pattern flex items-center justify-center font-mono">
        <div className="text-accent text-xl tracking-widest animate-pulse">ESTABLISHING SECURE CONNECTION...</div>
      </div>
    );
  }

  const { team, activeAgents, total_levels } = data;

  const hintsConfig = [
    { id: 1, unlockMin: 10 },
    { id: 2, unlockMin: 20 },
    { id: 3, unlockMin: 30 },
    { id: 4, unlockMin: 40 },
    { id: 5, unlockMin: 50 },
  ];

  return (
    <div className="min-h-screen bg-bg bg-grid-pattern font-mono text-sm pb-12">
      
      {/* Navbar */}
      <header className="flex justify-between items-center px-6 py-4 bg-surface/80 backdrop-blur-md border-b border-surface2 sticky top-0 z-50">
        <div className="font-display font-bold text-lg text-white tracking-widest flex items-center gap-2">
          <span className="text-accent text-glow">O</span>OPERATION VAULT
        </div>
        <div className="flex items-center gap-6">
          <div className="text-text2">
            AGENT: <span className="text-accent font-bold tracking-widest">{team?.name || "UNKNOWN"}</span>
          </div>
          <button 
            onClick={() => router.push("/")}
            className="text-red hover:text-white border border-red/30 hover:border-red px-3 py-1 rounded transition-colors text-xs tracking-widest uppercase"
          >
            Disconnect
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 mt-8">
        
        {/* Top Hero Bar (Timer & Strike Status) */}
        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          <div className="flex-1 bg-surface border border-surface2 rounded-xl p-6 shadow-lg flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50"></div>
            <div className="text-6xl font-display font-bold text-accent text-glow mb-2 tracking-wider">{timeLeft}</div>
            <div className="text-text3 text-xs tracking-widest uppercase font-bold">Time Remaining</div>
          </div>
          <div className="bg-surface border border-surface2 rounded-xl p-6 shadow-lg flex items-center justify-center gap-12">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber mb-1">{team?.hints_used || 0}</div>
              <div className="text-text3 text-[10px] tracking-widest uppercase">Hints Used</div>
            </div>
            <div className="w-px h-12 bg-surface2"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red mb-1">{team?.ai_strikes || 0} / 3</div>
              <div className="text-text3 text-[10px] tracking-widest uppercase">AI Strikes</div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column (Scorecard) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* All Teams Status */}
            <div className="bg-surface border border-surface2 rounded-xl p-0 shadow-lg overflow-hidden flex flex-col h-full min-h-[800px]">
              <div className="p-4 border-b border-surface2 bg-surface2/20">
                <h3 className="text-text2 font-bold tracking-widest uppercase text-xs flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Active Agents
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-0">
                <table className="w-full text-left text-[10px]">
                  <thead className="text-text3 bg-bg/50 border-b border-surface2">
                    <tr>
                      <th className="font-medium p-3 tracking-widest">TEAM</th>
                      <th className="font-medium p-3 tracking-widest">LVL</th>
                      <th className="font-medium p-3 tracking-widest">STAT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface2">
                    {(!activeAgents || activeAgents.length === 0) ? (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-text3">No agents.</td>
                      </tr>
                    ) : (
                      activeAgents.map((agent: any) => (
                        <tr key={agent.id} className="hover:bg-surface2/30 transition-colors">
                          <td className="p-3">
                            <div className="text-white font-bold">{agent.name}</div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex gap-0.5 items-end h-4">
                                {Array.from({ length: 10 }).map((_, i) => (
                                  <div 
                                    key={i} 
                                    className={`w-1.5 rounded-sm transition-all ${i < agent.level ? 'bg-accent shadow-[0_0_5px_rgba(0,255,136,0.5)]' : 'bg-surface2/50'}`}
                                    style={{ height: `${Math.max(30, (i + 1) * 10)}%` }}
                                  />
                                ))}
                              </div>
                              <div className="text-accent text-[8px] font-bold tracking-widest">LVL {agent.level}/10</div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] tracking-widest uppercase font-bold border 
                              ${agent.status === 'Active' ? 'border-accent/30 text-accent bg-accent/5' : 
                                agent.status === 'Stuck' ? 'border-amber/30 text-amber bg-amber/5' : 
                                'border-red/30 text-red bg-red/5'}`}>
                              {agent.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Center Column (Mission Control) */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            
            {/* Mission Control */}
            <div className="bg-surface border border-surface2 rounded-xl p-6 shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-center mb-6 border-b border-surface2 pb-4">
                <h2 className="text-xl font-display font-bold text-white tracking-widest">
                  MISSION {team?.current_level || 1} <span className="text-text3">OF {total_levels || 10}</span>
                </h2>
                <span className="bg-accent/10 text-accent border border-accent/20 px-3 py-1 rounded text-xs font-bold tracking-widest">ACTIVE</span>
              </div>
              
              {team?.current_level === 1 && (
                <div className="mb-6 bg-accent/5 border border-accent/20 rounded-lg p-5">
                  <h3 className="text-accent font-bold mb-2 uppercase tracking-widest text-lg">The Game Begins</h3>
                  <p className="text-text2 leading-relaxed mb-4">Your first target is the TechAlfa public repository. Find the initial breach point.</p>
                  <a href="https://github.com/techalfatechnician-ngp/CyberHunt.git" target="_blank" className="text-blue underline underline-offset-4 decoration-blue/30 hover:text-white transition-colors break-all">
                    https://github.com/techalfatechnician-ngp/CyberHunt.git
                  </a>
                </div>
              )}

              <div className="mb-6 flex flex-col items-center bg-surface2/50 rounded-lg p-6 border border-surface2">
                <span className="text-text2 mb-4 text-xs tracking-widest uppercase font-bold">Encrypted Intel Vault</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                  {hintsConfig.map((hint) => {
                    const isLocked = elapsedMinutes < hint.unlockMin;
                    return (
                      <button 
                        key={hint.id}
                        onClick={() => !isLocked && handleHintClick(hint.id)}
                        disabled={isLocked}
                        className={`w-full py-3 px-4 rounded font-bold uppercase tracking-widest transition-all border flex flex-col items-center justify-center gap-1
                          ${isLocked 
                            ? 'bg-surface border-dashed border-surface2 text-text2 cursor-not-allowed' 
                            : 'bg-amber/10 text-amber hover:bg-amber hover:text-bg border-amber/30'}`}
                      >
                        <span className="text-sm">Hint {hint.id}</span>
                        {isLocked ? (
                          <span className="text-[9px] font-mono text-text3/70">Unlocks in {hint.unlockMin - elapsedMinutes}m</span>
                        ) : (
                          <span className="text-[9px] font-mono">Ready to Decrypt</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {hintWarning && !activeHint && (
                <div className="mb-6 bg-amber/10 border border-amber p-4 rounded-lg">
                  <h4 className="text-amber font-bold mb-2">WARNING: SCORE PENALTY</h4>
                  <p className="text-text2 text-xs mb-4">Decrypting this hint will permanently reduce your final score. Are you sure you want to proceed?</p>
                  <div className="flex gap-3">
                    <button onClick={confirmHint} className="bg-amber text-bg px-4 py-2 rounded text-xs font-bold uppercase">Confirm</button>
                    <button onClick={() => setHintWarning(false)} className="bg-surface2 text-text2 hover:text-white px-4 py-2 rounded text-xs font-bold uppercase">Cancel</button>
                  </div>
                </div>
              )}

              {activeHint && (
                <div className="mb-6 bg-accent/10 border border-accent p-6 rounded-lg w-full flex flex-col items-center text-center">
                  <h4 className="text-accent font-bold mb-4 uppercase tracking-widest text-sm">Decrypted Intel:</h4>
                  <p className="text-white text-lg mb-6 leading-relaxed">{activeHint}</p>
                  
                  {activeHintLink && (
                    <a 
                      href={activeHintLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-accent text-bg px-6 py-3 rounded-full font-bold uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,136,0.3)]"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      FOLLOW LEAD
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Submission Hub */}
            <div className="bg-surface border border-border/40 rounded-xl p-6 shadow-[0_0_30px_rgba(0,255,136,0.05)] relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              </div>
              <h3 className="text-accent font-bold tracking-widest uppercase mb-4 text-xs">Execute Submission</h3>
              <form onSubmit={handleSubmission} className="flex flex-col gap-4">
                <div>
                  <input
                    type="text"
                    value={submission}
                    onChange={(e) => setSubmission(e.target.value)}
                    required
                    placeholder="ENTER SECURED FRAGMENT..."
                    className="w-full bg-surface2/50 border border-border/20 rounded-lg px-4 py-3 text-white placeholder-text3 focus:outline-none focus:border-accent transition-colors font-mono text-sm uppercase"
                  />
                </div>
                <div className="flex items-center justify-between border border-dashed border-surface2 rounded-lg p-4 bg-bg/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-surface2 flex items-center justify-center text-text3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    </div>
                    <div>
                      <div className="text-text2 font-bold text-xs uppercase">{proofFile ? proofFile.name : "UPLOAD PROOF"}</div>
                      <div className="text-text3 text-[10px]">PNG, JPG (Max 5MB)</div>
                    </div>
                  </div>
                  <input 
                    type="file" 
                    required 
                    accept="image/png, image/jpeg"
                    onChange={(e) => setProofFile(e.target.files ? e.target.files[0] : null)}
                    className="text-xs text-text3 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-bold file:bg-surface2 file:text-white hover:file:bg-surface3 cursor-pointer" 
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-accent text-bg font-bold tracking-widest uppercase py-4 rounded-lg mt-2 hover:bg-[#00e67a] hover:shadow-[0_0_20px_rgba(0,255,136,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "UPLOADING TO MISSION CONTROL..." : "SUBMIT INTEL"}
                </button>
              </form>
            </div>

          </div>

          {/* Right Column (Fragments) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="bg-surface border border-surface2 rounded-xl p-6 shadow-lg">
              <h3 className="text-text2 font-bold tracking-widest uppercase mb-4 text-xs">Secured Fragments</h3>
              <div className="grid grid-cols-3 gap-2">
                {fragments.map((frag, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute -top-1.5 -left-1.5 text-[8px] text-text3 font-bold bg-surface px-1 z-10">L{idx + 1}</div>
                    <input
                      type="text"
                      maxLength={1}
                      value={frag}
                      readOnly
                      placeholder="?"
                      className="w-full aspect-square bg-bg border border-surface2 rounded-md text-center text-xl font-bold text-white placeholder-text3/30 focus:outline-none transition-all uppercase relative cursor-not-allowed"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
