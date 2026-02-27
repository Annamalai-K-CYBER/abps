// "use client";

// export default function Home() {
//   return (
//     <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black text-white">

//       {/* Colorful Animated Background */}
//       <div className="absolute inset-0 bg-gradient-to-r from-pink-600/40 via-purple-700/40 to-blue-600/40 blur-3xl opacity-70 animate-bgMove"></div>

//       {/* Glow Lights */}
//       <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/40 blur-[120px] rounded-full"></div>
//       <div className="absolute bottom-0 right-0 w-72 h-72 bg-cyan-500/40 blur-[120px] rounded-full"></div>

//       {/* Main Card */}
//       <div className="relative z-10 w-full max-w-3xl mx-auto px-6 md:px-10 py-14 bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 animate-fade-in">

//         {/* Highlighted COMING SOON */}
//         <div className="text-center mb-4">
//           <span className="px-5 py-2 text-sm md:text-base font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-lg animate-pulse">
//             🚀 COMING SOON
//           </span>
//         </div>

//         <h1 className="text-4xl md:text-6xl font-extrabold text-center mb-6 drop-shadow-xl">
//           CSBS <span className="text-cyan-400">Sync</span>
//         </h1>

//         {/* Highlighted “Building Something Powerful” */}
//         <p className="text-center text-gray-200 mb-10 text-lg md:text-2xl font-semibold leading-relaxed max-w-2xl mx-auto">
//           We are <span className="text-cyan-300">building something powerful</span> —  
//           a next-generation platform designed for speed, intelligence, and seamless syncing.
//         </p>

//         <p className="text-center text-gray-300 mb-10 text-md md:text-lg leading-relaxed max-w-2xl mx-auto">
//           Our new system is under development and will soon migrate to an upgraded domain.
//           Stay tuned for something game-changing.
//         </p>

//         {/* Feature Cards */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
//           <FeatureCard title="Fast Sync" icon="⚡" color="from-yellow-400 to-orange-500" />
//           <FeatureCard title="Smart Tools" icon="💡" color="from-green-400 to-emerald-500" />
//           <FeatureCard title="New Domain" icon="🌐" color="from-blue-400 to-cyan-500" />
//         </div>

//         <p className="text-center text-gray-400 text-sm">
//           © {new Date().getFullYear()} CSBS Sync — All rights reserved.
//         </p>
//       </div>
//     </main>
//   );
// }


// // Feature Card Component
// function FeatureCard({ title, icon, color }) {
//   return (
//     <div className="p-6 bg-white/10 rounded-2xl border border-white/20 text-center shadow-xl hover:scale-[1.06] hover:bg-white/20 transition-all cursor-pointer backdrop-blur-xl">
//       <div className={`text-4xl mb-3 bg-gradient-to-br ${color} text-transparent bg-clip-text drop-shadow-lg`}>
//         {icon}
//       </div>
//       <p className="text-gray-100 font-semibold text-lg">{title}</p>
//     </div>
//   );
// }
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Mail, Lock, LogIn, Activity } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load saved email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
    }
    
    // Redirect if already logged in
    const token = localStorage.getItem("token");
    if (token) router.push("/dashboard");
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.message || "Invalid credentials");
        setLoading(false);
        return;
      }

      if (data?.token) {
        // Save email for next time
        localStorage.setItem("rememberedEmail", email);
        
        localStorage.setItem("token", data.token);
        if (data?.user?.role) localStorage.setItem("role", data.user.role);
        router.push("/dashboard");
      } else {
        setError("No token received from server");
      }
    } catch {
      setError("Server not reachable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 overflow-hidden relative">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-100/50 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100/30 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 w-full max-w-md p-10 md:p-12 border border-slate-100"
      >
        <div className="text-center mb-10">
           <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-4 border border-indigo-100"
          >
            <Activity size={12} />
            Ecosystem Live
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-2 italic">
            CSBS <span className="text-indigo-600 not-italic">Sync</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Synchronizing knowledge. Powering results. 🚀
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
              Student / Admin ID
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <Mail size={18} />
              </div>
              <input
                type="email"
                placeholder="id@csbssync.com"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-medium text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
              Access Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-medium text-sm"
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-xl border border-red-100"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-6 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 hover:shadow-indigo-200 hover:translate-y-[-2px] transform transition-all active:scale-[0.98] disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={20} />
                Access Dashboard
              </>
            )}
          </button>
        </form>

        <footer className="mt-12 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            © {new Date().getFullYear()} CSBS Sync — Excellence in Motion
          </p>
        </footer>
      </motion.div>
    </div>
  );
}
