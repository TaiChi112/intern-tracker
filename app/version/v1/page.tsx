"use client";

import React, { useState } from "react";
import {
  Calendar,
  CheckCircle,
  BookOpen,
  ArrowRight,
  Save,
  Clock,
  Trash2,
  History,
} from "lucide-react";

// กำหนดโครงสร้างข้อมูลของแต่ละ Log
interface DailyLog {
  id: string;
  date: string;
  done: string;
  learned: string;
  nextSteps: string;
}

export default function App() {
  // State สำหรับเก็บประวัติการบันทึก
  const [logs, setLogs] = useState<DailyLog[]>(() => {
    if (typeof window !== "undefined") {
      const savedLogs = localStorage.getItem("intern_logs");
      if (savedLogs) return JSON.parse(savedLogs);
    }
    return [];
  });

  // State สำหรับฟอร์มปัจจุบัน
  const [formData, setFormData] = useState({
    done: "",
    learned: "",
    nextSteps: "",
  });

  // บันทึกข้อมูลลง State และ LocalStorage
  const handleSave = () => {
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
    };

    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem("intern_logs", JSON.stringify(updatedLogs));

    // เคลียร์ฟอร์ม
    setFormData({ done: "", learned: "", nextSteps: "" });
  };

  const handleDelete = (id: string) => {
    const updatedLogs = logs.filter((log) => log.id !== id);
    setLogs(updatedLogs);
    localStorage.setItem("intern_logs", JSON.stringify(updatedLogs));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Clock className="text-blue-600" size={32} />
              Internship Daily Tracker
            </h1>
            <p className="text-slate-500 mt-2">
              บันทึกผลงาน สิ่งที่เรียนรู้ และแผนงานสำหรับวันพรุ่งนี้
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
            <Calendar className="text-slate-400" size={20} />
            <span className="font-medium text-slate-600">
              {new Date().toLocaleDateString("th-TH", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ส่วนที่ 1: ฟอร์มกรอกข้อมูล (ซ้าย) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800">
                <Save className="text-blue-500" size={24} />
                บันทึกประจำวัน
              </h2>

              {/* คำถามที่ 1 */}
              <div className="mb-5">
                <label className="flex items-center gap-2 font-semibold text-slate-700 mb-2">
                  <CheckCircle size={18} className="text-green-500" />
                  1. วันนี้ฉันทำอะไรไปบ้าง? (What did I do?)
                </label>
                <textarea
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none h-28"
                  placeholder="เช่น Setup environment, เข้าประชุม Onboarding, อ่าน Document..."
                  value={formData.done}
                  onChange={(e) =>
                    setFormData({ ...formData, done: e.target.value })
                  }
                />
              </div>

              {/* คำถามที่ 2 */}
              <div className="mb-5">
                <label className="flex items-center gap-2 font-semibold text-slate-700 mb-2">
                  <BookOpen size={18} className="text-purple-500" />
                  2. วันนี้ฉันได้เรียนรู้อะไรใหม่? (What did I learn?)
                </label>
                <textarea
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none h-28"
                  placeholder="เช่น โครงสร้าง Database เบื้องต้น, คำศัพท์แปลกๆ ที่พี่ในทีมพูดถึง..."
                  value={formData.learned}
                  onChange={(e) =>
                    setFormData({ ...formData, learned: e.target.value })
                  }
                />
              </div>

              {/* คำถามที่ 3 */}
              <div className="mb-6">
                <label className="flex items-center gap-2 font-semibold text-slate-700 mb-2">
                  <ArrowRight size={18} className="text-orange-500" />
                  3. พรุ่งนี้ฉันต้องทำอะไรต่อ? (Plan for tomorrow)
                </label>
                <textarea
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none h-28"
                  placeholder="เช่น ขอสิทธิ์เข้า GitHub, ถามพี่เลี้ยงเรื่อง API Endpoint..."
                  value={formData.nextSteps}
                  onChange={(e) =>
                    setFormData({ ...formData, nextSteps: e.target.value })
                  }
                />
              </div>

              <button
                onClick={handleSave}
                disabled={
                  !formData.done && !formData.learned && !formData.nextSteps
                }
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Save size={20} />
                บันทึกข้อมูล
              </button>
            </div>
          </div>

          {/* ส่วนที่ 2: ประวัติย้อนหลัง (ขวา) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-full">
              <h2 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                <History className="text-indigo-500" size={24} />
                ประวัติการบันทึก (History)
              </h2>

              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <BookOpen size={48} className="mb-4 opacity-50" />
                  <p>ยังไม่มีบันทึก เริ่มเขียนบันทึกแรกของคุณเลย!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-5 border border-gray-100 rounded-2xl bg-slate-50 hover:shadow-md transition-shadow relative group"
                    >
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="ลบบันทึกนี้"
                      >
                        <Trash2 size={18} />
                      </button>
                      <div className="font-semibold text-sm text-blue-600 mb-3 border-b border-gray-200 pb-2 inline-block">
                        {log.date}
                      </div>

                      <div className="space-y-4 mt-2">
                        {log.done && (
                          <div>
                            <span className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1 block">
                              What I Did
                            </span>
                            <p className="text-slate-700 whitespace-pre-wrap text-sm">
                              {log.done}
                            </p>
                          </div>
                        )}
                        {log.learned && (
                          <div>
                            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">
                              What I Learned
                            </span>
                            <p className="text-slate-700 whitespace-pre-wrap text-sm">
                              {log.learned}
                            </p>
                          </div>
                        )}
                        {log.nextSteps && (
                          <div>
                            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1 block">
                              Plan for Tomorrow
                            </span>
                            <p className="text-slate-700 whitespace-pre-wrap text-sm">
                              {log.nextSteps}
                            </p>
                          </div>
                        )}
                      </div>
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
