"use client";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Trash2, Plus, Calendar, BookOpen, X, Bot, Sparkles, LoaderCircle, ImageIcon } from "lucide-react";

export default function StudyPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [topics, setTopics] = useState([]);
  const [showTimetable, setShowTimetable] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [aiSubject, setAiSubject] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiStudy, setAiStudy] = useState(null);

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

  const handleGenerateAi = async () => {
    const nextSubject = aiSubject || selectedSubject || subjects[0]?.name || "";
    const nextTopic = aiTopic || topic;

    if (!nextSubject || !nextTopic.trim()) {
      setAiError("Choose a subject and enter a topic first.");
      return;
    }

    setAiLoading(true);
    setAiError("");

    try {
      const res = await fetch("/api/study/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: nextSubject, topic: nextTopic.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to generate AI study aid");
      }

      setAiStudy(data.study);
    } catch (error) {
      setAiError(error.message || "Failed to generate AI study aid");
    } finally {
      setAiLoading(false);
    }
  };

  const svgImageUrl = aiStudy?.svg
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(aiStudy.svg)}`
    : "";

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

        {/* ── AI Study Assistant ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-[2.5rem] p-6 md:p-8 ring-1 ring-white/5 shadow-2xl shadow-black/25"
        >
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div className="max-w-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-black tracking-[0.2em] uppercase text-indigo-300">
                <Bot size={14} /> OpenRouter AI Tutor
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Generate a visual study guide</h2>
              <p className="text-slate-400 text-sm md:text-base">
                Pick a subject and topic. The AI will create a compact explanation, quick check questions, and an SVG image you can study from.
              </p>
            </div>
            <button
              onClick={handleGenerateAi}
              disabled={aiLoading}
              className="btn-primary h-14 lg:w-auto w-full px-6"
            >
              {aiLoading ? <LoaderCircle size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {aiLoading ? "Generating..." : "Generate with AI"}
            </button>
          </div>

          <div className="mt-6 grid lg:grid-cols-[1fr_1.2fr] gap-6">
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <label className="field-label">AI Subject</label>
                  <select
                    className="advanced-input h-14 pr-12 appearance-none bg-indigo-500/5"
                    value={aiSubject}
                    onChange={e => setAiSubject(e.target.value)}
                  >
                    <option value="" className="bg-slate-900 text-slate-400">Select Subject</option>
                    {subjects.map(s => <option key={s.name} value={s.name} className="bg-slate-900 text-white">{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2.5">
                  <label className="field-label">AI Topic</label>
                  <input
                    className="advanced-input h-14"
                    value={aiTopic}
                    onChange={e => setAiTopic(e.target.value)}
                    placeholder="e.g. Matrix inverse rules"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-white/5 bg-white/3 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 mb-2 flex items-center gap-2">
                  <Sparkles size={12} /> Prompt hint
                </p>
                <p className="text-sm text-slate-300">
                  Use the AI panel when you want a fast explanation and a topic image. It is separate from the manual topic log below.
                </p>
              </div>

              {aiError && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {aiError}
                </div>
              )}
            </div>

            <div className="rounded-[1.75rem] overflow-hidden border border-white/5 bg-slate-950/40 min-h-80">
              {aiStudy ? (
                <div className="grid md:grid-cols-[0.95fr_1.05fr] min-h-80">
                  <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-white/5 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="section-label">AI Visual</p>
                        <h3 className="font-black text-white text-lg mt-1 leading-tight">{aiStudy.title || "Study Visual"}</h3>
                      </div>
                      <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-400/20 flex items-center justify-center text-indigo-300">
                        <ImageIcon size={18} />
                      </div>
                    </div>

                    {svgImageUrl ? (
                      <div className="rounded-[1.25rem] overflow-hidden bg-white/5 border border-white/5">
                        <img src={svgImageUrl} alt={aiStudy.title || "AI generated study visual"} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-white/3 min-h-[220px] flex items-center justify-center text-slate-500 text-sm">
                        AI visual will appear here.
                      </div>
                    )}
                  </div>

                  <div className="p-4 md:p-5 space-y-4">
                    <div>
                      <p className="section-label">Explanation</p>
                      <p className="mt-2 text-slate-200 text-sm leading-7">{aiStudy.summary || "No summary returned."}</p>
                    </div>

                    <div>
                      <p className="section-label">Key Points</p>
                      <div className="mt-3 space-y-2">
                        {(aiStudy.key_points || []).map((point, index) => (
                          <div key={index} className="flex gap-3 rounded-2xl bg-white/4 border border-white/5 px-4 py-3 text-sm text-slate-300">
                            <span className="text-indigo-300 font-black">0{index + 1}</span>
                            <span>{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/15 p-4">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-300 font-black">Mnemonic</p>
                        <p className="text-sm text-emerald-50 mt-2 leading-6">{aiStudy.mnemonic || "No mnemonic returned."}</p>
                      </div>
                      <div className="rounded-2xl bg-blue-500/10 border border-blue-500/15 p-4">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-blue-300 font-black">Quick Check</p>
                        <div className="mt-2 space-y-2 text-sm text-blue-50/90">
                          {(aiStudy.quick_check || []).map((item, index) => (
                            <p key={index}>• {item}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="min-h-80 flex flex-col items-center justify-center text-center px-6 py-10">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-indigo-300 mb-4">
                    <Bot size={28} />
                  </div>
                  <h3 className="text-white font-black text-lg">No AI study guide yet</h3>
                  <p className="text-slate-400 text-sm mt-2 max-w-md">
                    Choose a subject and topic above, then generate a study explanation and visual.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Timetable ── */}
        <AnimatePresence>
          {showTimetable && (
            <motion.div key="tt" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="glass rounded-4xl overflow-hidden">
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
            <motion.div key="add" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass rounded-[2.5rem] p-10 space-y-8 ring-1 ring-white/5 shadow-2xl shadow-black/40">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  <Plus size={24} className="text-indigo-400" />
                </div>
                <div>
                  <p className="font-black text-white text-xl tracking-tight">Log New Topic</p>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-0.5">Update class progress</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-6">
                <div className="space-y-2.5">
                  <label className="field-label">Subject</label>
                  <div className="relative">
                    <select className="advanced-input h-14 pr-12 appearance-none bg-indigo-500/5" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                      <option value="" className="bg-slate-900 text-slate-400">Select Subject</option>
                      {subjects.map(s => <option key={s.name} value={s.name} className="bg-slate-900 text-white">{s.name}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <label className="field-label">Handling Staff</label>
                  <input className="advanced-input h-14 opacity-50" readOnly value={subjects.find(s => s.name === selectedSubject)?.staff || ""} placeholder="Select subject first" />
                </div>
                <div className="space-y-2.5">
                  <label className="field-label">Topic Coverage</label>
                  <input className="advanced-input h-14" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Unit 3 Intro" />
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
