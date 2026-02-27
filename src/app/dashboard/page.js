"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Bell, Sparkles, Zap, ChevronRight, Bookmark } from "lucide-react";

export default function DashboardHome() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState("");

  const syncTips = [
    "Check the Material section for the latest notes!",
    "Sync your attendance daily to earn CSBS Points.",
    "New assignments are posted every Monday morning.",
    "Don't forget to update your profile with your correct ID.",
    "Join the discussion in the class group for lab updates."
  ];

  // ✅ Fetch announcements
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://csbssync.vercel.app/api/announcements");
      const data = await res.json();
      if (data.success) setAnnouncements(data.announcements);
    } catch (err) {
      console.error("Error fetching announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    setQuote(syncTips[Math.floor(Math.random() * syncTips.length)]);
  }, []);

  // ✅ Filter only “General” and “Exams”
  const filteredAnnouncements = announcements.filter(
    (a) => a.category === "General" || a.category === "Exams"
  );

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative px-8 pt-16 pb-20 overflow-hidden bg-slate-50">
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-bold mb-6"
          >
            <Sparkles size={16} />
            Elevate Your Learning Experience
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight"
          >
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">CSBS SYNC</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto"
          >
            Your intelligent class portal designed for speed and collaboration. 
            Access study materials, track work, and stay synced with the CSBS community.
          </motion.p>

          {/* Sync of the Day Feature */}
          <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: 0.3 }}
             className="bg-white p-4 rounded-3xl shadow-xl shadow-indigo-100/50 border border-indigo-50 inline-flex items-center gap-4 max-w-xl text-left"
          >
             <div className="bg-indigo-600 p-3 rounded-2xl shrink-0">
                <Zap size={20} className="text-white" />
             </div>
             <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-indigo-500 mb-1">Sync of the Day</p>
                <p className="text-slate-800 font-bold leading-tight">{quote}</p>
             </div>
          </motion.div>
        </div>
      </section>

      <div className="px-6 md:px-12 py-16 -mt-10 relative z-20">
        {/* ✅ Announcements Section */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-10 text-balance">
            <div>
              <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                <Bell className="text-indigo-600" />
                Latest Announcements
              </h2>
              <p className="text-slate-500 mt-1">Stay updated with critical department news</p>
            </div>
            <a
              href="/dashboard/announcement"
              className="hidden md:flex items-center gap-2 text-indigo-600 font-bold hover:gap-3 transition-all"
            >
              View Full Feed <ArrowRight size={18} />
            </a>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-50 h-[400px] rounded-[2rem] animate-pulse" />
              ))}
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-medium font-serif italic text-lg text-balance">Nothing synced here yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredAnnouncements.slice(0, 6).map((a, idx) => (
                <motion.div
                  key={a._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group bg-white rounded-[2rem] overflow-hidden border border-slate-100 hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500"
                >
                  <div className="relative h-56 bg-slate-100 overflow-hidden text-center flex items-center justify-center">
                    <img
                      src={a.imageUrl || "https://img.icons8.com/cute-clipart/512/no-image.png"}
                      alt={a.topic}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm text-xs font-black text-indigo-600 uppercase tracking-wider">
                        {a.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-8">
                    <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {a.topic}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-2">
                      {a.details}
                    </p>
                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                       <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                          <Bookmark size={20} />
                       </button>
                       <a href={`/dashboard/announcement/${a._id}`} className="flex items-center gap-2 text-sm font-bold text-slate-700 group-hover:text-indigo-600">
                          Learn More <ChevronRight size={16} />
                       </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Global Navigation Grid */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-800 mb-2">Explore the Ecosystem</h2>
            <p className="text-slate-500">Everything you need to stay ahead in your studies</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Study", desc: "Access class logs and sessions", color: "indigo", link: "/dashboard/study" },
              { title: "Material", desc: "Download notes and PDFs", color: "blue", link: "/dashboard/material" },
              { title: "Work", desc: "Track assignments and tasks", color: "violet", link: "/dashboard/work" },
              { title: "Announcement", desc: "View all history and updates", color: "emerald", link: "/dashboard/announcement" },
            ].map((item, idx) => (
              <motion.a 
                key={item.title} 
                href={item.link}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`block relative p-8 rounded-[2.5rem] bg-white border border-slate-100 hover:border-${item.color}-500 group transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-${item.color}-100/30`}
              >
                <div className={`w-12 h-12 rounded-2xl bg-${item.color}-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                   <div className={`w-6 h-6 rounded-full bg-${item.color}-600/20`} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">{item.desc}</p>
                <div className="flex items-center justify-between">
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Explore</span>
                   <ChevronRight className={`text-${item.color}-500 transform group-hover:translate-x-1 transition-transform`} />
                </div>
                
                {/* Decorative blob */}
                <div className={`absolute -bottom-6 -right-6 w-24 h-24 bg-${item.color}-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />
              </motion.a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
