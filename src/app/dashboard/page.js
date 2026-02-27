"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Bell, Sparkles, Bookmark, Clock, Trophy, 
  CheckCircle2, Flame, BarChart3, Vote, Plus, X, RefreshCw
} from "lucide-react";

export default function DashboardHome() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState("");
  const [deadline, setDeadline] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [syncStats, setSyncStats] = useState({ points: 0, streak: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [polls, setPolls] = useState([]);
  const [syncing, setSyncing] = useState(false);

  // Poll creation state
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [creatingPoll, setCreatingPoll] = useState(false);
  const [pollMessage, setPollMessage] = useState("");

  const syncTips = [
    "Check the Material section for the latest notes!",
    "Sync your attendance daily to earn CSBS Points.",
    "New assignments are posted every Monday morning.",
    "Don't forget to update your profile with your correct ID.",
    "Join the discussion in the class group for lab updates."
  ];

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const headers = { "Authorization": `Bearer ${token}` };

    try {
      const [annRes, workRes, lbRes, pollRes, statsRes] = await Promise.allSettled([
        fetch("/api/announcements"),
        fetch("/api/work"),
        fetch("/api/leaderboard"),
        fetch("/api/polls"),
        fetch("/api/sync-points", { headers }),
      ]);

      if (annRes.status === "fulfilled") {
        const d = await annRes.value.json();
        if (d.success) setAnnouncements(d.announcements);
      }

      if (workRes.status === "fulfilled") {
        const d = await workRes.value.json();
        if (d.success && d.work?.length > 0) {
          const sorted = d.work.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
          const nearest = sorted.find(w => new Date(w.deadline) > new Date());
          if (nearest) setDeadline(nearest);
        }
      }

      if (lbRes.status === "fulfilled") {
        const d = await lbRes.value.json();
        if (d.success) setLeaderboard(d.leaderboard);
      }

      if (pollRes.status === "fulfilled") {
        const d = await pollRes.value.json();
        if (d.success) setPolls(d.polls);
      }

      if (statsRes.status === "fulfilled") {
        const d = await statsRes.value.json();
        if (d.success) setSyncStats({ points: d.points, streak: d.streak });
      }

    } catch (err) {
      console.error("fetchData error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setQuote(syncTips[Math.floor(Math.random() * syncTips.length)]);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!deadline) return;
    const interval = setInterval(() => {
      const diff = new Date(deadline.deadline) - new Date();
      if (diff <= 0) { setTimeLeft("EXPIRED"); clearInterval(interval); return; }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/sync-points", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      alert(data.message);
      if (data.success) setSyncStats({ points: data.points, streak: data.streak });
    } catch {
      alert("Network error. Please check your connection.");
    } finally {
      setSyncing(false);
    }
  };

  const handleVote = async (pollId, optionId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/polls", {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ pollId, optionId })
      });
      const data = await res.json();
      if (data.success) {
        setPolls(polls.map(p => p._id === pollId ? data.poll : p));
      } else {
        alert(data.message);
      }
    } catch { console.error("Vote failed"); }
  };

  const handleCreatePoll = async () => {
    const validOptions = pollOptions.filter(o => o.trim());
    if (!pollQuestion.trim() || validOptions.length < 2) {
      setPollMessage("Please enter a question and at least 2 options.");
      return;
    }
    setCreatingPoll(true);
    setPollMessage("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ question: pollQuestion, options: validOptions })
      });
      const data = await res.json();
      if (data.success) {
        setPolls([data.poll, ...polls]);
        setPollQuestion("");
        setPollOptions(["", ""]);
        setShowPollModal(false);
        setPollMessage("");
      } else {
        setPollMessage(data.message || "Failed to create poll.");
      }
    } catch {
      setPollMessage("Network error. Please try again.");
    } finally {
      setCreatingPoll(false);
    }
  };

  const medalColors = [
    "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
    "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
    "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-6">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-indigo-900" />
          <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" />
        </div>
        <p className="font-bold text-slate-400 dark:text-slate-500 animate-pulse tracking-widest text-xs uppercase">Syncing Ecosystem...</p>
      </div>
    );
  }

  return (
    <div className="text-slate-900 dark:text-slate-100">

      {/* ─── Poll Creation Modal ─── */}
      {showPollModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-800"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">Create a Poll</h2>
                <p className="text-slate-400 text-sm mt-1">Engage your classmates with a quick question</p>
              </div>
              <button
                onClick={() => { setShowPollModal(false); setPollMessage(""); }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Poll Question</label>
                <textarea
                  value={pollQuestion}
                  onChange={e => setPollQuestion(e.target.value)}
                  placeholder="e.g. Are you ready for tomorrow's lab?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 block">Answer Options</label>
                <div className="space-y-3">
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-black flex items-center justify-center shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <input
                        value={opt}
                        onChange={e => {
                          const updated = [...pollOptions];
                          updated[i] = e.target.value;
                          setPollOptions(updated);
                        }}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {pollOptions.length < 5 && (
                  <button
                    onClick={() => setPollOptions([...pollOptions, ""])}
                    className="mt-3 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:text-indigo-700 transition-colors"
                  >
                    <Plus size={16} /> Add another option
                  </button>
                )}
              </div>

              {pollMessage && (
                <p className="text-red-500 text-sm font-medium bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-2xl">{pollMessage}</p>
              )}

              <button
                onClick={handleCreatePoll}
                disabled={creatingPoll}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-indigo-500/25"
              >
                {creatingPoll ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Publishing...</>
                ) : (
                  <><Vote size={20} /> Publish Poll</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ─── Hero Section ─── */}
      <section className="px-6 md:px-8 pt-10 pb-14">
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          {/* Left: Greeting + Countdown */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-sm font-bold"
            >
              <Sparkles size={15} />
              {quote}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.1 } }}
              className="text-4xl md:text-[3.25rem] font-black text-slate-900 dark:text-white tracking-tight leading-tight"
            >
              Master Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-500 to-purple-600">
                Momentum
              </span>
            </motion.h1>

            {/* Countdown Card */}
            {deadline ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                className="bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-700 dark:to-indigo-900 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/30 dark:shadow-indigo-900/50 flex flex-col sm:flex-row items-center justify-between gap-5"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-4 rounded-2xl shrink-0">
                    <Clock size={28} />
                  </div>
                  <div>
                    <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest">{deadline.subject} · Upcoming</p>
                    <p className="text-white font-bold text-lg leading-tight mt-0.5">{deadline.work}</p>
                  </div>
                </div>
                <div className="text-center sm:text-right shrink-0">
                  <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Time Left</p>
                  <p className="text-3xl font-black font-mono tabular-nums text-white">{timeLeft}</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl text-center"
              >
                <p className="text-slate-400 dark:text-slate-500 font-semibold">✨ No upcoming deadlines — enjoy the calm!</p>
              </motion.div>
            )}
          </div>

          {/* Right: Daily Sync Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, transition: { delay: 0.15 } }}
            className="bg-white dark:bg-slate-800/80 rounded-[2rem] p-7 border border-slate-100 dark:border-slate-700 shadow-xl dark:shadow-black/30"
          >
            <div className="flex justify-between items-start mb-7">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white">Daily Sync</h3>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5">Log in daily to earn points</p>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900/30 p-2.5 rounded-2xl text-orange-500">
                <Flame size={22} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-7">
              <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl p-4 text-center">
                <p className="text-[10px] uppercase font-black tracking-widest text-indigo-400 dark:text-indigo-500 mb-1">Sync Points</p>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{syncStats.points}</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-4 text-center">
                <p className="text-[10px] uppercase font-black tracking-widest text-orange-400 mb-1">Day Streak</p>
                <p className="text-2xl font-black text-orange-600 dark:text-orange-400">{syncStats.streak} 🔥</p>
              </div>
            </div>

            <button
              onClick={handleSync}
              disabled={syncing}
              className={`w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-3 transition-all shadow-lg ${
                syncing 
                  ? "bg-slate-400 dark:bg-slate-600 cursor-not-allowed" 
                  : "bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 shadow-slate-900/20 dark:shadow-indigo-500/25 active:scale-[0.97]"
              }`}
            >
              {syncing ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Syncing...</>
              ) : (
                <><CheckCircle2 size={20} /> Check In Now</>
              )}
            </button>
          </motion.div>
        </div>
      </section>

      {/* ─── Main Content ─── */}
      <div className="px-6 md:px-8 pb-20">
        <div className="grid lg:grid-cols-3 gap-10">

          {/* ── Left: Announcements + Polls ── */}
          <div className="lg:col-span-2 space-y-12">

            {/* Announcements */}
            <section>
              <div className="flex items-center justify-between mb-7">
                <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
                    <Bell className="text-indigo-600 dark:text-indigo-400" size={18} />
                  </div>
                  New Broadcasts
                </h2>
                <a href="/dashboard/announcement" className="text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline">
                  View All →
                </a>
              </div>

              {announcements.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-5">
                  {announcements.slice(0, 4).map((a) => (
                    <motion.div
                      key={a._id}
                      whileHover={{ y: -4 }}
                      className="bg-white dark:bg-slate-800/80 rounded-[1.75rem] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-lg dark:hover:shadow-black/20 transition-all cursor-pointer group"
                    >
                      <div className="h-40 overflow-hidden relative">
                        <img
                          src={a.imageUrl || "https://img.icons8.com/cute-clipart/512/no-image.png"}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          alt={a.topic}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                        <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                          {a.category}
                        </span>
                      </div>
                      <div className="p-5">
                        <h4 className="font-bold text-slate-800 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{a.topic}</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">{a.details}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-700">
                  <p className="text-slate-400 dark:text-slate-500 italic font-medium">No announcements yet.</p>
                </div>
              )}
            </section>

            {/* Live Polls */}
            <section>
              <div className="flex items-center justify-between mb-7">
                <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/40">
                    <Vote className="text-purple-600 dark:text-purple-400" size={18} />
                  </div>
                  Live Polls
                </h2>
                <button
                  onClick={() => setShowPollModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-500/25"
                >
                  <Plus size={16} />
                  Create Poll
                </button>
              </div>

              <div className="space-y-5">
                {polls.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <Vote className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={32} />
                    <p className="text-slate-400 dark:text-slate-500 font-semibold">No active polls.</p>
                    <button
                      onClick={() => setShowPollModal(true)}
                      className="mt-4 text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:underline"
                    >
                      Be the first to create one →
                    </button>
                  </div>
                ) : (
                  polls.map(poll => {
                    const total = poll.options.reduce((s, o) => s + o.votes, 0);
                    return (
                      <div
                        key={poll._id}
                        className="bg-white dark:bg-slate-800/80 rounded-[1.75rem] p-7 border border-slate-100 dark:border-slate-700 shadow-sm"
                      >
                        <p className="font-black text-slate-800 dark:text-white mb-6 text-base leading-snug">{poll.question}</p>
                        <div className="space-y-3">
                          {poll.options.map(opt => {
                            const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                            return (
                              <button
                                key={opt._id}
                                onClick={() => handleVote(poll._id, opt._id)}
                                className="w-full text-left group"
                              >
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{opt.text}</span>
                                  <span className="text-xs font-black text-slate-400 dark:text-slate-500">{pct}% · {opt.votes}</span>
                                </div>
                                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full"
                                  />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest mt-5">{total} vote{total !== 1 ? "s" : ""} cast · Click an option to vote</p>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-8">

            {/* Leaderboard */}
            <section className="bg-white dark:bg-slate-800/80 rounded-[2rem] p-7 border border-slate-100 dark:border-slate-700 shadow-xl dark:shadow-black/30">
              <div className="flex items-center gap-3 mb-7">
                <div className="p-2 rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
                  <Trophy className="text-yellow-600 dark:text-yellow-400" size={18} />
                </div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white">Top Contributors</h3>
              </div>

              <div className="space-y-4">
                {leaderboard.length > 0 ? (
                  leaderboard.map((u, i) => (
                    <div key={u._id} className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${medalColors[i] || "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"}`}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-800 dark:text-white truncate">{u.username}</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{u.contributionScore} pts</p>
                      </div>
                      <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 shrink-0">{u.syncPoints} SP</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 dark:text-slate-500 text-center py-6 italic">Ranking loading...</p>
                )}
              </div>

              <button
                onClick={fetchData}
                className="w-full mt-7 py-3 rounded-2xl border border-slate-100 dark:border-slate-700 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} />
                Refresh
              </button>
            </section>

            {/* Quick Nav */}
            <section>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Quick Access</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { title: "Material", icon: <BarChart3 size={20} />, link: "/dashboard/material", bg: "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30", icon_bg: "bg-blue-600", text: "text-blue-600 dark:text-blue-400" },
                  { title: "Study Log", icon: <Bookmark size={20} />, link: "/dashboard/study", bg: "bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30", icon_bg: "bg-emerald-600", text: "text-emerald-600 dark:text-emerald-400" },
                  { title: "Work", icon: <Clock size={20} />, link: "/dashboard/work", bg: "bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30", icon_bg: "bg-orange-600", text: "text-orange-600 dark:text-orange-400" },
                  { title: "Announce", icon: <Bell size={20} />, link: "/dashboard/announcement", bg: "bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30", icon_bg: "bg-purple-600", text: "text-purple-600 dark:text-purple-400" },
                ].map(item => (
                  <a
                    key={item.title}
                    href={item.link}
                    className={`p-5 rounded-2xl ${item.bg} border border-transparent transition-all group`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${item.icon_bg} text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      {item.icon}
                    </div>
                    <p className={`font-black text-sm ${item.text}`}>{item.title}</p>
                  </a>
                ))}
              </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}
