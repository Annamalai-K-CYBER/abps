"use client";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FolderOpen, ChevronDown, ChevronUp, FileText, Image, Download, Trash2, RefreshCw, Plus } from "lucide-react";

export default function MaterialPage() {
  const [username, setUsername] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSubject, setOpenSubject] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  const [form, setForm] = useState({ materialName: "", subject: "", file: null });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const d = jwtDecode(token);
      setUsername(d?.username || "");
      setIsAdmin(d?.role === "admin");
    } catch { }
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/materials");
      const data = await res.json();
      setMaterials(Array.isArray(data) ? data : data.data || []);
    } catch { } finally { setLoading(false); }
  };

  const handleUpload = async () => {
    if (!form.file || !form.materialName || !form.subject) return alert("Fill all fields!");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", form.file);
    fd.append("username", username);
    fd.append("materialName", form.materialName);
    fd.append("subject", form.subject);
    fd.append("uploadDate", new Date().toISOString());
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) { setForm({ materialName: "", subject: "", file: null }); setShowUpload(false); fetchMaterials(); }
      else alert(data.message || "Upload failed");
    } catch { alert("Upload failed"); } finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this material?")) return;
    const res = await fetch("/api/materials/delete", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.success) fetchMaterials();
    else alert(data.message || "Delete failed");
  };

  const grouped = materials.reduce((acc, m) => {
    const s = m.subject || "Uncategorized";
    if (!acc[s]) acc[s] = [];
    acc[s].push(m);
    return acc;
  }, {});

  const isImage = (fmt) => ["png", "jpg", "jpeg", "gif", "webp"].includes(fmt?.toLowerCase() || "");

  return (
    <div className="min-h-screen dot-bg px-4 md:px-8 py-10">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Study Materials</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">All resources organized by subject</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchMaterials} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl glass glass-hover text-slate-400 text-sm font-bold">
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={() => setShowUpload(!showUpload)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-lg
                ${showUpload ? "bg-red-500/20 border border-red-500/30 text-red-400" : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25"}`}>
              {showUpload ? <X size={14} /> : <Plus size={14} />}
              {showUpload ? "Cancel" : "Upload Material"}
            </button>
          </div>
        </div>

        {/* ── Upload Panel ── */}
        <AnimatePresence>
          {showUpload && (
            <motion.div key="upload" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="glass rounded-[2rem] p-8 space-y-7 ring-1 ring-white/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 flex items-center justify-center border border-indigo-500/30">
                  <Upload size={20} className="text-indigo-400" />
                </div>
                <div>
                  <p className="font-black text-slate-900 dark:text-white text-lg">New Resource</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Help others & earn points</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="field-label">Material Name</label>
                  <input className="dark-input h-12" placeholder="e.g. Unit 2 Midterm Prep" value={form.materialName}
                    onChange={e => setForm({ ...form, materialName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="field-label">Subject</label>
                  <input className="dark-input h-12" placeholder="e.g. Linear Algebra" value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="field-label">Select File</label>
                <div className="relative group">
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={e => setForm({ ...form, file: e.target.files[0] })} />
                  <div className="dark-input h-12 flex items-center justify-between border-dashed group-hover:border-indigo-500/50 transition-colors">
                    <span className="text-slate-500 font-medium">{form.file ? form.file.name : "Choose a PDF, Image or Doc..."}</span>
                    <Upload size={14} className="text-indigo-500" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tight pl-1">Max 10MB · Points awarded after success</p>
              </div>

              <button onClick={handleUpload} disabled={uploading} className="btn-primary h-14">
                {uploading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</> : <><Upload size={18} /> Publish Material</>}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Materials ── */}
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-sm animate-pulse uppercase tracking-widest font-bold">Loading...</p>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="glass rounded-3xl py-20 text-center">
            <FolderOpen size={48} className="mx-auto text-slate-700 mb-4" />
            <p className="text-slate-500 font-semibold">No materials uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([subject, mats], si) => (
              <motion.div key={subject} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.05 }}
                className="glass rounded-[2rem] overflow-hidden">

                {/* Subject toggle */}
                <button onClick={() => setOpenSubject(openSubject === subject ? null : subject)}
                  className="w-full flex items-center justify-between px-7 py-5 hover:bg-white/3 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                      <FolderOpen size={16} className="text-indigo-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-slate-900 dark:text-white">{subject}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">{mats.length} file{mats.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  {openSubject === subject ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                </button>

                <AnimatePresence>
                  {openSubject === subject && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-white/5">
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                        {mats.map(mat => (
                          <motion.div key={mat._id} whileHover={{ y: -4 }}
                            className="glass glass-hover rounded-2xl p-5 flex flex-col gap-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                                {isImage(mat.format) ? <Image size={18} className="text-indigo-400" /> : <FileText size={18} className="text-blue-400" />}
                              </div>
                              {isAdmin && (
                                <button onClick={() => handleDelete(mat._id)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-sm leading-snug line-clamp-2">{mat.matname}</p>
                              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium italic">by {mat.name || "Unknown"}</p>
                              {mat.uploadDate && <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5">{new Date(mat.uploadDate).toLocaleDateString()}</p>}
                            </div>
                            <button onClick={() => mat.link && window.open(mat.link.startsWith("http") ? mat.link : `https://${mat.link}`, "_blank")}
                              className="w-full py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold hover:bg-indigo-500/20 transition-colors flex items-center justify-center gap-2">
                              <Download size={13} /> View / Download
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
