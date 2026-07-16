/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import StudentPanel from "./components/StudentPanel";
import TeacherPanel from "./components/TeacherPanel";
import { Heart, Users, GraduationCap, Settings, Key, X } from "lucide-react";
import { motion } from "motion/react";

const HAS_CLERK = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export default function App() {
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [studentId, setStudentId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-3-pro-preview");
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem("gemini_api_key");
    if (savedKey) setApiKey(savedKey);
    else setShowSettingsModal(true);

    const savedModel = localStorage.getItem("gemini_model");
    if (savedModel) setSelectedModel(savedModel);
  }, []);

  // Initialize a persistent studentId from localStorage
  useEffect(() => {
    let id = localStorage.getItem("thcs_ph_student_id");
    if (!id) {
      id = `std-${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem("thcs_ph_student_id", id);
    }
    setStudentId(id);
  }, []);

  if (!studentId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-gray-500 font-mono text-sm">
        Đang khởi tạo kết nối an toàn...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-50/20 flex flex-col font-sans antialiased text-slate-800">
      {/* Top Universal Access Bar */}
      <nav className="bg-white/95 text-slate-800 py-3 px-4 md:px-6 shadow-sm shrink-0 flex items-center justify-between border-b border-rose-100/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-2">
          <GraduationCap className="text-rose-500 animate-pulse" size={20} />
          <span className="text-[11px] md:text-xs font-black tracking-wider text-slate-800 font-display">
            CỔNG HỖ TRỢ TÂM LÝ HỌC ĐƯỜNG
          </span>
        </div>
        
        <div className="flex items-center gap-1 bg-rose-50/60 p-1 rounded-full border border-rose-100">
          {HAS_CLERK && (
            <div className="mr-2 border-r border-rose-200 pr-3 flex items-center justify-center">
              <SignedIn>
                <UserButton />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 transition-all cursor-pointer">
                    Đăng nhập
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          )}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-3.5 py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer text-slate-500 hover:text-rose-500 mr-2 border-r border-rose-200 pr-3"
          >
            <Settings size={12} /> <span className="text-red-500 whitespace-nowrap hidden sm:inline">Lấy API key để sử dụng app</span>
          </button>
          <button
            onClick={() => setRole("student")}
            className={`px-3.5 py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              role === "student"
                ? "bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md shadow-rose-200"
                : "text-slate-500 hover:text-rose-500"
            }`}
          >
            <Heart size={12} className={role === "student" ? "fill-current" : ""} /> Học Sinh
          </button>
          <button
            onClick={() => setRole("teacher")}
            className={`px-3.5 py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              role === "teacher"
                ? "bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-amber-200"
                : "text-slate-500 hover:text-amber-500"
            }`}
          >
            <Users size={12} /> Giáo Viên
          </button>
        </div>
      </nav>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <button 
              onClick={() => apiKey && setShowSettingsModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
              <Key size={24} className="text-amber-500" />
              Thiết lập AI
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  API Key (Bắt buộc)
                </label>
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="Nhập Google Gemini API Key..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Lấy key miễn phí tại <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noreferrer" className="text-rose-500 hover:underline font-semibold">Google AI Studio</a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Chọn Model
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: "gemini-3-flash-preview", name: "Gemini 3 Flash", badge: "Nhanh nhất" },
                    { id: "gemini-3-pro-preview", name: "Gemini 3 Pro", badge: "Mặc định / Thông minh nhất" },
                    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", badge: "Dự phòng" }
                  ].map(model => (
                    <button
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      className={`text-left px-4 py-3 rounded-lg border transition-all cursor-pointer ${
                        selectedModel === model.id 
                          ? "border-rose-500 bg-rose-50 shadow-sm" 
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-medium text-sm text-slate-800">{model.name}</div>
                        <div className="text-[10px] font-bold text-rose-500 bg-rose-100 px-2 py-0.5 rounded-full">{model.badge}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => {
                  if (apiKey) {
                    localStorage.setItem("gemini_api_key", apiKey);
                    localStorage.setItem("gemini_model", selectedModel);
                    setShowSettingsModal(false);
                  }
                }}
                disabled={!apiKey}
                className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold transition-colors disabled:opacity-50 cursor-pointer mt-4"
              >
                Lưu cài đặt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Primary Workspace View */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <motion.div
          key={role}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="flex-1 flex flex-col h-full overflow-hidden"
        >
          {role === "student" ? (
            <StudentPanel studentId={studentId} />
          ) : (
            <TeacherPanel />
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-white text-slate-400 py-3 px-4 text-center text-[10px] border-t border-rose-100 shrink-0 font-medium font-sans">
        &copy; 2026 Liên đội THCS Phước Hưng. Tất cả nội dung tham vấn được mã hóa bảo vệ danh tính tuyệt đối.
      </footer>
    </div>
  );
}

