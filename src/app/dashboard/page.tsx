"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tv, Puzzle, Lock, Unlock, Crosshair, CheckCircle2, AlertTriangle, Trophy } from "lucide-react";
import { motion } from "framer-motion";

interface DashboardData {
  team: {
    id: string;
    name: string;
    current_level: number;
    hints_used: number;
    ai_strikes: number;
    score: number;
    fragments: string[];
    is_disqualified?: boolean;
    startedAt: number;
    level10_started_at?: string | null;
    level_hints?: Record<string, number>;
    level10_attempts?: number;
  };
  liveFeed: { id: string; time: string; text: string; }[];
  activeAgents: { id: string; name: string; level: number; status: string; }[];
  total_levels: number;
}

const MISSIONS = [
  { id: 1, title: "THE INITIAL BREACH", desc: "Our intelligence indicates a vulnerability in TechAlfa's foundation. We've intercepted a link to their public repository. Inspect the building blocks closely—developers often leave whispers behind that were never meant to be executed. Find the first fragment hidden in plain sight.", link: "https://github.com/kharbikarsagar17-pixel/cipher-core.git" },
  { id: 2, title: "PHANTOM BRANCH", desc: "A hidden branch contains experimental code. Navigate through the commit history to uncover the hidden message.", link: "https://cyberhunt-2.vercel.app/login" },
  { id: 3, title: "NETWORK SHADOWS", desc: "Inspect the network payloads. A specific request is transmitting encrypted data in the headers. Intercept it.", link: "https://github.com/kharbikarsagar17-pixel/cipher-core.git" },
  { id: 4, title: "COOKIE JAR", desc: "The authentication system left a vulnerable trace in your browser cookies. Decode the session token.", link: "https://cyberhunt-2.vercel.app/login" },
  { id: 5, title: "BASE64 ANOMALY", desc: "We found a strange string in the server logs. It looks like standard Base64, but something is off. Decode it.", link: "#" },
  { id: 6, title: "EXIF GHOST", desc: "Analyze the provided image file. The metadata contains GPS coordinates that point to your next clue.", link: "https://techalfa-website-ivory.vercel.app/" },
  { id: 7, title: "DEBUG CHALLENGE", desc: "A compromised system log has been extracted into a PDF document. Your task is to analyze the traces and debug the sequence to find the fragment.", link: "/debug_challenge.pdf" },
  { id: 8, title: "THE DATA BREACH", desc: "A database export has been leaked. Find the compromised password hash for 'agent_alpha' and crack it using a rainbow table (MD5 decryption).", link: "/database_leak.txt" },
  { id: 9, title: "THE GHOST PROTOCOL", desc: "The server knows more than it shows. The page appears blank, but the protocol holds the key. Investigate the metadata of the response.", link: "https://secure-vault-endpoint.vercel.app/" },
  { id: 10, title: "THE FINAL DECRYPTION", desc: "You have collected all fragments. Unscramble the letters to form the final Master Key and shut down the rogue AI.", link: "#" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const [fragments, setFragments] = useState<string[]>(Array(9).fill(""));
  const [submission, setSubmission] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hintWarning, setHintWarning] = useState<boolean>(false);
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [activeHintLink, setActiveHintLink] = useState<string | null>(null);
  const [showVictory, setShowVictory] = useState<boolean>(false);

  const [selectedMission, setSelectedMission] = useState(1);

  const [timeLeft, setTimeLeft] = useState("120:00");
  const [isCritical, setIsCritical] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
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
      if (json.team) {
        setFragments(json.team.fragments);
        if (loading) {
          // Auto-select lowest unsolved mission
          const firstUnsolved = json.team.fragments.findIndex((f: string) => f === "") + 1;
          setSelectedMission(firstUnsolved > 0 && firstUnsolved <= 9 ? firstUnsolved : 10);
        }
      }
      if (loading) setLoading(false);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!data?.team?.startedAt) return;

    const interval = setInterval(() => {
      const now = Date.now();

      let elapsed;
      let remaining;

      if (selectedMission === 10) {
        // 15-minute countdown for Level 10
        elapsed = data.team.level10_started_at ? (now - new Date(data.team.level10_started_at).getTime()) : 0;
        remaining = data.team.level10_started_at ? Math.max(0, 15 * 60 * 1000 - elapsed) : 15 * 60 * 1000;
      } else {
        // 120-minute global countdown
        elapsed = now - data.team.startedAt;
        remaining = Math.max(0, 120 * 60 * 1000 - elapsed);
      }

      const totalSeconds = Math.floor(remaining / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft(
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
      setElapsedMinutes(Math.floor(elapsed / 60000));

      if (selectedMission === 10) {
        setIsCritical(totalSeconds < 60); // under 1 min
        setIsWarning(totalSeconds < 300 && totalSeconds >= 60); // under 5 min
      } else {
        setIsCritical(totalSeconds < 300); // under 5 min
        setIsWarning(totalSeconds < 900 && totalSeconds >= 300); // under 15 min
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [data?.team, selectedMission]);

  useEffect(() => {
    setSubmission("");
    setProofFile(null);
    setActiveHint(null);
    setActiveHintLink(null);
  }, [selectedMission]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission) return;
    if (selectedMission !== 10 && !proofFile) return;

    setSubmitting(true);

    try {
      const submitData = async (base64Proof: string) => {
        const formData = new FormData();
        formData.append("action", "submit");
        formData.append("answer", submission);
        formData.append("proofBase64", base64Proof);
        formData.append("level_id", selectedMission.toString());

        const res = await fetch("/api/dashboard/action", { method: "POST", body: formData });
        const json = await res.json();
        if (json.success) {
          setSubmission("");
          setProofFile(null);

          // Instantly update local fragments to allow immediate jump
          const newFragments = [...fragments];
          if (selectedMission <= 9) {
            newFragments[selectedMission - 1] = submission.substring(0, 1).toUpperCase();
            setFragments(newFragments);
            alert(`✅ UPLOAD SUCCESSFUL!\n\n${json.message || 'Transmission successful.'}`);

            // Jump to the next unsolved mission automatically!
            const firstUnsolved = newFragments.findIndex(f => f === "") + 1;
            setSelectedMission(firstUnsolved > 0 && firstUnsolved <= 9 ? firstUnsolved : 10);
          } else {
            // Mission 10 victory!
            setShowVictory(true);
          }

          fetchDashboardData();
        } else {
          alert("❌ TRANSMISSION ERROR: " + json.error);
          if (json.error.toLowerCase().includes("maximum attempts reached") || json.error.toLowerCase().includes("mission locked")) {
            router.push("/");
          }
        }
        setSubmitting(false);
      };

      if (selectedMission === 10) {
        // No proof required for Level 10
        await submitData("NO_PROOF_REQUIRED");
      } else {
        const reader = new FileReader();
        reader.readAsDataURL(proofFile as File);
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

            const base64Proof = canvas.toDataURL("image/jpeg", 0.6);
            await submitData(base64Proof);
          };
        };
      }
    } catch (err) {
      console.error(err);
      alert("❌ CRITICAL FAILURE: Submission failed to transmit. Please try again.");
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
      formData.append("level_id", selectedMission.toString());
      formData.append("hint_num", selectedHintId?.toString() || "1");
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

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-bg0 flex items-center justify-center font-mono">
        <div className="text-[var(--color-neon)] text-xl tracking-widest animate-pulse">ESTABLISHING SECURE CONNECTION...</div>
      </div>
    );
  }

  const { team, activeAgents } = data;
  const securedFragmentsCount = fragments.filter(f => f !== "").length;
  const allFragmentsSecured = securedFragmentsCount === 9;
  const isMission10Locked = !allFragmentsSecured;

  let hintsConfig: any[] = [];
  if (selectedMission < 10) {
    let timePenalty = 4;
    let unlockMin1 = 4;
    let unlockMin2 = 8;

    if (selectedMission >= 1 && selectedMission <= 3) {
      timePenalty = 4;
      unlockMin1 = 4 + ((selectedMission - 1) * 8);
      unlockMin2 = 8 + ((selectedMission - 1) * 8);
    } else if (selectedMission >= 4 && selectedMission <= 6) {
      timePenalty = 5;
      unlockMin1 = 24 + 5 + ((selectedMission - 4) * 10);
      unlockMin2 = 24 + 10 + ((selectedMission - 4) * 10);
    } else if (selectedMission >= 7 && selectedMission <= 9) {
      timePenalty = 6;
      unlockMin1 = 54 + 6 + ((selectedMission - 7) * 12);
      unlockMin2 = 54 + 12 + ((selectedMission - 7) * 12);
    }

    const levelHintsMap = team?.level_hints || {};
    const hintsUsedForThisLevel = levelHintsMap[selectedMission.toString()] || 0;

    hintsConfig = [
      { id: 1, cost: `-${timePenalty}M / -20% PTS`, used: hintsUsedForThisLevel >= 1, unlockMin: unlockMin1 },
      { id: 2, cost: `-${timePenalty}M / -30% PTS`, used: hintsUsedForThisLevel >= 2, unlockMin: unlockMin2 },
    ];
  }

  if (team?.is_disqualified) {
    return (
      <div className="min-h-screen bg-bg0 flex flex-col items-center justify-center font-mono p-6">
        <div className="bg-red/10 border-2 border-[var(--color-red)] rounded-xl p-12 max-w-2xl w-full text-center shadow-[0_0_50px_rgba(255,51,51,0.2)]">
          <svg className="w-24 h-24 text-[var(--color-red)] mx-auto mb-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          <h1 className="text-4xl font-orb font-bold text-[var(--color-red)] tracking-widest mb-4">ACCESS DENIED</h1>
          <h2 className="text-xl text-white mb-6 uppercase tracking-widest">Team Disqualified</h2>
          <p className="text-[var(--color-text2)] mb-8">
            Your team has been permanently locked out of Mission Control due to excessive AI strikes or severe rule violations.
          </p>
          <button onClick={() => router.push("/")} className="bg-red/20 text-[var(--color-red)] border border-[var(--color-red)] hover:bg-[var(--color-red)] hover:text-black px-8 py-3 rounded tracking-widest uppercase transition-colors">
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  const currentMissionObj = MISSIONS.find(m => m.id === selectedMission) || MISSIONS[0];
  const isCurrentMissionSolved = selectedMission < 10 ? fragments[selectedMission - 1] !== "" : false;

  return (
    <div className="min-h-screen bg-bg0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,255,136,0.05)_0%,transparent_60%)] flex flex-col overflow-hidden">

      {/* TOP BAR */}
      <div className="relative flex items-center justify-between px-10 h-[80px] bg-gradient-to-r from-bg1 via-bg2 to-bg1 border-b border-neon/20 shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(0,255,136,0.05)] backdrop-blur-md bg-opacity-95 overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.06] pointer-events-none"></div>
        {/* Bottom indicator line */}
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-neon/20 to-transparent"></div>

        {/* LEFT LOGO SECTION */}
        <div className="flex items-center gap-6 relative z-10">
          {/* Pulsing beacon wrapped in a telemetry border */}
          <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
            <div className="absolute w-4 h-4 rounded-full border border-neon/30 animate-ping"></div>
            <div className="absolute w-2 h-2 rounded-full bg-neon shadow-[0_0_8px_#00FF88] animate-pulse"></div>
            <div className="absolute -inset-1 border border-neon/10 rounded-sm pointer-events-none"></div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-orb text-[20px] font-black tracking-[4px] text-white text-glow-white leading-none">OPERATION</span>
              <span className="font-orb text-[20px] font-black tracking-[4px] text-neon text-glow-green leading-none">VAULT</span>
            </div>
            <span className="font-mono text-[9px] text-text2/70 tracking-[2px] mt-1.5 flex items-center gap-1.5 leading-none">
              <span className="text-neon/50">[SYS.LOC: C01]</span> // CLASSIFIED OPERATIONS CENTRE
            </span>
          </div>
        </div>

        {/* CENTER STAT BAR - Countdown Timer */}
        <div className="flex items-center gap-6 relative z-10 mx-auto">
          <div className="w-[1px] h-10 bg-gradient-to-b from-transparent via-border-g2/20 to-transparent hidden md:block"></div>

          <div className="flex flex-col items-center justify-center">
            <div className={`px-12 py-1.5 bg-[#05080c] border ${isCritical ? 'border-red/40 shadow-[inset_0_0_15px_rgba(255,77,109,0.15),0_0_10px_rgba(255,77,109,0.1)]' : isWarning ? 'border-amber/40 shadow-[inset_0_0_15px_rgba(255,200,87,0.15),0_0_10px_rgba(255,200,87,0.1)]' : 'border-neon/30 shadow-[inset_0_0_15px_rgba(0,255,136,0.1),0_0_10px_rgba(0,255,136,0.05)]'} rounded-sm relative overflow-hidden group min-w-[200px] flex justify-center`}>
              {/* Corner accents */}
              <div className={`absolute top-0 left-0 w-1.5 h-1.5 border-t border-l ${isCritical ? 'border-red' : isWarning ? 'border-amber' : 'border-neon'}`}></div>
              <div className={`absolute top-0 right-0 w-1.5 h-1.5 border-t border-r ${isCritical ? 'border-red' : isWarning ? 'border-amber' : 'border-neon'}`}></div>
              <div className={`absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l ${isCritical ? 'border-red' : isWarning ? 'border-amber' : 'border-neon'}`}></div>
              <div className={`absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r ${isCritical ? 'border-red' : isWarning ? 'border-amber' : 'border-neon'}`}></div>

              <span className={`font-orb text-[30px] font-black tracking-[4px] leading-tight ${isCritical ? 'text-red text-glow-red animate-blink' : isWarning ? 'text-amber text-glow-amber' : 'text-neon text-glow-green'}`}>
                {timeLeft}
              </span>
            </div>
          </div>

          <div className="w-[1px] h-10 bg-gradient-to-b from-transparent via-border-g2/20 to-transparent hidden md:block"></div>
        </div>

        {/* RIGHT AGENT & DISCONNECT SECTION */}
        <div className="flex items-center gap-6 relative z-10">
          <div className="flex flex-col items-end gap-1.5 pr-2">
            <span className="text-[9px] text-text2/50 font-mono tracking-[1.5px] uppercase leading-none">OPERATIONAL AGENT</span>
            <span className="text-neon font-orb text-[15px] font-bold tracking-[2px] text-glow-green uppercase leading-none">{team?.name || "UNKNOWN"}</span>
          </div>

          <div className="w-[1px] h-8 bg-border-g2/20"></div>

          <button
            onClick={() => router.push("/")}
            className="border border-red/40 text-red bg-[#0a0709] px-6 py-2.5 font-orb text-[10px] tracking-[2px] uppercase transition-all duration-300 hover:bg-red/10 hover:text-white hover:border-red hover:shadow-[0_0_15px_rgba(255,77,109,0.3)] hover:scale-[1.02] active:scale-[0.98] rounded-sm relative overflow-hidden group"
          >
            <span className="relative z-10">DISCONNECT</span>
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-red/0 via-red/5 to-red/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          </button>
        </div>
      </div>

      {/* STRIKES BAR */}
      <div className="bg-bg0 border-b border-border-g2 h-8 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {[1, 2, 3].map(strike => (
              <div key={strike} className={`w-2.5 h-2.5 rounded-full border border-red ${strike <= (team?.ai_strikes || 0) ? 'bg-red shadow-[0_0_8px_rgba(255,51,51,0.8)]' : 'bg-transparent'}`}></div>
            ))}
          </div>
          <span className="font-mono text-[10px] text-red tracking-[2px] uppercase">
            {(team?.ai_strikes || 0) > 0 ? `${team?.ai_strikes} STRIKE${team?.ai_strikes > 1 ? 'S' : ''} RECORDED` : 'STATUS: CLEAR'}
          </span>
        </div>
        <span className="font-mono text-[9px] text-text2 tracking-[2px] uppercase">3 strikes = disqualification</span>
      </div>

      {/* MAIN 3-COL GRID */}
      <div className="grid grid-cols-[260px_1fr_260px] min-h-0 flex-1 overflow-hidden">

        {/* LEFT COLUMN */}
        <div className="bg-bg1 border-r border-border-g2 flex flex-col overflow-hidden">
          {/* MISSION SELECT */}
          <div className="p-[14px_18px_10px] border-b border-border-g2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Crosshair size={14} className="text-neon" />
              <span className="font-orb text-[10px] font-bold tracking-[3px] text-white uppercase">MISSION SELECT</span>
            </div>
          </div>

          <div className="p-[16px_18px] grid grid-cols-2 gap-3 border-b border-border-g2 shrink-0 bg-bg0">
            {MISSIONS.map((m) => {
              const isActive = m.id === selectedMission;
              const isLocked = m.id === 10 && isMission10Locked;
              const isSolved = m.id < 10 && fragments[m.id - 1] !== "";

              let boxStyle = "border-border-g2 text-text2 hover:border-neon hover:text-white cursor-pointer bg-bg2";
              let numberColor = "text-text2";
              let extraIcon = null;

              if (isActive) {
                boxStyle = "border-neon text-neon bg-[rgba(0,255,136,0.1)] cursor-default shadow-[0_0_10px_rgba(0,255,136,0.2)]";
                numberColor = "text-neon";
              } else if (isSolved) {
                boxStyle = "border-[rgba(0,255,136,0.3)] text-[rgba(0,255,136,0.5)] bg-[rgba(0,255,136,0.05)] cursor-pointer hover:border-neon";
                numberColor = "text-[rgba(0,255,136,0.5)]";
                extraIcon = <CheckCircle2 size={12} className="absolute top-1.5 right-1.5 text-[rgba(0,255,136,0.5)]" />;
              } else if (isLocked) {
                boxStyle = "border-[rgba(255,51,51,0.3)] text-[rgba(255,51,51,0.5)] bg-[rgba(255,51,51,0.05)] cursor-not-allowed";
                numberColor = "text-[rgba(255,51,51,0.5)]";
                extraIcon = <Lock size={12} className="absolute top-1.5 right-1.5 text-[rgba(255,51,51,0.5)]" />;
              }

              return (
                <div
                  key={m.id}
                  onClick={() => {
                    if (isLocked) {
                      alert("⚠️ FINAL MISSION LOCKED. Secure all 9 fragments first.");
                      return;
                    }
                    setSelectedMission(m.id);
                  }}
                  className={`relative aspect-[2/1] border flex items-center justify-center transition-all ${boxStyle}`}
                >
                  <span className={`font-mono text-[14px] font-bold tracking-[0.5px] ${numberColor}`}>
                    MISSION {m.id.toString().padStart(2, '0')}
                  </span>
                  {extraIcon}
                </div>
              );
            })}
          </div>

          {/* TEAM STATUS */}
          <div className="p-5 flex items-center justify-center gap-8 border-b border-border-g2 bg-bg0">
            <div className="flex flex-col items-center justify-center">
              <span className="font-mono text-[10px] text-neon mb-1.5 uppercase whitespace-nowrap tracking-[2px]">Hints Used</span>
              <span className="font-orb text-[20px] text-white font-bold leading-none">{team?.hints_used || 0}</span>
            </div>

            <div className="w-[1px] h-10 bg-border-g2 opacity-80"></div>

            <div className="flex flex-col items-center justify-center">
              <span className="font-mono text-[10px] text-neon mb-1.5 uppercase whitespace-nowrap tracking-[2px]">AI Strikes</span>
              <span className={`font-orb text-[20px] font-bold leading-none ${team?.ai_strikes ? 'text-red text-glow-red' : 'text-white'}`}>{team?.ai_strikes || 0}<span className="text-[12px] text-text2/50">/3</span></span>
            </div>
          </div>

          {/* MISSION PROGRESS */}
          <div className="p-5 flex items-center justify-center gap-8 border-b border-border-g2 bg-bg0">
            <div className="flex flex-col items-center justify-center">
              <span className="font-mono text-[10px] text-neon mb-1.5 uppercase whitespace-nowrap tracking-[2px]">Active Sector</span>
              <span className="font-orb text-[20px] text-white font-bold leading-none">{selectedMission}<span className="text-[12px] text-text2/50">/10</span></span>
            </div>

            <div className="w-[1px] h-10 bg-border-g2 opacity-80"></div>

            <div className="flex flex-col items-center justify-center">
              <span className="font-mono text-[10px] text-neon mb-1.5 uppercase whitespace-nowrap tracking-[2px]">Keys Secured</span>
              <span className="font-orb text-[20px] text-neon font-bold text-glow-green leading-none">{securedFragmentsCount}<span className="text-[12px] opacity-50">/9</span></span>
            </div>
          </div>

          <div className="mt-auto"></div>
        </div>

        {/* CENTER COLUMN: MISSION CONTROL */}
        <div className="bg-bg0 p-6 overflow-y-auto relative">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,136,0.03)_1px,transparent_1px)] bg-[length:100%_4px] pointer-events-none opacity-50"></div>

          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex justify-between items-center pb-[14px] border-b border-border-g2">
              <div className="flex items-baseline gap-3">
                <div className="font-orb text-[24px] font-black text-white tracking-[2px]">
                  TARGET: <span className="text-neon">MISSION {selectedMission.toString().padStart(2, '0')}</span>
                </div>
                <div className="font-mono text-[14px] text-text2">OF 10</div>
              </div>
              <div className="font-orb text-[10px] font-bold tracking-[3px] p-[6px_16px] border border-neon text-neon bg-[rgba(0,255,136,0.08)] shadow-[0_0_10px_rgba(0,255,136,0.2)]">
                ● ACTIVE
              </div>
            </div>

            {/* MISSION DESCRIPTION BOX */}
            <div className="bg-bg2 border border-border-g2 border-l-4 border-l-neon p-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              <div className="font-orb text-[16px] font-bold text-neon tracking-[3px] mb-4 uppercase">{currentMissionObj.title}</div>
              <div className="font-raj text-[16px] leading-[1.7] text-text font-medium mb-6">
                {currentMissionObj.desc}
              </div>
              <div className="mt-4">
                <a
                  href={currentMissionObj.link}
                  target="_blank"
                  {...(currentMissionObj.link.startsWith('/') ? { download: true } : {})}
                  className="inline-flex items-center gap-2 font-mono text-[13px] text-[#00d4ff] no-underline border-b border-[#00d4ff44] pb-1 tracking-[1px] transition-colors hover:border-[#00d4ff] hover:text-[#00ffff]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
                  {currentMissionObj.link.toUpperCase()}
                </a>
              </div>
            </div>

            {/* ENCRYPTED INTEL VAULT */}
            <div className="font-orb text-[10px] font-bold tracking-[6px] text-text2 text-center p-[8px_0] mt-2 relative">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-border-g2 -z-10"></div>
              <span className="bg-bg0 px-4">— ENCRYPTED INTEL VAULT —</span>
            </div>

            {selectedMission < 10 && (
              <div className="grid grid-cols-2 gap-4">
                {hintsConfig.map((hint) => {
                  const isUsed = hint.used;
                  const isLocked = !isUsed && elapsedMinutes < hint.unlockMin;
                  return (
                    <div
                      key={hint.id}
                      onClick={() => !isUsed && !isLocked && handleHintClick(hint.id)}
                      className={`border p-[16px_12px] text-center relative transition-all duration-200 flex flex-col items-center justify-center min-h-[100px]
                        ${isUsed
                          ? 'bg-bg2 border-border-g cursor-not-allowed opacity-50'
                          : isLocked ? 'bg-bg2 border-border-g cursor-not-allowed opacity-50' : 'bg-[#ffaa0010] border-amber cursor-pointer hover:bg-[#ffaa0020]'}`}
                    >
                      {(isUsed || isLocked) ? <Lock size={14} className="absolute top-2 right-2 text-text2 opacity-30" /> : <Unlock size={14} className="absolute top-2 right-2 text-amber" />}
                      <div className={`font-orb text-[12px] font-bold tracking-[3px] mb-2 ${isUsed || isLocked ? 'text-text2' : 'text-amber'}`}>
                        HINT {hint.id}
                      </div>
                      <div className={`font-mono text-[10px] mb-3 ${isUsed || isLocked ? 'text-text2' : 'text-text opacity-80'}`}>
                        {isUsed ? 'DECRYPTED' : isLocked ? `UNLOCKS IN ${hint.unlockMin - elapsedMinutes}M` : 'Click to decrypt...'}
                      </div>
                      <div className={`font-mono text-[9px] font-bold tracking-[2px] p-[2px_8px] border rounded-sm
                        ${isUsed || isLocked ? 'border-border-g2 text-text2' : 'border-amber text-amber'}`}>
                        {hint.cost}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {hintWarning && !activeHint && (
              <div className="bg-[#ffaa0010] border border-amber p-4 mt-2">
                <h4 className="font-orb text-[11px] text-amber font-bold mb-2 tracking-[2px]">WARNING: SCORE PENALTY</h4>
                <p className="text-text2 text-xs mb-4 font-raj">Decrypting this hint will permanently reduce your final score. Are you sure you want to proceed?</p>
                <div className="flex gap-3">
                  <button onClick={confirmHint} className="bg-amber text-black px-4 py-2 text-[10px] font-orb font-bold tracking-[2px] hover:bg-[#ffbb33]">CONFIRM</button>
                  <button onClick={() => setHintWarning(false)} className="border border-border-g2 text-text2 hover:text-white px-4 py-2 text-[10px] font-orb font-bold tracking-[2px]">CANCEL</button>
                </div>
              </div>
            )}

            {activeHint && (
              <div className="bg-[rgba(0,255,136,0.1)] border border-neon p-6 w-full flex flex-col items-center text-center mt-2">
                <h4 className="font-orb text-[11px] text-neon font-bold mb-4 tracking-[3px]">DECRYPTED INTEL:</h4>
                <p className="text-white text-[15px] mb-6 leading-relaxed font-raj">{activeHint}</p>
                {activeHintLink && (
                  <a
                    href={activeHintLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-neon text-black px-6 py-2.5 font-orb font-bold tracking-[2px] text-[10px] hover:bg-[#00ffaa] hover:shadow-[0_0_15px_rgba(0,255,136,0.3)] transition-all"
                  >
                    FOLLOW LEAD
                  </a>
                )}
              </div>
            )}

            {/* TRANSMIT SOLUTION */}
            <div className="mt-2 pt-2">
              <div className="font-orb text-[10px] font-bold tracking-[6px] text-text2 text-center p-[8px_0] mb-4 relative">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-border-g2 -z-10"></div>
                <span className="bg-bg0 px-4">— TRANSMIT SOLUTION —</span>
              </div>

              {isCurrentMissionSolved ? (
                <div className="bg-[rgba(0,255,136,0.05)] border border-[rgba(0,255,136,0.3)] p-4 text-center">
                  <div className="font-orb text-[12px] text-neon font-bold tracking-[3px] mb-1">✅ MISSION SOLVED</div>
                  <div className="font-mono text-[10px] text-text2 tracking-[1px]">Fragment has been successfully secured for this sector.</div>
                </div>
              ) : (
                <>
                  {selectedMission === 10 && (
                    <div className={`font-mono text-[10px] mb-4 text-center p-2 rounded-sm tracking-widest ${(team?.level10_attempts || 0) >= 2 ? 'bg-red/20 text-red border border-red/30' : 'bg-amber/10 text-amber border border-amber/30'
                      }`}>
                      {(team?.level10_attempts || 0) >= 2
                        ? '❌ MAXIMUM ATTEMPTS REACHED. MISSION LOCKED.'
                        : `⚠️ WARNING: ${2 - (team?.level10_attempts || 0)} CHANCE(S) REMAINING`}
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="flex gap-3 items-stretch bg-bg2 p-4 border border-border-g2 shadow-lg">
                    <input
                      type="text"
                      value={submission}
                      onChange={(e) => setSubmission(e.target.value)}
                      required
                      maxLength={selectedMission === 10 ? 20 : 1}
                      placeholder={selectedMission === 10 ? "ENTER MASTER KEY..." : "ENTER SECURED FRAGMENT (1 LETTER)..."}
                      className="flex-1 bg-bg3 border border-border-g2 text-neon font-mono text-[16px] font-bold p-[12px_16px] outline-none tracking-[2px] placeholder:text-text2 placeholder:opacity-50 focus:border-neon transition-colors uppercase"
                      disabled={submitting || (selectedMission === 10 && (team?.level10_attempts || 0) >= 2)}
                    />
                    {selectedMission !== 10 && (
                      <div className="relative flex items-center justify-center border border-dashed border-border-g2 bg-bg3 px-5 hover:border-neon transition-colors group cursor-pointer overflow-hidden min-w-[160px]">
                        <input
                          type="file"
                          required
                          accept="image/png, image/jpeg"
                          onChange={(e) => setProofFile(e.target.files ? e.target.files[0] : null)}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          disabled={submitting}
                        />
                        <div className="flex flex-col items-center justify-center z-0 pointer-events-none">
                          <span className="font-orb text-[10px] font-bold tracking-[2px] text-text2 group-hover:text-white transition-colors">
                            {proofFile ? proofFile.name.substring(0, 15) + (proofFile.name.length > 15 ? '...' : '') : 'UPLOAD PROOF'}
                          </span>
                          <span className="font-mono text-[9px] text-text2 opacity-60 mt-1">{proofFile ? 'READY' : 'JPG / PNG'}</span>
                        </div>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={submitting || timeLeft === "00:00" || (selectedMission === 10 && (team?.level10_attempts || 0) >= 2)}
                      className="bg-neon text-black border-none font-orb text-[12px] font-bold tracking-[3px] p-[0_24px] cursor-pointer transition-colors hover:bg-[#00ffaa] hover:shadow-[0_0_15px_rgba(0,255,136,0.4)] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {submitting ? "TRANSMITTING..." : "SUBMIT"}
                    </button>
                  </form>
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-amber">
                    <AlertTriangle size={12} />
                    <span className="font-mono text-[10px] tracking-[1px] uppercase">1 submission per mission — choose carefully</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="bg-bg1 border-l border-border-g2 flex flex-col overflow-hidden">
          <div className="p-[14px_18px_10px] border-b border-border-g2 flex items-center gap-2 shrink-0">
            <Puzzle size={14} className="text-neon" />
            <span className="font-orb text-[10px] font-bold tracking-[3px] text-white uppercase">SECURED FRAGMENTS</span>
          </div>

          <div className="p-[16px_18px_10px] flex items-center justify-between shrink-0">
            <span className="font-orb text-[9px] font-bold tracking-[2px] text-text2">VAULT KEYS</span>
            <span className="font-mono text-[12px] font-bold text-neon">{securedFragmentsCount} / 9</span>
          </div>

          {/* 3x3 GRID */}
          <div className="grid grid-cols-3 gap-2 p-[0_18px_20px] shrink-0 border-b border-border-g2">
            {fragments.map((frag, idx) => {
              const isSecured = frag !== "";
              return (
                <div key={idx} className={`aspect-square bg-bg2 border flex flex-col items-center justify-center relative transition-all duration-200 cursor-default ${isSecured ? 'border-neon bg-[rgba(0,255,136,0.08)] shadow-[inset_0_0_15px_rgba(0,255,136,0.15)]' : 'border-border-g2'}`}>
                  <span className="absolute top-1 left-1.5 font-mono text-[9px] text-text2 opacity-60">L{idx + 1}</span>
                  {!isSecured ? (
                    <span className="font-mono text-[20px] text-border-g2">?</span>
                  ) : (
                    <span className="font-mono text-[24px] font-bold text-neon">{frag}</span>
                  )}
                </div>
              );
            })}
          </div>
          {/* LIVE NET STATUS */}
          <div className="p-[14px_18px_10px] border-b border-border-g2 flex items-center gap-2 shrink-0 bg-bg1">
            <Tv size={14} className="text-neon" />
            <span className="font-orb text-[10px] font-bold tracking-[3px] text-white uppercase">LIVE NET STATUS</span>
          </div>

          <div className="flex-1 overflow-y-auto bg-bg0">
            {!activeAgents || activeAgents.length === 0 ? (
              <div className="p-4 text-center text-text2 text-xs font-mono tracking-widest">NO SIGNALS DETECTED</div>
            ) : (
              activeAgents.map((agent: any, i: number) => {
                const isSelf = agent.id === team.id;
                const pips = Array.from({ length: 10 });
                return (
                  <div key={agent.id} className={`p-[10px_14px] border-b border-border-g flex items-center justify-between hover:bg-bg2 transition-colors cursor-pointer ${isSelf ? 'bg-[rgba(0,255,136,0.05)] border-l-2 border-l-neon' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`font-mono text-[10px] w-5 h-5 rounded-[2px] flex items-center justify-center font-bold
                        ${i === 0 ? 'bg-[#ffaa0022] text-amber border border-[#ffaa0044]' :
                          i === 1 ? 'bg-[#c0c0c022] text-[#c0c0c0] border border-[#c0c0c044]' :
                            i === 2 ? 'bg-[#cd7f3222] text-[#cd7f32] border border-[#cd7f3244]' :
                              'bg-bg3 text-text2'}`}>
                        {(i + 1).toString().padStart(2, '0')}
                      </div>
                      <div className="overflow-hidden">
                        <div className={`font-raj text-[13px] font-bold tracking-[1px] truncate max-w-[120px] ${isSelf ? 'text-neon' : i === 0 ? 'text-amber' : 'text-text'}`}>
                          {agent.name}
                        </div>
                        <div className="flex gap-[2px] mt-[3px]">
                          {pips.map((_, idx) => (
                            <div
                              key={idx}
                              className={`w-[5px] h-[5px] rounded-sm ${idx < agent.level ? (i === 0 ? 'bg-amber' : 'bg-neon') : 'bg-border-g2'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className={`font-mono text-[11px] font-bold ${isSelf || i === 0 ? 'text-amber' : 'text-neon'}`}>
                      {agent.level}/10
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* DECODED WORD */}
          <div className="p-[14px_18px] shrink-0 bg-bg1">
            <div className="font-orb text-[9px] font-bold tracking-[3px] text-text2 mb-3">DECODED WORD</div>
            <div className="flex justify-between gap-[4px]">
              {Array.from({ length: 9 }).map((_, i) => {
                const letter = fragments[i];
                const isRevealed = letter !== "";
                return (
                  <div key={i} className={`flex-1 aspect-[3/4] border flex items-center justify-center transition-colors
                    ${isRevealed ? 'border-neon bg-[rgba(0,255,136,0.1)]' : 'border-border-g2 bg-bg2'}`}>
                    {isRevealed ? (
                      <span className="font-mono text-[14px] font-bold text-neon">{letter}</span>
                    ) : (
                      <span className="font-mono text-[12px] text-border-g2">_</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {showVictory && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,136,0.15)_0%,transparent_70%)]" />
          <motion.div
            initial={{ scale: 0.5, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5, duration: 1 }}
            className="relative z-10 flex flex-col items-center text-center p-8 border border-neon/30 bg-bg0/80 rounded-2xl shadow-[0_0_50px_rgba(0,255,136,0.2)] max-w-2xl w-full mx-4"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ delay: 1, duration: 1, repeat: Infinity, repeatDelay: 3 }}
            >
              <Trophy size={100} className="text-[#ffd700] mb-8 drop-shadow-[0_0_20px_rgba(255,215,0,0.5)]" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-4xl md:text-5xl font-orb font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ffd700] to-[#ffaa00] mb-4 tracking-[4px]"
            >
              CONGRATULATIONS
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="text-2xl md:text-3xl font-mono font-bold text-neon mb-8 tracking-[2px]"
            >
              MASTER KEY ACCEPTED
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="text-text2 font-raj text-lg max-w-lg mb-8 leading-relaxed"
            >
              You have successfully decrypted the final sequence and shut down the rogue AI. Mission Control commends your exceptional performance.
            </motion.p>

            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2 }}
              onClick={() => setShowVictory(false)}
              className="bg-neon text-black font-orb font-bold tracking-[3px] px-8 py-3 rounded hover:bg-[#00ffaa] hover:shadow-[0_0_20px_rgba(0,255,136,0.5)] transition-all"
            >
              RETURN TO DASHBOARD
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
