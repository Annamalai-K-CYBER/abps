"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { jwtDecode } from "jwt-decode";
import { Menu, X, LogOut, LayoutDashboard, BookOpen, Library, Briefcase, Bell, User as UserIcon, Activity, Sun, Moon, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;
      if (decoded.exp && decoded.exp < now) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }
      setUser(decoded);
    } catch {
      localStorage.removeItem("token");
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const navItems = [
    { name: "Home", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
    { name: "Study", href: "/dashboard/study", icon: <BookOpen size={18} /> },
    { name: "Material", href: "/dashboard/material", icon: <Library size={18} /> },
    { name: "Work", href: "/dashboard/work", icon: <Briefcase size={18} /> },
    { name: "Announcements", href: "/dashboard/announcement", icon: <Bell size={18} /> },
    { name: "Leaderboard", href: "/dashboard/leaderboard", icon: <Trophy size={18} /> },
    { name: "Profile", href: "/dashboard/profile", icon: <UserIcon size={18} /> },
  ];

  return (
    <div className="min-h-screen dark bg-[#020617] text-slate-100 selection:bg-indigo-500/20 selection:text-indigo-200">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-900/10 blur-[100px] rounded-full" />
      </div>

      {/* Navbar */}
      <header 
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled 
            ? "bg-slate-950/80 backdrop-blur-lg border-b border-slate-800 shadow-xl py-3" 
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center text-sm">
          <div className="flex items-center gap-10">
            <Link href="/dashboard" className="flex flex-col group">
              <h1 className={`text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 animate-gradient-x group-hover:scale-105 transition-transform cursor-pointer`}>
                CSBS Sync
              </h1>
              <div className="flex items-center gap-1.5 md:hidden">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className={`text-[10px] font-bold ${darkMode ? "text-slate-400" : "text-slate-500"} tracking-wider uppercase`}>Live Now</span>
              </div>
            </Link>

            {/* Desktop Menu */}
            <nav className="hidden lg:flex gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
                    pathname === item.href
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 translate-y-[-1px]"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden lg:flex items-center gap-6">
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Authenticated</span>
              <p className="font-bold text-slate-200">{user?.username || "Fetching..."}</p>
            </div>
            <div className="h-8 w-[1px] bg-slate-800" />
            <button
              onClick={handleLogout}
              className="group flex items-center gap-2 bg-slate-900 text-slate-300 hover:text-red-400 border border-slate-800 font-bold px-4 py-2 rounded-xl transition-all active:scale-95 hover:shadow-lg hover:bg-slate-800"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>

          <div className="flex items-center gap-3 lg:hidden">
            <button
              className="p-2.5 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 shadow-sm active:scale-90 transition-transform"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-slate-950/95 backdrop-blur-2xl border-b border-slate-800 shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-8 flex flex-col gap-3">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${
                      pathname === item.href
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "text-slate-400 bg-slate-900/50"
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
                <div className="pt-4 mt-2 border-t border-slate-900">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-3 bg-red-500/10 text-red-500 font-bold py-4 rounded-2xl hover:bg-red-500/20 transition-colors"
                  >
                    <LogOut size={20} />
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-slate-900/40 backdrop-blur-3xl border border-slate-800/50 rounded-[3rem] shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)] min-h-[600px] overflow-hidden"
        >
          {children}
        </motion.div>
      </main>

      {/* Footer / Engagement bar */}
      <footer className="relative z-10 max-w-7xl mx-auto px-6 pb-12">
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl overflow-hidden relative group">
           {/* Glow Effect */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity" />
           
           <div className="flex items-center gap-5">
              <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700/50">
                <Activity size={28} className="text-indigo-400" />
              </div>
              <div className="text-left">
                <p className="font-black text-xl tracking-tight">CSBS Health Check</p>
                <div className="flex items-center gap-2 text-slate-400 font-medium text-sm mt-0.5">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                   All systems operational & synced
                </div>
              </div>
           </div>
           
           <div className="flex gap-4">
              <div className="bg-slate-800/40 border border-slate-700/50 px-8 py-4 rounded-[1.25rem] text-center">
                 <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Active Users</p>
                 <p className="text-2xl font-black mt-0.5">240+</p>
              </div>
              <div className="bg-slate-800/40 border border-slate-700/50 px-8 py-4 rounded-[1.25rem] text-center">
                 <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Resources</p>
                 <p className="text-2xl font-black mt-0.5">1.2k+</p>
              </div>
           </div>
        </div>
        <p className="text-center mt-10 text-slate-500 text-sm font-semibold tracking-wide">
          Powered by CSBS SYNC Engine © {new Date().getFullYear()} — Made for Excellence.
        </p>
      </footer>
    </div>
  );
}
