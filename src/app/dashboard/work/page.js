"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, CheckCircle2, Clock, AlertTriangle, RefreshCw, ExternalLink, X } from "lucide-react";

const STATUS_CONFIG = {
  completed: { label: "Completed", icon: "✅", pill: "badge-done" },
  doing: { label: "In Progress", icon: "⚙️", pill: "badge-doing" },
  "": { label: "Pending", icon: "⏳", pill: "badge-pending" },
};

function countdown(deadline) {
  const diff = new Date(deadline) - new Date();
  if (diff <= 0) return { label: "Expired", color: "text-red-400" };
  const d = Math.floor(diff / 86400000);
  if (d > 0) return { label: `${d}d left`, color: d <= 2 ? "text-red-400" : d <= 5 ? "text-amber-400" : "text-emerald-400" };
  const h = Math.floor(diff / 3600000);
  return { label: `${h}h left`, color: "text-red-400" };
}

function formatDate(str) {
  if (!str) return "—";
  const d = new Date(str);
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

export default function WorkPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ subject: "", work: "", deadline: "" });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const d = jwtDecode(token);
      setIsAdmin(d?.role === "admin");
      setUsername(d?.username || "");
      setEmail(d?.email || "");
      setUserId(d?.userId || "");
    } catch { localStorage.removeItem("token"); }
  }, []);

  useEffect(() => { if (userId) fetchWorks(); }, [userId]);

  const fetchWorks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/work", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setWorks((data.works || []).sort((a, b) => new Date(a.deadline) - new Date(b.deadline)));
      }
    } catch { } finally { setLoading(false); }
  };

  const uploadFile = async () => {
    if (!file) return "";
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/work/upload", { method: "POST", body: fd });
      return (await res.json())?.url || "";
    } catch { return ""; } finally { setUploading(false); }
  };

  const handleAdd = async () => {
    if (!form.subject || !form.work || !form.deadline) return alert("Fill all fields");
    const fileUrl = file ? await uploadFile() : "";
    const res = await fetch("/api/work/add", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, fileUrl, addedBy: username }),
    });
    const data = await res.json();
    if (data.success) { setForm({ subject: "", work: "", deadline: "" }); setFile(null); setShowAdd(false); fetchWorks(); }
    else alert(data.message);
  };

  const handleStatus = async (workId, state) => {
    const res = await fetch(`/api/work/status/${workId}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, username, email, state }),
    });
    if ((await res.json()).success) fetchWorks();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this work?")) return;
    await fetch(`/api/work/${id}`, { method: "DELETE" });
    fetchWorks();
  };

  const totals = { total: works.length, completed: 0, doing: 0 };
  works.forEach(w => {
    const s = (w.status || []).find(s => s.userId === userId)?.state || "";
    if (s === "completed") totals.completed++;
    else if (s === "doing") totals.doing++;
  });

  return (
    <div className="min-h-screen dot-bg px-4 md:px-8 py-10">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white">Work Tracker</h1>
            <p className="text-slate-500 text-sm mt-1">Track all assignments and deadlines</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchWorks} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl glass glass-hover text-slate-400 text-sm font-bold">
              <RefreshCw size={14} /> Refresh
            </button>
            {isAdmin && (
              <button onClick={() => setShowAdd(!showAdd)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-500/25">
                {showAdd ? <X size={14} /> : <Plus size={14} />}
                {showAdd ? "Cancel" : "Add Work"}
              </button>
            )}
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total", value: totals.total, color: "from-indigo-600 to-blue-600", shadow: "shadow-indigo-500/20" },
            { label: "Done", value: totals.completed, color: "from-emerald-600 to-green-600", shadow: "shadow-emerald-500/20" },
            { label: "Doing", value: totals.doing, color: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/20" },
          ].map(s => (
            <motion.div key={s.label} whileHover={{ y: -3 }}
              className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 text-center shadow-xl ${s.shadow}`}>
              <p className="text-white/70 text-[10px] font-black uppercase tracking-widest">{s.label}</p>
              <p className="text-3xl font-black text-white mt-1">{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Add Work Form ── */}
        <AnimatePresence>
          {isAdmin && showAdd && (
            <motion.div key="add" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="glass rounded-[2rem] p-8 space-y-7 ring-1 ring-white/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 flex items-center justify-center border border-indigo-500/30">
                  <Plus size={20} className="text-indigo-400" />
                </div>
                <div>
                  <p className="font-black text-white text-lg">New Assignment</p>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Post to all students</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="field-label">Subject</label>
                  <input className="dark-input h-12" placeholder="e.g. Linear Algebra" value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="field-label">Deadline Date</label>
                  <input type="date" className="dark-input h-12" value={form.deadline}
                    onChange={e => setForm({ ...form, deadline: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="field-label">Work Details</label>
                <textarea className="dark-input resize-none" rows={3} placeholder="Describe the assignment, topics, or instructions..."
                  value={form.work} onChange={e => setForm({ ...form, work: e.target.value })} />
              </div>

              <div className="space-y-2">
                <label className="field-label">Upload Reference (optional)</label>
                <div className="relative group">
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={e => setFile(e.target.files[0])} />
                  <div className="dark-input h-12 flex items-center justify-between border-dashed group-hover:border-indigo-500/50 transition-colors">
                    <span className="text-slate-500 font-medium">{file ? file.name : "Choose a file..."}</span>
                    <Plus size={14} className="text-indigo-500" />
                  </div>
                </div>
              </div>

              <button onClick={handleAdd} disabled={uploading} className="btn-primary h-14">
                {uploading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</> : <><Plus size={18} /> Publish Assignment</>}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Works List ── */}
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest animate-pulse">Loading...</p>
          </div>
        ) : works.length === 0 ? (
          <div className="glass rounded-3xl py-20 text-center">
            <CheckCircle2 size={48} className="mx-auto text-slate-700 mb-4" />
            <p className="text-slate-500 font-semibold">No assignments yet. Clear skies! 🎉</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            {works.map((w, i) => {
              const myStatus = (w.status || []).find(s => s.userId === userId)?.state || "";
              const counts = { completed: 0, doing: 0 };
              (w.status || []).forEach(s => { if (s.state === "completed") counts.completed++; else if (s.state === "doing") counts.doing++; });
              const cd = countdown(w.deadline);
              const cfg = STATUS_CONFIG[myStatus] || STATUS_CONFIG[""];

              return (
                <motion.div key={w._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="glass glass-hover rounded-[1.75rem] p-6 flex flex-col gap-4">
                  {/* Top */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <span className={`badge ${cfg.pill} mb-2`}>{cfg.icon} {cfg.label}</span>
                      <h3 className="font-black text-white leading-tight">{w.subject}</h3>
                      <p className="text-slate-400 text-sm mt-1 leading-relaxed">{w.work}</p>
                    </div>
                    {isAdmin && (
                      <button onClick={() => handleDelete(w._id)} className="p-2 rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-slate-600" />
                      <span className="text-slate-500 text-xs font-medium">{formatDate(w.deadline)}</span>
                    </div>
                    <span className={`text-xs font-black ${cd.color}`}>{cd.label}</span>
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-3 text-xs">
                    <span className="badge badge-done">✅ {counts.completed}</span>
                    <span className="badge badge-doing">⚙️ {counts.doing}</span>
                    {w.fileUrl && (
                      <a href={w.fileUrl} target="_blank" rel="noreferrer"
                        className="ml-auto flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-bold">
                        <ExternalLink size={12} /> View File
                      </a>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "completed", label: "Mark Done", active: "bg-emerald-600 text-white", idle: "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20" },
                      { key: "doing", label: "In Progress", active: "bg-amber-600 text-white", idle: "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20" },
                    ].map(btn => (
                      <button key={btn.key} onClick={() => handleStatus(w._id, btn.key)}
                        className={`py-2.5 rounded-2xl text-xs font-black transition-all ${myStatus === btn.key ? btn.active : btn.idle}`}>
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
