/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Users, Calendar, TrendingUp, AlertTriangle, ShieldAlert, 
  CheckCircle, Clock, Save, Eye, BarChart2, FileText
} from "lucide-react";
import { EarlyWarningAlert } from "../types.js";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Cell
} from "recharts";
import D3MoodChart from "./D3MoodChart";
import { motion } from "motion/react";

interface TeacherPanelProps {
  // Pass any required handlers
}

const COLORS = ["#f43f5e", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];

export default function TeacherPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Statistics state
  const [stats, setStats] = useState<{
    totalStudents: number;
    totalConsultations: number;
    gradeCounts: { [grade: string]: number };
    topicCounts: { [topic: string]: number };
    dailyCounts: { [date: string]: number };
    moodTrends: { date: string; avgScore: number }[];
  } | null>(null);

  // Alerts state
  const [alerts, setAlerts] = useState<EarlyWarningAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<EarlyWarningAlert | null>(null);
  const [alertStatus, setAlertStatus] = useState<'pending' | 'supporting' | 'resolved'>('pending');
  const [alertNotes, setAlertNotes] = useState("");
  const [updatingAlertId, setUpdatingAlertId] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch stats and alerts
  const fetchData = async () => {
    try {
      setLoading(true);
      const statsRes = await fetch("/api/teacher/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData && statsData.gradeCounts ? statsData : null);
      }

      const alertsRes = await fetch("/api/teacher/alerts");
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(Array.isArray(alertsData) ? alertsData : []);
      }
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  // Handle Admin Authorization
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "gvvip123" || password === "admin123") {
      setIsAuthenticated(true);
      setLoginError("");
    } else {
      setLoginError("Mã xác thực của Giáo viên không chính xác!");
    }
  };

  // Select Alert to edit notes
  const handleSelectAlert = (alert: EarlyWarningAlert) => {
    setSelectedAlert(alert);
    setAlertStatus(alert.status);
    setAlertNotes(alert.notes);
  };

  // Update alert status & notes
  const handleUpdateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;

    setUpdatingAlertId(selectedAlert.id);
    try {
      const res = await fetch(`/api/teacher/alerts/${selectedAlert.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: alertStatus,
          notes: alertNotes
        })
      });

      if (res.ok) {
        setUpdateSuccess(true);
        // Refresh alerts lists
        const alertsRes = await fetch("/api/teacher/alerts");
        if (alertsRes.ok) {
          const alertsData = await alertsRes.json();
          setAlerts(alertsData);
          // Update selected alert local state
          const updated = alertsData.find((a: EarlyWarningAlert) => a.id === selectedAlert.id);
          if (updated) {
            setSelectedAlert(updated);
          }
        }
        setTimeout(() => setUpdateSuccess(false), 2500);
      }
    } catch (err) {
      console.error("Error updating alert status:", err);
    } finally {
      setUpdatingAlertId(null);
    }
  };

  // Translate Grade data for recharts
  const getGradeChartData = () => {
    if (!stats) return [];
    return Object.entries(stats.gradeCounts).map(([grade, count]) => ({
      name: `Khối ${grade}`,
      count
    }));
  };

  // Translate Topics data for recharts
  const getTopicChartData = () => {
    if (!stats) return [];
    return Object.entries(stats.topicCounts).map(([topic, count]) => ({
      name: topic,
      "Số lượt": count
    }));
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-rose-50/30 min-h-[480px]">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[32px] shadow-xl shadow-rose-100/40 border border-rose-100/60 max-w-sm w-full text-center"
        >
          <div className="bg-amber-100 p-4 rounded-3xl text-amber-600 inline-block mb-4 border border-amber-200">
            <Lock size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-1 font-display">Cổng Quản Trị Giáo Viên</h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed font-medium">
            Để bảo mật thông tin nhạy cảm của học sinh, vui lòng nhập mã xác thực dành riêng cho Giáo viên phụ trách được cấp quyền.
          </p>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Mã xác nhận quản trị viên *</label>
              <input
                type="password"
                required
                placeholder="Nhập mã xác thực..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-rose-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 text-sm font-medium bg-rose-50/20 placeholder:text-slate-300"
              />
            </div>

            {loginError && (
              <p className="text-rose-500 text-xs font-bold text-center">{loginError}</p>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold py-3 rounded-full text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-rose-200 cursor-pointer"
            >
              Mở khóa Bảng Quản Trị <ArrowRight size={14} />
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-rose-50/30 text-slate-800">
      {/* Subheader */}
      <div className="bg-white border-b border-rose-100 px-6 py-4 shrink-0 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-rose-500 p-2 rounded-xl text-white shadow-md shadow-rose-200">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-950 leading-tight font-display">Hệ thống Cảnh báo Sớm & Quản trị</h1>
              <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider font-sans">BÀN LÀM VIỆC CỦA GIÁO VIÊN & CHUYÊN VIÊN TÂM LÝ - THCS PHƯỚC HƯNG</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-stretch md:self-auto justify-between">
            <button
              onClick={() => window.open('/api/teacher/export-report', '_blank')}
              className="bg-blue-50 hover:bg-blue-100 border border-blue-100 px-3.5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 text-blue-600 cursor-pointer"
            >
              <FileText size={14} /> Xuất Báo Cáo
            </button>
            <button
              onClick={fetchData}
              className="bg-rose-50 hover:bg-rose-100 border border-rose-100 px-3.5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 text-rose-600 cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Tải lại dữ liệu
            </button>
            <span className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-3.5 py-1.5 rounded-full text-[10px] font-mono tracking-wider font-bold shadow-sm">
              ● KẾT NỐI AN TOÀN
            </span>
          </div>
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-20 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-rose-500 border-t-transparent"></div>
          <p className="text-xs font-mono">Đang truy vấn dữ liệu từ máy chủ trung tâm...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-6xl mx-auto w-full">
          {/* Stats Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-rose-100/50 rounded-3xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
              <div className="bg-blue-100 p-3 rounded-2xl text-blue-600 shadow-sm">
                <Users size={22} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Học sinh sử dụng</span>
                <h3 className="text-lg font-bold font-mono text-slate-800 leading-none mt-1">{stats?.totalStudents || 0} em</h3>
              </div>
            </div>

            <div className="bg-white border border-rose-100/50 rounded-3xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
              <div className="bg-violet-100 p-3 rounded-2xl text-violet-600 shadow-sm">
                <Calendar size={22} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lượt tư vấn tích lũy</span>
                <h3 className="text-lg font-bold font-mono text-slate-800 leading-none mt-1">{stats?.totalConsultations || 0} lượt</h3>
              </div>
            </div>

            <div className="bg-white border border-rose-100/50 rounded-3xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
              <div className="bg-amber-100 p-3 rounded-2xl text-amber-600 shadow-sm animate-pulse">
                <AlertTriangle size={22} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cảnh báo (Chờ xử lý)</span>
                <h3 className="text-lg font-bold font-mono text-amber-600 leading-none mt-1">
                  {alerts.filter(a => a.status === 'pending').length} vụ việc
                </h3>
              </div>
            </div>

            <div className="bg-white border border-rose-100/50 rounded-3xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
              <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600 shadow-sm">
                <CheckCircle size={22} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đã hỗ trợ thành công</span>
                <h3 className="text-lg font-bold font-mono text-emerald-600 leading-none mt-1">
                  {alerts.filter(a => a.status === 'resolved').length} ca
                </h3>
              </div>
            </div>
          </div>

          {/* Graphical Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Grade breakdown chart */}
            <div className="bg-white border border-rose-100/50 rounded-3xl p-5 shadow-sm">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5 font-display">
                <BarChart2 size={16} className="text-blue-500" /> Thống kê theo Khối lớp
              </h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getGradeChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#f1f5f9", borderRadius: "16px", boxShadow: "0 4px 12px -2px rgba(244,63,94,0.08)", color: "#0f172a" }} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                      {getGradeChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Topics Popular breakdown */}
            <div className="bg-white border border-rose-100/50 rounded-3xl p-5 shadow-sm">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5 font-display">
                <BarChart2 size={16} className="text-emerald-500" /> Phân loại Nhóm khó khăn
              </h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getTopicChartData()} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#64748b" fontSize={11} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={9} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#f1f5f9", borderRadius: "16px", boxShadow: "0 4px 12px -2px rgba(244,63,94,0.08)", color: "#0f172a" }} />
                    <Bar dataKey="Số lượt" fill="#10b981" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Mental Health Trends over time */}
            <div className="bg-white border border-rose-100/50 rounded-3xl p-5 shadow-sm">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5 font-display">
                <TrendingUp size={16} className="text-rose-500 animate-pulse" /> Xu hướng sức khỏe toàn trường
              </h4>
              <div className="h-[200px]">
                <D3MoodChart data={stats?.moodTrends || []} />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-center italic">
                Chỉ số Cảm xúc Trung bình (Thang đo 1: Rất tệ → 5: Rất tuyệt)
              </p>
            </div>
          </div>

          {/* Early Intervention Center and Warn Hub */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Alerts Inbox */}
            <div className="bg-white border border-rose-100 rounded-3xl p-5 shadow-sm flex flex-col h-[420px]">
              <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-3.5 flex items-center gap-1.5 shrink-0 font-display">
                <ShieldAlert size={16} className="animate-bounce" /> Kênh cảnh báo sớm nguy cơ cao
              </h4>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                {alerts.length === 0 ? (
                  <div className="text-center py-24 text-slate-400 text-xs italic font-medium">
                    Không phát hiện bất kỳ cảnh báo sớm nguy cơ cao nào. Thật tuyệt vời!
                  </div>
                ) : (
                  alerts.map(a => {
                    const isSelected = selectedAlert?.id === a.id;
                    const statusConfig = {
                      pending: { bg: "bg-red-50 border-red-200 text-red-600", label: "Chờ xử lý" },
                      supporting: { bg: "bg-amber-50 border-amber-200 text-amber-600", label: "Đang hỗ trợ" },
                      resolved: { bg: "bg-emerald-50 border-emerald-200 text-emerald-600", label: "Đã giải quyết" }
                    }[a.status] || { bg: "bg-slate-100 text-slate-500", label: "Không rõ" };

                    return (
                      <div
                        key={a.id}
                        onClick={() => handleSelectAlert(a)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-rose-50/40 border-rose-400 shadow-md shadow-rose-100/50"
                            : "bg-slate-50/50 border-slate-100/60 hover:bg-rose-50/10 hover:border-rose-200"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            {new Date(a.timestamp).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${statusConfig.bg}`}>
                            {statusConfig.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-bold text-slate-800">{a.nickname}</span>
                          <span className="bg-slate-200 text-slate-600 font-semibold px-2 py-0.5 rounded-full text-[9px]">Lớp {a.grade}</span>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                          {a.detectedReason}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Intervention Action Center */}
            <div className="bg-white border border-rose-100 rounded-3xl p-5 shadow-sm flex flex-col h-[420px]">
              <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3.5 flex items-center gap-1.5 shrink-0 font-display">
                <Clock size={16} /> Báo cáo can thiệp sư phạm học đường
              </h4>

              {selectedAlert ? (
                <form onSubmit={handleUpdateAlert} className="flex-1 flex flex-col justify-between">
                  <div className="space-y-4 overflow-y-auto pr-1 scrollbar-thin">
                    <div className="bg-rose-50/20 p-4 rounded-2xl border border-rose-100/40">
                      <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1.5">
                        <span>Học sinh: <b className="text-slate-800 font-display">{selectedAlert.nickname} (Khối {selectedAlert.grade})</b></span>
                        <span>Nhóm rắc rối: <b className="text-rose-500">{selectedAlert.issueCategory}</b></span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1 italic font-medium">
                        &ldquo; {selectedAlert.detectedReason} &rdquo;
                      </p>
                      {selectedAlert.chatSummary && (
                        <div className="mt-3 pt-2.5 border-t border-rose-100/40">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Tóm tắt nội dung hội thoại:</span>
                          <p className="text-xs text-amber-700 leading-normal mt-1 font-medium bg-amber-50 p-2.5 rounded-xl border border-amber-100/40">{selectedAlert.chatSummary}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Tiến trình can thiệp</label>
                        <select
                          value={alertStatus}
                          onChange={e => setAlertStatus(e.target.value as any)}
                          className="w-full bg-white border border-rose-100 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 cursor-pointer"
                        >
                          <option value="pending">Chờ xử lý (Mới nhận)</option>
                          <option value="supporting">Đang can thiệp / hỗ trợ</option>
                          <option value="resolved">Đã giải quyết xong</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <span className="text-[9px] text-slate-400 italic leading-tight font-medium">
                          * Chỉ lưu vết hồ sơ can thiệp sư phạm nội bộ. Tôn trọng quyền riêng tư 100%.
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Nhật ký xử lý sư phạm của thầy cô *</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Ghi nhận hướng xử lý (Ví dụ: Thầy Tổng phụ trách đã gặp kín trao đổi động viên em, liên hệ với giáo viên chủ nhiệm đồng hành...)"
                        value={alertNotes}
                        onChange={e => setAlertNotes(e.target.value)}
                        className="w-full bg-white border border-rose-100 rounded-2xl px-4 py-2.5 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 resize-none font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-rose-100/50 flex items-center justify-between shrink-0">
                    {updateSuccess ? (
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle size={14} /> Cập nhật hồ sơ thành công!
                      </span>
                    ) : (
                      <span></span>
                    )}

                    <button
                      type="submit"
                      disabled={updatingAlertId !== null}
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold px-5 py-2.5 rounded-full text-xs shadow-md shadow-emerald-100 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Save size={14} /> Lưu hồ sơ can thiệp
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs italic bg-slate-50/50 rounded-2xl border border-dashed border-rose-200">
                  <Eye size={24} className="mb-2 text-rose-400/80 animate-pulse" />
                  Vui lòng chọn một vụ việc cảnh báo bên trái để tiến hành lập hồ sơ can thiệp, cập nhật nhật ký sư phạm.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
