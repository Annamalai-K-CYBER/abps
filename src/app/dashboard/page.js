"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, Bell, Sparkles, Zap, ChevronRight, Bookmark, 
  Clock, Trophy, CheckCircle2, Flame, BarChart3, Vote
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
  const [userVote, setUserVote] = useState({});

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
      // Fetch Announcements - Using relative path to avoid network issues
      const annRes = await fetch("/api/announcements");
      const annData = await annRes.json();
      if (annData.success) setAnnouncements(annData.announcements);

      // Fetch Deadline
      const workRes = await fetch("/api/work");
      const workData = await workRes.json();
      if (workData.success && workData.work.length > 0) {
        const sorted = workData.work.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        const nearest = sorted.find(w => new Date(w.deadline) > new Date());
        if (nearest) setDeadline(nearest);
      }

      // Fetch Leaderboard
      const lbRes = await fetch("/api/leaderboard");
      const lbData = await lbRes.json();
      if (lbData.success) setLeaderboard(lbData.leaderboard);

      // Fetch Polls
      const pollRes = await fetch("/api/polls");
      const pollData = await pollRes.json();
      if (pollData.success) setPolls(pollData.polls);

      // Fetch User Stats (Points/Streak)
      const statsRes = await fetch("/api/sync-points", { headers });
      const statsData = await statsRes.json();
      if (statsData.success) {
        setSyncStats({ points: statsData.points, streak: statsData.streak });
      }

    } catch (err) {
      console.error("Critical: Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setQuote(syncTips[Math.floor(Math.random() * syncTips.length)]);
  }, []);

  // Timer logic for Assignment Countdown
  useEffect(() => {
    if (!deadline) return;
    const interval = setInterval(() => {
      const target = new Date(deadline.deadline);
      const diff = target - new Date();
      if (diff <= 0) {
        setTimeLeft("EXPIRED");
        clearInterval(interval);
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const [syncing, setSyncing] = useState(false);

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
      if (data.success) {
        setSyncStats({ points: data.points, streak: data.streak });
        // Optional: show a toast instead of an alert
        alert(data.message);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Fail to sync. Check connection.");
    } finally {
      setSyncing(false);
    }
  };

  const handleVote = async (pollId, optionId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/polls", {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ pollId, optionId })
      });
      const data = await res.json();
      if (data.success) {
        setPolls(polls.map(p => p._id === pollId ? data.poll : p));
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-6">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="font-bold text-slate-500 animate-pulse uppercase tracking-widest text-xs">Syncing Ecosystem...</p>
      </div>
    );
  }

  return (
    <div className="bg-transparent">
      {/* Hero / Countdown Section */}
      <section className="relative px-8 pt-12 pb-16 overflow-hidden">
        <div className="grid lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-sm font-bold mb-6"
            >
              <Sparkles size={16} />
              {quote}
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight"
            >
              Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Momentum</span>
            </motion.h1>
            
            {/* Assignment Timer Card */}
            {deadline ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 dark:shadow-none flex flex-col md:flex-row items-center justify-between gap-6"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-4 rounded-2xl">
                    <Clock size={32} />
                  </div>
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-widest text-indigo-100">{deadline.subject} Deadline</h2>
                    <p className="text-xl font-bold">{deadline.work}</p>
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-xs font-black uppercase tracking-widest text-indigo-100 mb-1">Time Remaining</p>
                  <p className="text-3xl font-black font-mono">{timeLeft}</p>
                </div>
              </motion.div>
            ) : (
              <div className="p-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center">
                <p className="text-slate-400 font-medium italic">All clear! No upcoming deadlines detected. ✨</p>
              </div>
            )}
          </div>

          {/* Sync Attendance Tool */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xl"
          >
            <div className="flex justify-between items-start mb-8">
               <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white">Daily Sync</h3>
                  <p className="text-slate-400 text-sm font-medium">Earn points for consistency</p>
               </div>
               <div className="bg-orange-50 dark:bg-orange-900/30 p-2 rounded-xl text-orange-600">
                  <Flame size={24} />
               </div>
            </div>
            
            <div className="flex items-center gap-4 mb-8">
               <div className="flex-1 text-center bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl">
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Points</p>
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{syncStats.points}</p>
               </div>
               <div className="flex-1 text-center bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl">
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Streak</p>
                  <p className="text-2xl font-black text-orange-600">{syncStats.streak} 🔥</p>
               </div>
            </div>
            
            <button 
              onClick={handleSync}
              disabled={syncing}
              className={`w-full py-4 ${syncing ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 dark:bg-indigo-600 hover:scale-[1.02]'} text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-lg`}
            >
              <CheckCircle2 size={20} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing..." : "Check In Now"}
            </button>
          </motion.div>
        </div>
      </section>

      <div className="px-8 pb-20">
        <div className="grid lg:grid-cols-3 gap-10">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Announcements Segment */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                  <Bell className="text-indigo-600" size={24} />
                  New Broadcasts
                </h2>
                <a href="/dashboard/announcement" className="text-indigo-600 font-bold text-sm">View All</a>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-6">
                 {announcements.length > 0 ? (
                   announcements.slice(0, 4).map((a, idx) => (
                     <motion.div 
                      key={a._id} 
                      whileHover={{ y: -5 }}
                      className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 dark:border-slate-700/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group"
                     >
                        <div className="h-44 bg-slate-100 dark:bg-slate-700 rounded-2xl mb-4 overflow-hidden relative">
                          <img 
                            src={a.imageUrl || "https://img.icons8.com/cute-clipart/512/no-image.png"} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            alt="sync" 
                          />
                          <div className="absolute top-3 left-3">
                             <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                               {a.category}
                             </span>
                          </div>
                        </div>
                        <h4 className="font-bold text-slate-800 dark:text-white line-clamp-1 group-hover:text-indigo-600 transition-colors">{a.topic}</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">{a.details}</p>
                     </motion.div>
                   ))
                 ) : (
                   <div className="col-span-2 py-10 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                      <p className="text-slate-400 italic">No announcements found.</p>
                   </div>
                 )}
              </div>
            </section>

            {/* Live Polls Section */}
            <section className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-8">
                 <Vote className="text-indigo-600" />
                 <h2 className="text-2xl font-black text-slate-800 dark:text-white">Active Polls</h2>
              </div>
              
              <div className="space-y-6">
                {polls.length === 0 ? (
                  <p className="text-slate-400 text-sm italic">No active polls right now.</p>
                ) : (
                  polls.map(poll => (
                    <div key={poll._id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <p className="font-bold text-slate-800 dark:text-white mb-6">{poll.question}</p>
                        <div className="space-y-3">
                           {poll.options.map(opt => {
                             const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes, 0);
                             const percent = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                             return (
                               <button 
                                 key={opt._id}
                                 onClick={() => handleVote(poll._id, opt._id)}
                                 className="w-full text-left group"
                               >
                                  <div className="flex justify-between items-center mb-1 text-xs font-bold text-slate-600 dark:text-slate-400">
                                     <span>{opt.text}</span>
                                     <span>{percent}% ({opt.votes})</span>
                                  </div>
                                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                     <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${percent}%` }}
                                      className="h-full bg-indigo-600 rounded-full"
                                     />
                                  </div>
                               </button>
                             )
                           })}
                        </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-10">
            {/* Leaderboard Section */}
            <section className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xl">
               <div className="flex items-center gap-3 mb-8">
                  <Trophy className="text-yellow-500" />
                  <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Top Contributors</h3>
               </div>
               
               <div className="space-y-6">
                  {leaderboard.map((u, i) => (
                    <div key={u._id} className="flex items-center justify-between group">
                       <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                            i === 0 ? 'bg-yellow-100 text-yellow-600' : 
                            i === 1 ? 'bg-slate-100 text-slate-600' :
                            'bg-orange-50 text-orange-600'
                          }`}>
                             {i + 1}
                          </div>
                          <div>
                             <p className="text-sm font-black text-slate-800 dark:text-white">{u.username}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{u.contributionScore} Contribution</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">{u.syncPoints} SP</p>
                       </div>
                    </div>
                  ))}
               </div>
               
               <button 
                onClick={fetchData}
                className="w-full mt-8 py-3 rounded-2xl border border-slate-100 dark:border-slate-700 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
               >
                  Refresh Data
               </button>
            </section>

            {/* App Nav Segment */}
            <section className="grid grid-cols-2 gap-4">
               {[
                 { title: "Material", icon: <BarChart3 />, link: "/dashboard/material", color: "blue" },
                 { title: "Study Log", icon: <Bookmark />, link: "/dashboard/study", color: "emerald" },
               ].map(item => (
                 <a key={item.title} href={item.link} className={`p-6 rounded-3xl bg-${item.color}-50 dark:bg-${item.color}-900/20 border border-${item.color}-100 dark:border-${item.color}-800 group transition-all`}>
                    <div className={`w-10 h-10 rounded-2xl bg-${item.color}-600 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                       {item.icon}
                    </div>
                    <p className="font-black text-slate-800 dark:text-white text-sm">{item.title}</p>
                 </a>
               ))}
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}
