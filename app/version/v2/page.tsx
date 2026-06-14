"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle,
  BookOpen,
  ArrowRight,
  Save,
  Clock,
  Trash2,
  History,
  User,
  ShieldCheck,
  MessageSquare,
  Check,
  X,
  Download,
  FileText,
} from "lucide-react";

// กำหนดโครงสร้างข้อมูล
interface DailyLog {
  id: string;
  date: string;
  done: string;
  learned: string;
  nextSteps: string;
  status: "pending" | "approved" | "rejected"; // เพิ่มสถานะ
  supervisorComment?: string; // เพิ่มคอมเมนต์พี่เลี้ยง
}

type Role = "intern" | "supervisor";

export default function App() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [role, setRole] = useState<Role>("intern"); // จำลองระบบ Login
  const [formData, setFormData] = useState({
    done: "",
    learned: "",
    nextSteps: "",
  });
  const [reviewData, setReviewData] = useState<{ [key: string]: string }>({}); // เก็บข้อความรีวิวของพี่เลี้ยง

  // โหลดข้อมูล
  useEffect(() => {
    const savedLogs = localStorage.getItem("intern_logs");
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);

  // ฟังก์ชันของฝั่ง Intern
  const handleSaveLog = () => {
    if (!formData.done && !formData.learned && !formData.nextSteps) return;

    const newLog: DailyLog = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      done: formData.done,
      learned: formData.learned,
      nextSteps: formData.nextSteps,
      status: "pending",
      supervisorComment: "",
    };

    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem("intern_logs", JSON.stringify(updatedLogs));
    setFormData({ done: "", learned: "", nextSteps: "" });
  };

  const handleDelete = (id: string) => {
    const updatedLogs = logs.filter((log) => log.id !== id);
    setLogs(updatedLogs);
    localStorage.setItem("intern_logs", JSON.stringify(updatedLogs));
  };

  // ฟังก์ชันของฝั่ง Supervisor
  const handleReview = (id: string, status: "approved" | "rejected") => {
    const updatedLogs = logs.map((log) => {
      if (log.id === id) {
        return {
          ...log,
          status,
          supervisorComment: reviewData[id] || log.supervisorComment,
        };
      }
      return log;
    });
    setLogs(updatedLogs);
    localStorage.setItem("intern_logs", JSON.stringify(updatedLogs));

    // เคลียร์ช่องพิมพ์หลังจากรีวิวเสร็จ
    const newReviewData = { ...reviewData };
    delete newReviewData[id];
    setReviewData(newReviewData);
  };

  // ฟังก์ชันส่งออกรายงาน (Export to Text)
  const handleExport = () => {
    let reportText = "รายงานการฝึกงานประจำวัน\n=========================\n\n";
    logs.forEach((log) => {
      reportText += `วันที่: ${log.date}\n`;
      reportText += `สถานะ: ${log.status === "approved" ? "✅ อนุมัติแล้ว" : log.status === "rejected" ? "❌ ต้องแก้ไข" : "⏳ รอตรวจ"}\n`;
      reportText += `1. งานที่ทำ:\n${log.done || "-"}\n`;
      reportText += `2. สิ่งที่เรียนรู้:\n${log.learned || "-"}\n`;
      reportText += `3. แผนวันพรุ่งนี้:\n${log.nextSteps || "-"}\n`;
      if (log.supervisorComment) {
        reportText += `ความเห็นพี่เลี้ยง: ${log.supervisorComment}\n`;
      }
      reportText += `-------------------------\n\n`;
    });

    const blob = new Blob([reportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `intern_report_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ---------------- Render Helpers ----------------
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Check size={14} /> อนุมัติแล้ว
          </span>
        );
      case "rejected":
        return (
          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <X size={14} /> ให้แก้ไข
          </span>
        );
      default:
        return (
          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Clock size={14} /> รอตรวจ
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto">
        {/* Header & Role Toggle */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Clock className="text-blue-600" size={32} />
              Internship Tracker
            </h1>
            <p className="text-slate-500 mt-2">
              บันทึกผลงานเพื่อรายงานอาจารย์ที่ปรึกษา
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* ปุ่มส่งออกรายงาน */}
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl shadow-sm hover:bg-gray-50 transition-colors text-sm font-semibold"
            >
              <Download size={18} />
              Export Report
            </button>

            {/* ระบบจำลอง Login / สลับ Role */}
            <div className="flex items-center bg-white p-1 rounded-xl shadow-sm border border-gray-100">
              <button
                onClick={() => setRole("intern")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${role === "intern" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-50"}`}
              >
                <User size={16} /> Intern Mode
              </button>
              <button
                onClick={() => setRole("supervisor")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${role === "supervisor" ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-50"}`}
              >
                <ShieldCheck size={16} /> Supervisor Mode
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ส่วนที่ 1: ฟอร์มกรอกข้อมูล (แสดงเฉพาะ Intern) */}
          {role === "intern" && (
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800">
                  <Save className="text-blue-500" size={24} />
                  บันทึกประจำวัน
                </h2>

                <div className="mb-5">
                  <label className="flex items-center gap-2 font-semibold text-slate-700 mb-2">
                    <CheckCircle size={18} className="text-green-500" />
                    1. วันนี้ทำอะไรไปบ้าง?
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none h-24 text-sm"
                    placeholder="งานที่ได้รับมอบหมาย / ผลลัพธ์..."
                    value={formData.done}
                    onChange={(e) =>
                      setFormData({ ...formData, done: e.target.value })
                    }
                  />
                </div>

                <div className="mb-5">
                  <label className="flex items-center gap-2 font-semibold text-slate-700 mb-2">
                    <BookOpen size={18} className="text-purple-500" />
                    2. ได้เรียนรู้อะไรใหม่?
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none h-24 text-sm"
                    placeholder="เทคโนโลยีใหม่ / Business Logic..."
                    value={formData.learned}
                    onChange={(e) =>
                      setFormData({ ...formData, learned: e.target.value })
                    }
                  />
                </div>

                <div className="mb-6">
                  <label className="flex items-center gap-2 font-semibold text-slate-700 mb-2">
                    <ArrowRight size={18} className="text-orange-500" />
                    3. แผนสำหรับวันพรุ่งนี้?
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none h-24 text-sm"
                    placeholder="สิ่งที่ต้องทำต่อ / คำถามที่ต้องถามพี่เลี้ยง..."
                    value={formData.nextSteps}
                    onChange={(e) =>
                      setFormData({ ...formData, nextSteps: e.target.value })
                    }
                  />
                </div>

                <button
                  onClick={handleSaveLog}
                  disabled={
                    !formData.done && !formData.learned && !formData.nextSteps
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Save size={20} /> ส่งบันทึกให้พี่เลี้ยง
                </button>
              </div>
            </div>
          )}

          {/* ส่วนที่ 2: ประวัติย้อนหลัง (ถ้าเป็น Supervisor จะขยายเต็มจอ) */}
          <div
            className={role === "intern" ? "lg:col-span-7" : "lg:col-span-12"}
          >
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-full">
              <h2 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                <FileText className="text-indigo-500" size={24} />
                {role === "intern"
                  ? "ประวัติของฉัน (My Logs)"
                  : "รายการบันทึกรอการตรวจสอบ (Review Dashboard)"}
              </h2>

              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <BookOpen size={48} className="mb-4 opacity-50" />
                  <p>ยังไม่มีข้อมูลบันทึกในระบบ</p>
                </div>
              ) : (
                <div
                  className={
                    role === "supervisor"
                      ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                      : "space-y-6"
                  }
                >
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-5 border border-gray-100 rounded-2xl bg-slate-50 hover:shadow-md transition-shadow relative"
                    >
                      {/* ส่วนหัวของ Card */}
                      <div className="flex justify-between items-start mb-4 border-b border-gray-200 pb-3">
                        <div className="font-semibold text-sm text-gray-600">
                          {log.date}
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(log.status)}
                          {role === "intern" && log.status === "pending" && (
                            <button
                              onClick={() => handleDelete(log.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* ส่วนเนื้อหา Log */}
                      <div className="space-y-4">
                        {log.done && (
                          <div>
                            <span className="text-xs font-bold text-gray-500 uppercase">
                              What I Did
                            </span>
                            <p className="text-slate-800 text-sm mt-1">
                              {log.done}
                            </p>
                          </div>
                        )}
                        {log.learned && (
                          <div>
                            <span className="text-xs font-bold text-gray-500 uppercase">
                              What I Learned
                            </span>
                            <p className="text-slate-800 text-sm mt-1">
                              {log.learned}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* ส่วนของพี่เลี้ยง (Supervisor Review Area) */}
                      {role === "supervisor" && log.status === "pending" && (
                        <div className="mt-5 pt-5 border-t border-indigo-100 bg-indigo-50/50 p-4 rounded-xl">
                          <label className="text-xs font-bold text-indigo-700 flex items-center gap-1 mb-2">
                            <MessageSquare size={14} /> เพิ่มคำแนะนำให้พนักงาน
                            (Feedback)
                          </label>
                          <textarea
                            className="w-full p-2 border border-indigo-200 rounded-lg text-sm outline-none focus:border-indigo-400 resize-none h-20 mb-3 bg-white"
                            placeholder="เขียนคำแนะนำ หรือบอกสิ่งที่ต้องแก้..."
                            value={reviewData[log.id] || ""}
                            onChange={(e) =>
                              setReviewData({
                                ...reviewData,
                                [log.id]: e.target.value,
                              })
                            }
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReview(log.id, "approved")}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 rounded-lg transition-colors"
                            >
                              อนุมัติ (Approve)
                            </button>
                            <button
                              onClick={() => handleReview(log.id, "rejected")}
                              className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-bold py-2 rounded-lg transition-colors"
                            >
                              ให้แก้ไข (Reject)
                            </button>
                          </div>
                        </div>
                      )}

                      {/* แสดงคอมเมนต์พี่เลี้ยง (ถ้ามี) */}
                      {log.supervisorComment && (
                        <div
                          className={`mt-4 p-3 rounded-lg text-sm border ${log.status === "approved" ? "bg-green-50 border-green-100 text-green-800" : "bg-red-50 border-red-100 text-red-800"}`}
                        >
                          <strong className="flex items-center gap-1 mb-1">
                            <MessageSquare size={14} /> ความเห็นจากพี่เลี้ยง:
                          </strong>
                          <p>{log.supervisorComment}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
