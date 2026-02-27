"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Image as ImageIcon, Sparkles, Layout, Mail, Info, Trash2, CheckCircle, AlertCircle, Eye, History } from "lucide-react";

export default function SendEmailForm() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [resultsLog, setResultsLog] = useState([]);

  // Preset messages
  const presets = {
    Announcement: {
      subject: "📢 New Announcement from CSBS SYNC",
      message: "We have an important announcement for all users. Please check the dashboard for more details regarding upcoming events and academic updates.",
      icon: <Sparkles className="w-4 h-4" />
    },
    Deadlines: {
      subject: "⏰ Urgent: Upcoming Deadlines Reminder",
      message: "This is a reminder regarding upcoming task deadlines. Please ensure all pending assignments and work submissions are completed on time.",
      icon: <Info className="w-4 h-4" />
    },
    Materials: {
      subject: "📚 New Study Materials Uploaded",
      message: "New study materials and resources have been uploaded to the portal. You can now access them under the 'Material' section in your dashboard.",
      icon: <Layout className="w-4 h-4" />
    },
  };

  const handlePreset = (key) => {
    setSubject(presets[key].subject);
    setMessage(presets[key].message);
    setStatus("");
  };

  const handleClear = () => {
    setSubject("");
    setMessage("");
    setStatus("");
  };

  const handleSend = async () => {
    if (!subject || !message) {
      setStatus("❌ Subject and message are required");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus(`✅ ${data.message}`);
        setResultsLog(prev => [{
          id: Date.now(),
          time: new Date().toLocaleTimeString(),
          subject,
          count: data.results?.length || 0,
          success: true
        }, ...prev]);
        // Don't clear immediately so user can see what they sent, but maybe clear after a delay or on next action
      } else {
        setStatus(`❌ ${data.message || "Failed to send email"}`);
      }
    } catch (err) {
      console.error(err);
      setStatus("❌ Server error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200"
        >
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
              <Mail className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Mail Broadcaster</h1>
              <p className="text-slate-500 text-sm">Send updates to all CSBS Sync users instantly</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${showPreview ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <Eye className="w-4 h-4" />
              {showPreview ? "Hide Preview" : "Show Preview"}
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Editor */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col gap-6">
              
              {/* Presets */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Quick Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(presets).map((key) => (
                    <button
                      key={key}
                      onClick={() => handlePreset(key)}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-sm font-medium text-slate-700 hover:text-indigo-700 transition-all"
                    >
                      {presets[key].icon}
                      {key}
                    </button>
                  ))}
                  <button
                    onClick={handleClear}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-xl text-sm font-medium text-slate-400 hover:text-red-500 transition-all ml-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Subject Line</label>
                  <input
                    type="text"
                    placeholder="E.g. Internal Assessment Updates"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-slate-50/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Message Content</label>
                  <textarea
                    placeholder="Type your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={10}
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-slate-50/50 resize-none"
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 flex flex-col gap-4">
                <button
                  onClick={handleSend}
                  disabled={loading || !subject || !message}
                  className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg transition-all transform active:scale-[0.98] ${
                    loading || !subject || !message
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:shadow-indigo-200 hover:translate-y-[-2px]"
                  }`}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  {loading ? "Sending Broadcast..." : "Send to All Users"}
                </button>

                <AnimatePresence>
                  {status && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`p-4 rounded-2xl border flex items-center gap-3 ${
                        status.includes("✅") 
                          ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                          : "bg-red-50 border-red-100 text-red-700"
                      }`}
                    >
                      {status.includes("✅") ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      <span className="font-medium">{status}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Preview & History */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-5 space-y-8"
          >
            {/* Live Preview */}
            <AnimatePresence>
              {showPreview && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden"
                >
                  <div className="bg-slate-800 p-4 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Live Preview</span>
                    <div className="w-8" />
                  </div>
                  
                  <div className="p-0 bg-slate-100 min-h-[400px]">
                     {/* Mock Browser/Mail App */}
                     <div className="bg-white m-4 rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[350px]">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                          <p className="text-xs text-slate-400 font-medium uppercase mb-1">Subject</p>
                          <p className="text-sm font-bold text-slate-800">{subject || "(No Subject)"}</p>
                        </div>
                        
                        <div className="p-0">
                          {/* Inner Email Template Copy */}
                          <div className="w-full bg-[#f3f4f6] p-4 font-sans text-left">
                            <div className="max-w-[400px] mx-auto bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                              <div className="bg-[#1e3a8a] py-4 text-center">
                                <img src="https://ik.imagekit.io/9t9wl5ryo/123.jpg" alt="CSBS SYNC" className="w-24 mx-auto" />
                              </div>
                              <div className="p-6">
                                <h2 className="text-lg font-bold text-slate-900 mb-3 text-center text-balance">📩 You Have a New Message</h2>
                                <p className="text-xs text-slate-500 text-center mb-4 leading-relaxed">
                                  Hello, CSBS SYNC has sent you a message. See the details below:
                                </p>
                                <div className="bg-[#f9fafb] p-4 rounded-lg border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed min-h-[100px]">
                                  {message || "Message content will appear here..."}
                                </div>
                              </div>
                              <div className="bg-[#eef2ff] p-4 border-t border-slate-200">
                                <p className="text-[10px] font-bold text-[#1e3a8a] uppercase tracking-wider mb-1">Sender Info</p>
                                <p className="text-[11px] text-slate-600">CSBS SYNC Team</p>
                              </div>
                              <div className="p-3 text-center border-t border-slate-100 bg-slate-50">
                                <p className="text-[9px] text-slate-400 leading-tight">© 2025 CSBS SYNC. This is an automated message.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recent History */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-6">
                <History className="w-5 h-5 text-slate-400" />
                <h3 className="font-bold text-slate-800">Session Sent Log</h3>
              </div>
              
              <div className="space-y-4">
                {resultsLog.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 text-sm italic">No emails sent this session</p>
                  </div>
                ) : (
                  resultsLog.map((log) => (
                    <motion.div 
                      key={log.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{log.subject}</p>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono">{log.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Success
                        </div>
                        <p className="text-xs text-slate-500">Sent to {log.count} recipients</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
