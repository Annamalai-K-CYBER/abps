"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { jwtDecode } from "jwt-decode";
import { Menu, X, LogOut, LayoutDashboard, BookOpen, Library, Briefcase, Bell, User as UserIcon, Activity, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Load theme preference
  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    localStorage.setItem("darkMode", !darkMode);
    setDarkMode(!darkMode);
  };

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
    { name: "Announcement", href: "/dashboard/announcement", icon: <Bell size={18} /> },
    { name: "Profile", href: "/dashboard/profile", icon: <UserIcon size={18} /> },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? "bg-slate-950 text-slate-100" : "bg-[#f1f5f9] text-slate-900"} selection:bg-indigo-100 selection:text-indigo-700`}>
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] ${darkMode ? "bg-indigo-900/10" : "bg-indigo-200/30"} blur-[120px] rounded-full`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] ${darkMode ? "bg-blue-900/10" : "bg-blue-200/20"} blur-[100px] rounded-full`} />
      </div>

      {/* Navbar */}
      <header 
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled 
            ? `${darkMode ? "bg-slate-900/80" : "bg-white/80"} backdrop-blur-lg border-b ${darkMode ? "border-slate-800" : "border-indigo-100"} shadow-sm py-3` 
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
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 translate-y-[-1px]"
                      : `${darkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-600 hover:text-indigo-600 hover:bg-white"}`
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Side */}
          <div className="hidden lg:flex items-center gap-6">
            <button 
              onClick={toggleDarkMode}
              className={`p-2.5 rounded-xl transition-all ${darkMode ? "bg-slate-800 text-yellow-400 border-slate-700" : "bg-white text-indigo-600 border-slate-200"} border shadow-sm active:scale-95`}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="flex flex-col text-right">
              <span className={`text-[11px] font-bold ${darkMode ? "text-slate-500" : "text-slate-400"} uppercase tracking-widest leading-none mb-1`}>Authenticated as</span>
              <p className={`font-bold ${darkMode ? "text-slate-200" : "text-slate-700"}`}>{user?.username || "Fetching..."}</p>
            </div>
            <div className={`h-8 w-[1px] ${darkMode ? "bg-slate-800" : "bg-slate-200"}`} />
            <button
              onClick={handleLogout}
              className={`group flex items-center gap-2 ${darkMode ? "bg-slate-800 text-slate-300 hover:text-red-400 border-slate-700" : "bg-white text-slate-600 hover:text-red-600 border-slate-200"} font-bold px-4 py-2 rounded-xl border transition-all active:scale-95 hover:shadow-sm`}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3 lg:hidden">
            <button 
                onClick={toggleDarkMode}
                className={`p-2 rounded-xl ${darkMode ? "bg-slate-800 text-yellow-400 border-slate-700" : "bg-white text-indigo-600 border-slate-200"} border shadow-sm`}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              className={`p-2 rounded-xl ${darkMode ? "bg-slate-800 text-slate-200 border-slate-700" : "bg-white text-slate-700 border-slate-200"} shadow-sm border active:scale-90 transition-transform`}
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
              className={`lg:hidden ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white/95 border-indigo-50"} backdrop-blur-xl border-b shadow-2xl overflow-hidden`}
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
                        : `${darkMode ? "text-slate-400 bg-slate-800/50" : "text-slate-600 bg-slate-50"}`
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
                <div className={`pt-4 mt-2 border-t ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
                  <button
                    onClick={handleLogout}
                    className={`w-full flex items-center justify-center gap-3 ${darkMode ? "bg-red-900/20 text-red-400" : "bg-red-50 text-red-600"} font-bold py-4 rounded-2xl hover:bg-red-100 transition-colors`}
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

      {/* Main Dashboard Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className={`${darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white/60 border-white/80"} backdrop-blur-2xl border rounded-[2.5rem] shadow-2xl ${darkMode ? "shadow-black/50" : "shadow-indigo-100/50"} min-h-[600px] overflow-hidden`}
        >
          {/* Passing darkMode as a prop to children might be complex via Next.js server-side, 
              but since this is a client component layout, we can use context or just classes */}
          <div className={darkMode ? "dark-theme" : "light-theme"}>
            {children}
          </div>
        </motion.div>
      </main>

      {/* Footer / Engagement bar */}
      <footer className="relative z-10 max-w-7xl mx-auto px-6 pb-12">
        <div className={`${darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-900"} rounded-[2rem] p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl overflow-hidden relative group`}>
           {/* Glow Effect */}
           <div className={`absolute top-0 right-0 w-32 h-32 ${darkMode ? "bg-indigo-400/10" : "bg-indigo-500/20"} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`} />
           
           <div className="flex items-center gap-4">
              <div className={`${darkMode ? "bg-slate-700" : "bg-white/10"} p-3 rounded-2xl`}>
                <Activity size={24} className="text-indigo-400" />
              </div>
              <div className="text-left">
                <p className="font-black text-lg">CSBS Health Check</p>
                <div className="flex items-center gap-2 text-indigo-200/70 text-sm">
                   <div className="w-2 h-2 rounded-full bg-emerald-400" />
                   All systems operational & synced
                </div>
              </div>
           </div>
           
           <div className="flex gap-3">
              <div className={`${darkMode ? "bg-slate-700/50" : "bg-white/5"} border border-white/10 px-6 py-3 rounded-2xl text-center`}>
                 <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Active Users</p>
                 <p className="text-xl font-black">240+</p>
              </div>
              <div className={`${darkMode ? "bg-slate-700/50" : "bg-white/5"} border border-white/10 px-6 py-3 rounded-2xl text-center`}>
                 <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Resources</p>
                 <p className="text-xl font-black">1.2k</p>
              </div>
           </div>
        </div>
        <p className={`text-center mt-8 ${darkMode ? "text-slate-500" : "text-slate-400"} text-sm font-medium`}>
          Powered by CSBS SYNC Engine © {new Date().getFullYear()} — Made for Excellence.
        </p>
      </footer>
    </div>
  );
}
