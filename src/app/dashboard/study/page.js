"use client";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Trash2, Plus, Calendar, BookOpen, X } from "lucide-react";

export default function StudyPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [topics, setTopics] = useState([]);
  const [showTimetable, setShowTimetable] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const subjects = [
    { name: "Linear Algebra", staff: "Ms.M.M.Shalini" },
    { name: "Problem solving using c", staff: "Dr.D.Ramya" },
    { name: "Business Communication and value Science", staff: "Dr.S.Kavitha" },
    { name: "Electronics And Microprocessor", staff: "Dr.M.Geetha" },
    { name: "Physics For Information Science", staff: "Dr.A.Sivakami" },
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) { try { const d = jwtDecode(token); setIsAdmin(d.role === "admin"); } catch { } }
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const res = await fetch("/api/study");
      if (!res.ok) throw new Error();
      setTopics(await res.json());
    } catch { setTopics([]); }
  };

  const handleAdd = async () => {
    if (!selectedSubject || !topic.trim()) return alert("Fill all fields!");
    const staffName = subjects.find(s => s.name === selectedSubject)?.staff || "";
    try {
      const res = await fetch("/api/study", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: selectedSubject, staff: staffName, topic }),
      });
      if (res.ok) { const saved = await res.json(); setTopics([...topics, saved]); setTopic(""); setSelectedSubject(""); setShowAdd(false); }
      else throw new Error();
    } catch { alert("Error adding topic"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete?")) return;
    const res = await fetch(`/api/study/${id}`, { method: "DELETE" });
    if (res.ok) setTopics(topics.filter(t => t._id !== id));
  };

  const grouped = subjects.map(s => ({ ...s, topics: topics.filter(t => t.subject === s.name) }));
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const timetable = [
    ["LA", "BCVS", "EMP LAB", "EMP LAB", "PSC LAB", "PSC LAB", "PSC LAB"],
    ["PIS", "LA", "BCVS", "EMP", "EP LAB", "EP LAB", "LA (T)"],
    ["PSC", "PSC LAB", "PSC LAB", "PSC LAB", "EMP", "PIS", "BCVS"],
    ["BCVS LAB", "BCVS LAB", "PIS LAB/LIB", "PIS LAB/LIB", "PSC", "EMP", "LA"],
    ["PSC", "BCVS", "SS", "SS", "LA", "PIS", "PT"],
    ["PIS", "PSC", "EMP", "LA", "COE", "COE", "COE"],
  ];

  return (
    <div className="min-h-screen dot-bg px-4 md:px-8 py-10">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Study Progress</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track topics covered per subject</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => setShowTimetable(!showTimetable)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all
                ${showTimetable ? "bg-blue-600/20 border border-blue-500/30 text-blue-300" : "glass glass-hover text-slate-400"}`}>
              <Calendar size={14} /> {showTimetable ? "Hide Timetable" : "Timetable"}
            </button>
            {isAdmin && (
              <button onClick={() => setShowAdd(!showAdd)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-500/25">
                {showAdd ? <X size={14} /> : <Plus size={14} />}
                {showAdd ? "Cancel" : "Add Topic"}
              </button>
            )}
          </div>
        </div>

        {/* ── Timetable ── */}
        <AnimatePresence>
          {showTimetable && (
            <motion.div key="tt" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="glass rounded-[2rem] overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <p className="font-black text-slate-900 dark:text-white">🗓️ Weekly Timetable</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-center">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-4 py-3 text-slate-500 font-bold">Day</th>
                      {[1,2,3,4,5,6,7].map(p => (
                        <th key={p} className="px-3 py-3 text-slate-500 font-bold">P{p}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {days.map((day, i) => (
                      <tr key={day} className="hover:bg-white/3 transition-colors">
                        <td className="px-4 py-3 font-bold text-indigo-400 text-left">{day}</td>
                        {timetable[i].map((s, j) => (
                          <td key={j} className="px-3 py-3 text-slate-400">{s}</td>
                        ))}
                      </tr>
                    ))}
                    <tr className="bg-red-500/5">
                      <td className="px-4 py-3 font-bold text-red-400 text-left">Sunday</td>
                      <td colSpan={7} className="text-slate-600 italic py-3">🌞 Holiday</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Add Topic Panel ── */}
        <AnimatePresence>
          {isAdmin && showAdd && (
            <motion.div key="add" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="glass rounded-[2rem] p-8 space-y-7 ring-1 ring-white/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 flex items-center justify-center border border-indigo-500/30">
                  <Plus size={20} className="text-indigo-400" />
                </div>
                <div>
                  <p className="font-black text-slate-900 dark:text-white text-lg">Log New Topic</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Update class progress</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <label className="field-label">Subject</label>
                  <select className="dark-input h-12 pr-10" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="field-label">Handling Staff</label>
                  <input className="dark-input h-12 opacity-80" readOnly value={subjects.find(s => s.name === selectedSubject)?.staff || ""} placeholder="Select subject first" />
                </div>
                <div className="space-y-2">
                  <label className="field-label">Topic Coverage</label>
                  <input className="dark-input h-12" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Unit 3 Intro" />
                </div>
              </div>
              <button onClick={handleAdd} className="btn-primary h-14"><Plus size={18} /> Update Logs</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Subject Cards ── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {grouped.map((subj, i) => (
            <motion.div key={subj.name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="glass glass-hover rounded-[1.75rem] overflow-hidden flex flex-col">

              <button onClick={() => setOpen(open === i ? null : i)}
                className="flex items-start justify-between p-6 hover:bg-white/3 transition-colors text-left">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={14} className="text-indigo-400" />
                    <span className="badge badge-pending text-[10px]">{subj.topics.length} topics</span>
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-white text-sm leading-snug">{subj.name}</h3>
                  <p className="text-slate-400 text-xs mt-1 font-medium">👨‍🏫 {subj.staff}</p>
                </div>
                {open === i ? <ChevronUp size={16} className="text-slate-500 shrink-0 mt-1" /> : <ChevronDown size={16} className="text-slate-500 shrink-0 mt-1" />}
              </button>

              <AnimatePresence>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-black/5 dark:border-white/5">
                    <div className="p-4 space-y-2 max-h-52 overflow-y-auto">
                      {subj.topics.length > 0 ? subj.topics.map(t => (
                        <div key={t._id} className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                          <span className="text-slate-800 dark:text-slate-300 text-xs font-medium">📌 {t.topic}</span>
                          {isAdmin && (
                            <button onClick={() => handleDelete(t._id)} className="text-slate-600 hover:text-red-400 transition-colors shrink-0">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      )) : (
                        <p className="text-slate-500 text-xs text-center italic py-4">No topics logged yet</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
