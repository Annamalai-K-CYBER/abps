"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowLeft, Mail, Lock, KeyRound, RefreshCw, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";

const STEP = { LOGIN: "login", FORGOT: "forgot", OTP: "otp", RESET: "reset", SUCCESS: "success" };

// ─── Reusable Input ───
function Field({ label, icon: Icon, type = "text", value, onChange, placeholder, autoComplete, required, rightSlot }) {
  return (
    <div className="space-y-2">
      {label && <label className="text-[11px] font-black uppercase tracking-[3px] text-indigo-300/80 block">{label}</label>}
      <div className="relative">
        {Icon && <Icon size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400/70 pointer-events-none" />}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className={`w-full py-4 rounded-2xl bg-white/8 border border-white/12 text-white placeholder-white/25 text-sm font-medium
            focus:outline-none focus:border-indigo-400/60 focus:bg-white/12 focus:ring-0
            transition-all duration-200 backdrop-blur-sm
            ${Icon ? "pl-11" : "pl-5"} ${rightSlot ? "pr-12" : "pr-5"}`}
        />
        {rightSlot && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>}
      </div>
    </div>
  );
}

// ─── Feedback message ───
function Msg({ text, ok }) {
  if (!text) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -6, height: 0 }}
      className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium border
        ${ok
          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
          : "bg-red-500/10 border-red-500/20 text-red-300"
        }`}
    >
      {ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      {text}
    </motion.div>
  );
}

// ─── Primary button ───
function PrimaryBtn({ children, loading, onClick, type = "button", disabled, color = "indigo" }) {
  const colors = {
    indigo: "from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 shadow-indigo-500/30",
    green: "from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 shadow-emerald-500/30",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={`w-full py-4 rounded-2xl font-black text-white text-sm tracking-wide
        bg-gradient-to-r ${colors[color]} shadow-xl
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2.5`}
    >
      {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</> : children}
    </button>
  );
}

const cardVariants = {
  enter: { opacity: 0, y: 20, scale: 0.97 },
  center: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.97 },
};

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState(STEP.LOGIN);

  // Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Forgot
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState({ text: "", ok: false });

  // OTP
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");

  // Reset
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("rememberedEmail");
    if (saved) setEmail(saved);
    if (localStorage.getItem("token")) router.push("/dashboard");
  }, [router]);

  // ── LOGIN ──
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setLoginError(data?.message || "Invalid credentials."); return; }
      if (data?.token) {
        localStorage.setItem("rememberedEmail", email);
        localStorage.setItem("token", data.token);
        if (data?.user?.role) localStorage.setItem("role", data.user.role);
        router.push("/dashboard");
      } else { setLoginError("Authentication failed. Please try again."); }
    } catch {
      setLoginError("Network error. Please check your connection.");
    } finally { setLoginLoading(false); }
  };

  // ── FORGOT ──
  const handleForgot = async (e) => {
    e?.preventDefault();
    setForgotMsg({ text: "", ok: false });
    setForgotLoading(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setForgotMsg({ text: data.message, ok: true });
        setTimeout(() => { setStep(STEP.OTP); setForgotMsg({ text: "", ok: false }); }, 1200);
      } else {
        setForgotMsg({ text: data.message, ok: false });
      }
    } catch {
      setForgotMsg({ text: "Network error. Please try again.", ok: false });
    } finally { setForgotLoading(false); }
  };

  // ── OTP Input ──
  const handleOtpChange = (val, i) => {
    const c = val.replace(/\D/, "");
    const next = [...otp]; next[i] = c; setOtp(next);
    if (c && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  };
  const handleOtpKey = (e, i) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) document.getElementById(`otp-${i - 1}`)?.focus();
  };
  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      document.getElementById("otp-5")?.focus();
    }
  };

  const handleVerifyOtp = () => {
    if (otp.join("").length < 6) { setOtpError("Please enter the full 6-digit OTP."); return; }
    setOtpError("");
    setStep(STEP.RESET);
  };

  // ── RESET ──
  const handleReset = async (e) => {
    e.preventDefault();
    setResetError("");
    if (newPwd !== confirmPwd) { setResetError("Passwords do not match."); return; }
    if (newPwd.length < 6) { setResetError("Password must be at least 6 characters."); return; }
    setResetLoading(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp: otp.join(""), newPassword: newPwd }),
      });
      const data = await res.json();
      if (data.success) { setStep(STEP.SUCCESS); }
      else { setResetError(data.message); }
    } catch {
      setResetError("Network error. Please try again.");
    } finally { setResetLoading(false); }
  };

  const goBack = (to) => { return () => { setStep(to); setForgotMsg({ text: "", ok: false }); setOtpError(""); setResetError(""); }; };
  const resetAll = () => { setStep(STEP.LOGIN); setOtp(["","","","","",""]); setForgotEmail(""); setNewPwd(""); setConfirmPwd(""); };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#040c1a] px-4 py-12">

      {/* ── Background ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Grid lines */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px"
          }}
        />
        {/* Glows */}
        <div className="absolute top-[-15%] left-[-5%] w-[600px] h-[600px] bg-indigo-700/20 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-700/15 rounded-full blur-[120px]" />
        <div className="absolute top-[45%] left-[55%] w-[300px] h-[300px] bg-purple-700/10 rounded-full blur-[100px]" />
      </div>

      <AnimatePresence mode="wait">

        {/* ════════ LOGIN ════════ */}
        {step === STEP.LOGIN && (
          <motion.div key="login" variants={cardVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.28, ease: "easeInOut" }} className="w-full max-w-md relative z-10">

            {/* Card */}
            <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.04] backdrop-blur-3xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] p-10">

              {/* Logo */}
              <div className="flex flex-col items-center mb-10">
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                  className="w-16 h-16 rounded-[1.2rem] bg-gradient-to-br from-indigo-500 to-blue-600 shadow-2xl shadow-indigo-600/40 flex items-center justify-center mb-5"
                >
                  <span className="text-white font-black text-2xl tracking-tight">C</span>
                </motion.div>
                <h1 className="text-[28px] font-black text-white tracking-tight leading-none">CSBS SYNC</h1>
                <p className="text-white/35 text-sm mt-2 font-medium">Stay connected. Learn. Collaborate.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <Field
                  label="Email / Student ID"
                  icon={Mail}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="student@college.edu"
                  autoComplete="email"
                  required
                />
                <Field
                  label="Password"
                  icon={Lock}
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  rightSlot={
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="p-1.5 text-white/30 hover:text-white/60 transition-colors rounded-lg">
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />

                <div className="flex justify-end">
                  <button type="button" onClick={() => { setStep(STEP.FORGOT); setForgotEmail(email); }}
                    className="text-indigo-400/80 hover:text-indigo-300 text-xs font-bold transition-colors">
                    Forgot Password?
                  </button>
                </div>

                <AnimatePresence>{loginError && <Msg text={loginError} ok={false} />}</AnimatePresence>

                <PrimaryBtn type="submit" loading={loginLoading}>Sign In →</PrimaryBtn>
              </form>

              {/* Footer */}
              <p className="text-center text-white/20 text-[11px] mt-8 font-medium">
                © {new Date().getFullYear()} CSBS SYNC · Built with ❤️ by Students
              </p>
            </div>

            {/* Floating badge */}
            <div className="flex justify-center mt-4">
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Live · All Systems Operational</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ════════ FORGOT ════════ */}
        {step === STEP.FORGOT && (
          <motion.div key="forgot" variants={cardVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.28 }} className="w-full max-w-md relative z-10">
            <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.04] backdrop-blur-3xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] p-10">
              <button onClick={goBack(STEP.LOGIN)} className="flex items-center gap-1.5 text-white/40 hover:text-white/80 transition-colors text-xs font-bold mb-8">
                <ArrowLeft size={14} /> Back to Login
              </button>

              <div className="flex flex-col items-center mb-8">
                <div className="w-14 h-14 rounded-[1rem] bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center mb-4">
                  <Mail size={22} className="text-indigo-300" />
                </div>
                <h2 className="text-2xl font-black text-white">Forgot Password</h2>
                <p className="text-white/40 text-sm mt-2 text-center leading-relaxed">
                  Enter your primary email. We'll send a 6-digit OTP to your registered secondary email.
                </p>
              </div>

              <form onSubmit={handleForgot} className="space-y-5">
                <Field
                  label="Primary Email"
                  icon={Mail}
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
                <AnimatePresence>{forgotMsg.text && <Msg text={forgotMsg.text} ok={forgotMsg.ok} />}</AnimatePresence>
                <PrimaryBtn type="submit" loading={forgotLoading}>Send OTP →</PrimaryBtn>
              </form>
            </div>
          </motion.div>
        )}

        {/* ════════ OTP ════════ */}
        {step === STEP.OTP && (
          <motion.div key="otp" variants={cardVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.28 }} className="w-full max-w-md relative z-10">
            <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.04] backdrop-blur-3xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] p-10">
              <button onClick={goBack(STEP.FORGOT)} className="flex items-center gap-1.5 text-white/40 hover:text-white/80 transition-colors text-xs font-bold mb-8">
                <ArrowLeft size={14} /> Back
              </button>

              <div className="flex flex-col items-center mb-8">
                <div className="w-14 h-14 rounded-[1rem] bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mb-4">
                  <KeyRound size={22} className="text-emerald-300" />
                </div>
                <h2 className="text-2xl font-black text-white">Enter OTP</h2>
                <p className="text-white/40 text-sm mt-2 text-center leading-relaxed">
                  Check your secondary email.<br />The code expires in <span className="text-white/60 font-bold">10 minutes</span>.
                </p>
              </div>

              {/* OTP Boxes */}
              <div className="flex justify-center gap-2.5 mb-6" onPaste={handleOtpPaste}>
                {otp.map((d, i) => (
                  <motion.input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleOtpChange(e.target.value, i)}
                    onKeyDown={e => handleOtpKey(e, i)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`w-12 h-14 text-center text-2xl font-black rounded-2xl border-2 transition-all duration-150
                      bg-white/5 text-white caret-indigo-400
                      ${d ? "border-indigo-500/70 bg-indigo-500/10" : "border-white/10 focus:border-indigo-400/50 focus:bg-white/10"}
                      focus:outline-none`}
                  />
                ))}
              </div>

              <AnimatePresence>{otpError && <Msg text={otpError} ok={false} />}</AnimatePresence>
              <div className="mt-5 space-y-3">
                <PrimaryBtn onClick={handleVerifyOtp} color="green">Verify OTP →</PrimaryBtn>
                <button
                  onClick={handleForgot}
                  className="w-full py-3 text-white/40 hover:text-white/70 font-bold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={13} /> Resend OTP
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ════════ RESET ════════ */}
        {step === STEP.RESET && (
          <motion.div key="reset" variants={cardVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.28 }} className="w-full max-w-md relative z-10">
            <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.04] backdrop-blur-3xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] p-10">
              <div className="flex flex-col items-center mb-8">
                <div className="w-14 h-14 rounded-[1rem] bg-blue-500/15 border border-blue-500/25 flex items-center justify-center mb-4">
                  <ShieldCheck size={22} className="text-blue-300" />
                </div>
                <h2 className="text-2xl font-black text-white">New Password</h2>
                <p className="text-white/40 text-sm mt-2 text-center">Choose a strong, memorable password.</p>
              </div>

              <form onSubmit={handleReset} className="space-y-5">
                <Field
                  label="New Password"
                  icon={Lock}
                  type={showNewPwd ? "text" : "password"}
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  rightSlot={
                    <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="p-1.5 text-white/30 hover:text-white/60 transition-colors rounded-lg">
                      {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />
                <Field
                  label="Confirm Password"
                  icon={Lock}
                  type="password"
                  value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)}
                  placeholder="Repeat your password"
                  required
                />

                {/* Strength indicator */}
                {newPwd && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1.5">
                      {[...Array(4)].map((_, i) => {
                        const strength = newPwd.length >= 10 ? 4 : newPwd.length >= 8 ? 3 : newPwd.length >= 6 ? 2 : 1;
                        return (
                          <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i < strength
                            ? ["bg-red-500","bg-orange-500","bg-yellow-500","bg-emerald-500"][strength - 1]
                            : "bg-white/10"}`}
                          />
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-white/30 font-medium">
                      {newPwd.length < 6 ? "Too short" : newPwd.length < 8 ? "Weak" : newPwd.length < 10 ? "Good" : "Strong ✓"}
                    </p>
                  </div>
                )}

                <AnimatePresence>{resetError && <Msg text={resetError} ok={false} />}</AnimatePresence>
                <PrimaryBtn type="submit" loading={resetLoading}>Reset Password →</PrimaryBtn>
              </form>
            </div>
          </motion.div>
        )}

        {/* ════════ SUCCESS ════════ */}
        {step === STEP.SUCCESS && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", damping: 14 }} className="w-full max-w-md relative z-10">
            <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.04] backdrop-blur-3xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10, delay: 0.1 }}
                className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 size={44} className="text-emerald-400" />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <h2 className="text-2xl font-black text-white mb-2">Password Reset!</h2>
                <p className="text-white/40 text-sm mb-8">Your password has been changed successfully. You can now sign in.</p>
                <PrimaryBtn onClick={resetAll} color="green">Go to Login →</PrimaryBtn>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
