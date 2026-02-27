"use client";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Shield, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound, Zap, Flame, BarChart3, Edit3, X } from "lucide-react";

function Toast({ msg, ok, onClose }) {
  useEffect(() => { if (msg) { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); } }, [msg]);
  if (!msg) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm font-bold
        ${ok ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-300" : "bg-red-500/15 border-red-500/25 text-red-300"}`}>
      {ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      {msg}
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100"><X size={14} /></button>
    </motion.div>
  );
}

function StatChip({ icon: Icon, label, value, color }) {
  return (
    <div className={`glass rounded-2xl p-4 flex flex-col gap-1 border ${color}`}>
      <div className="flex items-center gap-2">
        <Icon size={14} className="opacity-60" />
        <span className="section-label">{label}</span>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function InputField({ label, type = "text", value, onChange, placeholder, icon: Icon, right }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="space-y-2">
      {label && <label className="field-label ml-1">{label}</label>}
      <div className={`relative transition-all duration-300 ${focused ? "scale-[1.01]" : ""}`}>
        {Icon && <Icon size={14} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focused ? "text-indigo-400" : "text-slate-500"}`} />}
        <input 
          type={type} 
          value={value} 
          onChange={onChange} 
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`dark-input h-12 ${Icon ? "pl-11" : ""} ${right ? "pr-12" : ""} 
            ${focused ? "ring-2 ring-indigo-500/30 border-indigo-500/50" : "border-white/5"}`} 
        />
        {right && <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">{right}</div>}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [syncStats, setSyncStats] = useState({ points: 0, streak: 0 });

  // Panels
  const [panel, setPanel] = useState(null); // "addEmail" | "changeEmail" | "changePwd"

  // Email state
  const [email1, setEmail1] = useState("");
  const [newEmail1, setNewEmail1] = useState("");

  // Password state
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // UI
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: "", ok: false });
  const notify = (msg, ok = true) => setToast({ msg, ok });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const d = jwtDecode(token);
      setUser(d);
      // fetch real sync stats
      fetch("/api/sync-points", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => { if (d.success) setSyncStats({ points: d.points, streak: d.streak }); });
    } catch (e) { console.error(e); }
  }, []);

  const handleAddEmail = async (e) => {
    e.preventDefault();
    if (!email1.trim()) return notify("Enter a valid email!", false);
    setLoading(true);
    try {
      const res = await fetch("/api/addemail", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email, email1 }),
      });
      const data = await res.json();
      if (data.success) { setUser({ ...user, email1 }); setEmail1(""); setPanel(null); notify("Secondary email added!"); }
      else notify(data.message || "Failed!", false);
    } catch { notify("Server error!", false); } finally { setLoading(false); }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    if (!newEmail1.trim()) return notify("Enter a valid email!", false);
    setLoading(true);
    try {
      const res = await fetch("/api/changeemail1", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email, email1: newEmail1 }),
      });
      const data = await res.json();
      if (data.success) { setUser({ ...user, email1: newEmail1 }); setNewEmail1(""); setPanel(null); notify("Secondary email updated!"); }
      else notify(data.message || "Failed!", false);
    } catch { notify("Server error!", false); } finally { setLoading(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) return notify("Passwords do not match!", false);
    if (form.newPassword.length < 6) return notify("Password must be 6+ characters", false);
    setLoading(true);
    try {
      const res = await fetch("/api/change-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email, currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (data.success) { setForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); setPanel(null); notify("Password changed!"); }
      else notify(data.error || "Failed!", false);
    } catch { notify("Server error!", false); } finally { setLoading(false); }
  };

  const avatar = user?.username?.[0]?.toUpperCase() || "?";

  return (
    <div className="min-h-screen dot-bg px-4 md:px-8 py-10">
      <AnimatePresence><Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast({ msg: "", ok: false })} /></AnimatePresence>

      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Profile Card ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass glass-hover rounded-[2rem] p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-[1.4rem] bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-indigo-500/30 glow-pulse">
                {avatar}
              </div>
              {user?.role === "admin" && (
                <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Admin
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-black text-white">{user?.username || "Loading..."}</h1>
              <p className="text-slate-400 text-sm mt-1">{user?.email}</p>
              {user?.email1 && (
                <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <Shield size={11} className="text-emerald-400" />
                  <span className="text-emerald-400 text-[11px] font-bold">{user.email1}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Stats ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <p className="section-label mb-3 px-1">Activity</p>
          <div className="grid grid-cols-3 gap-3">
            <StatChip icon={Zap} label="Sync Points" value={syncStats.points} color="border-indigo-500/15" />
            <StatChip icon={Flame} label="Streak" value={`${syncStats.streak}🔥`} color="border-orange-500/15" />
            <StatChip icon={BarChart3} label="Role" value={user?.role === "admin" ? "Admin" : "Student"} color="border-blue-500/15" />
          </div>
        </motion.div>

        {/* ── Action Buttons ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p className="section-label mb-3 px-1">Account Settings</p>
          <div className="glass rounded-[2rem] p-2 space-y-1">
            {[
              !user?.email1 && { id: "addEmail", icon: Mail, label: "Add Secondary Email", sub: "Required for password recovery", color: "text-emerald-400" },
              user?.email1 && { id: "changeEmail", icon: Edit3, label: "Change Secondary Email", sub: user?.email1, color: "text-amber-400" },
              { id: "changePwd", icon: Lock, label: "Change Password", sub: "Update your login password", color: "text-indigo-400" },
            ].filter(Boolean).map(item => (
              <button key={item.id} onClick={() => setPanel(panel === item.id ? null : item.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all hover:bg-white/5 text-left ${panel === item.id ? "bg-white/5" : ""}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${panel === item.id ? "bg-indigo-500/20" : "bg-white/5"}`}>
                  <item.icon size={16} className={item.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">{item.label}</p>
                  <p className="text-xs text-slate-500 truncate">{item.sub}</p>
                </div>
                <div className={`w-2 h-2 rounded-full transition-colors ${panel === item.id ? "bg-indigo-400" : "bg-white/10"}`} />
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Panels ── */}
        <AnimatePresence>
          {panel === "addEmail" && (
            <motion.div key="addEmail" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <form onSubmit={handleAddEmail} className="glass rounded-[2rem] p-7 space-y-5">
                <p className="font-black text-white">Add Secondary Email</p>
                <InputField icon={Mail} type="email" value={email1} onChange={e => setEmail1(e.target.value)} placeholder="recovery@email.com" />
                <button type="submit" disabled={loading} className="btn-primary">{loading ? "Saving..." : "Save Email"}</button>
              </form>
            </motion.div>
          )}
          {panel === "changeEmail" && (
            <motion.div key="changeEmail" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <form onSubmit={handleChangeEmail} className="glass rounded-[2rem] p-7 space-y-5">
                <p className="font-black text-white">Change Secondary Email</p>
                <InputField icon={Mail} type="email" value={newEmail1} onChange={e => setNewEmail1(e.target.value)} placeholder="new@email.com" />
                <button type="submit" disabled={loading} className="btn-primary">{loading ? "Saving..." : "Update Email"}</button>
              </form>
            </motion.div>
          )}
          {panel === "changePwd" && (
            <motion.div key="changePwd" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <form onSubmit={handlePasswordChange} className="glass rounded-[2rem] p-7 space-y-5">
                <p className="font-black text-white">Change Password</p>
                <InputField icon={KeyRound} type={showCur ? "text" : "password"} label="Current Password" value={form.currentPassword}
                  onChange={e => setForm({ ...form, currentPassword: e.target.value })} placeholder="Current password"
                  right={<button type="button" onClick={() => setShowCur(!showCur)} className="text-slate-500 hover:text-slate-300 p-1">{showCur ? <EyeOff size={14} /> : <Eye size={14} />}</button>} />
                <InputField icon={Lock} type={showNew ? "text" : "password"} label="New Password" value={form.newPassword}
                  onChange={e => setForm({ ...form, newPassword: e.target.value })} placeholder="Min 6 characters"
                  right={<button type="button" onClick={() => setShowNew(!showNew)} className="text-slate-500 hover:text-slate-300 p-1">{showNew ? <EyeOff size={14} /> : <Eye size={14} />}</button>} />
                <InputField icon={Lock} type="password" label="Confirm Password" value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Repeat password" />
                <button type="submit" disabled={loading} className="btn-primary">{loading ? "Updating..." : "Update Password"}</button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
