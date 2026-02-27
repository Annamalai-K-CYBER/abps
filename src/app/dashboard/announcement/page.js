"use client";

import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Megaphone, Calendar, Trophy, Info, Sparkles, ChevronDown, ChevronUp, Image as ImageIcon, LayoutList } from "lucide-react";

export default function AnnouncementsPage() {
  const [form, setForm] = useState({
    topic: "",
    category: "General",
    details: "",
    image: null,
  });
  const [announcements, setAnnouncements] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState("General");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const categories = [
    { name: "General", color: "indigo", icon: <Megaphone size={18} /> },
    { name: "Events", color: "rose", icon: <Calendar size={18} /> },
    { name: "Exams", color: "orange", icon: <LayoutList size={18} /> },
    { name: "Updates", color: "emerald", icon: <Info size={18} /> },
    { name: "Achievements", color: "purple", icon: <Trophy size={18} /> },
  ];

  // ✅ Fetch announcements
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/announcements");
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
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded?.role === "admin") setIsAdmin(true);
      } catch (err) {
        console.error("Invalid token", err);
      }
    }
  }, []);

  // ✅ Add new announcement
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.topic || !form.details) return alert("Please fill all fields");
    setUploading(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => v && formData.append(k, v));

      const res = await fetch("/api/announcements", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setForm({ topic: "", category: "General", details: "", image: null });
        setShowAddForm(false);
        fetchAnnouncements();
      } else alert(data.error || "Error adding announcement");
    } catch (err) {
      console.error(err);
      alert("Error uploading announcement");
    } finally {
      setUploading(false);
    }
  };

  // ✅ Delete announcement (Admin only)
  const handleDelete = async (id) => {
    if (!confirm("Delete this announcement?")) return;
    await fetch(`/api/announcements?id=${id}`, {
      method: "DELETE",
    });
    fetchAnnouncements();
  };

  return (
    <div className="min-h-screen dot-bg px-4 md:px-8 py-10">
      {/* Header Area */}
      <div className="max-w-5xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
               <Megaphone className="text-indigo-600 dark:text-indigo-400" size={32} />
               Announcements
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Your source for all official updates and events.</p>
          </div>
          
          {isAdmin && (
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
                showAddForm ? 'bg-white/10 text-white' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:translate-y-[-2px]'
              }`}
            >
              {showAddForm ? <ChevronUp size={20} /> : <Plus size={20} />}
              {showAddForm ? "Hide Editor" : "New Post"}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        
        {/* ✅ Admin Add Form */}
        <AnimatePresence>
          {isAdmin && showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 40 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <form
                onSubmit={handleAdd}
                className="glass rounded-[2.5rem] p-8 ring-1 ring-black/5 dark:ring-white/10 flex flex-col gap-6 shadow-xl"
              >
                <div className="flex items-center gap-3 text-indigo-600 font-black uppercase tracking-widest text-xs">
                   <Sparkles size={16} />
                   Create Official Broadcast
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Topic</label>
                    <input
                      type="text"
                      placeholder="Give it a catchy title"
                      value={form.topic}
                      onChange={(e) => setForm({ ...form, topic: e.target.value })}
                      className="dark-input h-12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="dark-input h-12 font-bold appearance-none cursor-pointer"
                    >
                      {categories.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Details</label>
                  <textarea
                    placeholder="Briefly describe the announcement..."
                    rows={4}
                    value={form.details}
                    onChange={(e) => setForm({ ...form, details: e.target.value })}
                    className="dark-input resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Feature Image</label>
                  <div className="relative group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setForm({ ...form, image: e.target.files[0] })}
                      className="hidden"
                      id="announcement-image"
                    />
                    <label 
                      htmlFor="announcement-image"
                      className="flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-dashed border-white/10 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all cursor-pointer text-slate-500 hover:text-indigo-400 group-hover:shadow-lg"
                    >
                      <ImageIcon size={20} />
                      <span className="font-bold text-sm">{form.image ? form.image.name : "Choose an image file"}</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className={`w-full py-4 px-8 rounded-2xl font-black text-white transition-all transform active:scale-[0.98] ${
                    uploading
                      ? "bg-slate-300 cursor-not-allowed shadow-none"
                      : "bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100"
                  }`}
                >
                  {uploading ? (
                    <div className="flex items-center justify-center gap-3">
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                       Synchronizing...
                    </div>
                  ) : "Publish Announcement"}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ✅ Categories List */}
        <div className="space-y-6">
          {loading ? (
             <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse" />)}
             </div>
          ) : (
            categories.map((cat) => {
              const filtered = announcements.filter((a) => a.category === cat.name);
              const isOpen = expanded === cat.name;
              
              return (
                <div key={cat.name} className="overflow-hidden">
                  <button
                    onClick={() => setExpanded(isOpen ? null : cat.name)}
                    className={`w-full flex items-center justify-between p-6 rounded-3xl transition-all duration-300 ${
                       isOpen 
                        ? `bg-${cat.color}-600 text-white shadow-xl shadow-${cat.color}-500/25` 
                        : "glass glass-hover text-slate-900 dark:text-white ring-1 ring-black/5 dark:ring-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                       <div className={`p-2 rounded-xl ${isOpen ? 'bg-white/20' : `bg-${cat.color}-50 text-${cat.color}-600 text-balance`}`}>
                          {cat.icon}
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="font-black text-lg tracking-tight">{cat.name}</span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${isOpen ? 'bg-white/20 text-white' : `bg-${cat.color}-100 text-${cat.color}-600`}`}>
                            {filtered.length}
                          </span>
                       </div>
                    </div>
                    {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6 pt-6 pb-12">
                          {filtered.length === 0 ? (
                            <div className="col-span-full py-12 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                               <p className="text-slate-400 font-medium font-serif italic">No updates in this category yet.</p>
                            </div>
                          ) : (
                            filtered.map((a, idx) => (
                              <motion.div
                                key={a._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group flex flex-col bg-white rounded-[2rem] border border-slate-100 hover:border-indigo-100 hover:shadow-2xl transition-all duration-500 overflow-hidden"
                              >
                                <div className="aspect-video bg-slate-50 overflow-hidden">
                                  <img
                                    src={a.imageUrl || "https://img.icons8.com/cute-clipart/512/no-image.png"}
                                    alt={a.topic}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                  />
                                </div>
                                <div className="p-8 flex flex-col flex-grow">
                                  <div className="flex justify-between items-start mb-4">
                                     <h3 className="font-black text-slate-900 dark:text-white text-xl leading-tight">
                                      {a.topic}
                                    </h3>
                                    {isAdmin && (
                                      <button
                                        onClick={() => handleDelete(a._id)}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-wrap flex-grow">
                                    {a.details}
                                  </p>
                                  <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                                      <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 dark:text-slate-400 italic">Official Update</span>
                                      <div className={`w-2 h-2 rounded-full bg-indigo-500 animate-pulse`} />
                                  </div>
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
