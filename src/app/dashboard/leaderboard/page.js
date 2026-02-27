"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Zap, Flame, Crown, Medal, Star, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myStats, setMyStats] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const [lbRes, statsRes] = await Promise.allSettled([
        fetch("/api/leaderboard"),
        fetch("/api/sync-points", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (lbRes.status === "fulfilled") {
        const d = await lbRes.value.json();
        if (d.success) setLeaderboard(d.leaderboard);
      }
      if (statsRes.status === "fulfilled") {
        const d = await statsRes.value.json();
        if (d.success) setMyStats(d);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const podiumConfig = [
    { rank: 2, scale: "scale-95", height: "h-28", bg: "from-slate-400 to-slate-500", shadow: "shadow-slate-300/50", badge: "🥈" },
    { rank: 1, scale: "scale-100", height: "h-40", bg: "from-yellow-400 to-amber-500", shadow: "shadow-yellow-300/50", badge: "🥇" },
    { rank: 3, scale: "scale-90", height: "h-20", bg: "from-orange-400 to-amber-600", shadow: "shadow-orange-300/50", badge: "🥉" },
  ];

  const podiumOrder = [leaderboard[1], leaderboard[0], leaderboard[2]];
  const restList = leaderboard.slice(3);

  return (
    <div className="text-slate-900 dark:text-slate-100 min-h-screen">
      {/* Header */}
      <div className="px-6 md:px-10 pt-10 pb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight flex items-center gap-4">
              <Trophy className="text-yellow-500" size={42} />
              Leaderboard
            </h1>
            <p className="text-slate-500 text-sm mt-3 font-medium italic max-w-md">
              The elite contributors of CSBS. Ranked by Sync Points and persistent scholarly engagement.
            </p>
          </div>
        </div>

        {/* My stats card */}
        {myStats && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 grid grid-cols-2 gap-4 max-w-sm"
          >
            <div className="bg-indigo-500/5 rounded-2xl p-5 border border-indigo-500/10">
              <p className="text-[10px] uppercase font-black tracking-widest text-indigo-500 mb-2 opacity-60">My Sync Points</p>
              <div className="flex items-center gap-2">
                <Zap size={20} className="text-indigo-400" />
                <p className="text-2xl font-black text-indigo-300">{myStats.points}</p>
              </div>
            </div>
            <div className="bg-orange-500/5 rounded-2xl p-5 border border-orange-500/10">
              <p className="text-[10px] uppercase font-black tracking-widest text-orange-500 mb-2 opacity-60">My Streak</p>
              <div className="flex items-center gap-2">
                <Flame size={20} className="text-orange-400" />
                <p className="text-2xl font-black text-orange-400">{myStats.streak} 🔥</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="px-6 md:px-10 pb-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">Loading rankings...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-24">
            <Trophy className="mx-auto text-slate-200 dark:text-slate-700 mb-4" size={64} />
            <p className="text-slate-400 dark:text-slate-500 font-semibold">No contributors yet. Be the first!</p>
          </div>
        ) : (
          <>
            {/* ── Podium ── */}
            {leaderboard.length >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end justify-center gap-4 mb-12 mt-4"
              >
                {podiumConfig.map((cfg, idx) => {
                  const user = podiumOrder[idx];
                  if (!user) return null;
                  return (
                    <motion.div
                      key={user._id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.15 }}
                      className={`flex flex-col items-center ${cfg.scale}`}
                    >
                      {/* Avatar */}
                      <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br ${cfg.bg} flex items-center justify-center text-white font-black text-2xl mb-2 shadow-xl ${cfg.shadow}`}>
                        {user.username?.[0]?.toUpperCase() || "?"}
                        <span className="absolute -top-3 text-2xl">{cfg.badge}</span>
                      </div>
                      <p className="font-black text-white text-sm text-center max-w-[100px] truncate leading-tight mt-1">{user.name || user.username}</p>
                      <p className="text-[10px] font-bold text-white/50 tracking-widest uppercase">{user.username}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs font-black text-indigo-400">{user.syncPoints} SP</p>
                        {user.streak > 0 && <span className="text-[10px] font-black text-orange-400">🔥{user.streak}</span>}
                      </div>

                      {/* Podium base */}
                      <div className={`mt-3 w-24 md:w-28 ${cfg.height} bg-gradient-to-b ${cfg.bg} rounded-t-2xl flex items-center justify-center shadow-lg ${cfg.shadow}`}>
                        <span className="text-white font-black text-2xl">#{cfg.rank}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* ── Full Rankings List ── */}
            <div className="space-y-3 max-w-2xl mx-auto">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Full Rankings</p>
              {leaderboard.map((user, i) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${
                    i === 0
                      ? "bg-yellow-500/5 border-yellow-500/20 shadow-lg shadow-yellow-500/5"
                      : i === 1
                      ? "bg-slate-500/5 border-slate-500/20"
                      : i === 2
                      ? "bg-orange-500/5 border-orange-500/20"
                      : "bg-white/3 border-white/5"
                  }`}
                >
                  {/* Rank badge */}
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black shrink-0 text-sm ${
                    i === 0 ? "bg-yellow-400 text-white" :
                    i === 1 ? "bg-slate-400 text-white" :
                    i === 2 ? "bg-orange-400 text-white" :
                    "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                  }`}>
                    {i < 3 ? ["🥇","🥈","🥉"][i] : i + 1}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center text-white font-black shrink-0">
                    {user.username?.[0]?.toUpperCase() || "?"}
                  </div>

                   {/* Info */}
                   <div className="flex-1 min-w-0">
                     <p className="font-black text-slate-900 dark:text-white truncate text-base">{user.name || user.username}</p>
                     <div className="flex items-center gap-3 mt-1">
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                         @{user.username}
                       </span>
                       <span className="w-1 h-1 rounded-full bg-white/10" />
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                         {user.contributionScore || 0} Contribution
                       </span>
                     </div>
                   </div>

                   {/* Stats */}
                   <div className="flex items-center gap-6 shrink-0">
                     {user.streak > 0 && (
                       <div className="text-right">
                         <p className="text-sm font-black text-orange-400 leading-none">{user.streak}🔥</p>
                         <p className="text-[8px] font-black text-orange-500/50 uppercase tracking-tighter mt-1">Streak</p>
                       </div>
                     )}
                     <div className="text-right min-w-[60px]">
                       <p className="text-xl font-black text-indigo-400 leading-none">{user.syncPoints}</p>
                       <p className="text-[8px] font-black text-indigo-500/50 uppercase tracking-tighter mt-1">Sync Points</p>
                     </div>
                   </div>
                </motion.div>
              ))}
            </div>

            {/* Refresh */}
            <div className="flex justify-center mt-10">
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-bold hover:bg-white/10 transition-colors"
              >
                <RefreshCw size={16} />
                Refresh Rankings
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
