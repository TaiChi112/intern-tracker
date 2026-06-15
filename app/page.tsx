"use client";

import React, { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { getLogs, createLog, updateLogStatus, deleteLog } from "./actions";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  BookOpen,
  ArrowRight,
  Save,
  Clock,
  Trash2,
  User,
  MessageSquare,
  Check,
  X,
  Download,
  FileText,
  LogOut,
} from "lucide-react";

import { Prisma } from "@prisma/client";

type PrismaUser = Prisma.UserGetPayload<{}>;

type LogWithUser = {
  id: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  done: string;
  learned: string;
  nextSteps: string;
  status: string;
  supervisorComment: string | null;
  userId: string;
  user?: PrismaUser;
};

export default function App() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<LogWithUser[]>([]);
  const [formData, setFormData] = useState({
    done: "",
    learned: "",
    nextSteps: "",
  });
  const [reviewData, setReviewData] = useState<{ [key: string]: string }>({});
  const [isFetching, setIsFetching] = useState(false);

  const isMentor = session?.user?.role === "mentor";
  const userRole = isMentor ? "mentor" : "intern";

  const fetchLogs = async () => {
    try {
      const data = await getLogs();
      setLogs(data as LogWithUser[]);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "unassigned") {
      router.push("/onboarding");
    } else if (status === "authenticated") {
      // Async fetch to prevent synchronous setState warning
      const load = async () => {
        await Promise.resolve();
        setIsFetching(true);
        await fetchLogs();
        setIsFetching(false);
      };
      load();
    }
  }, [status, session, router]);

  const handleSaveLog = async () => {
    if (!formData.done && !formData.learned && !formData.nextSteps) return;

    try {
      await createLog({
        done: formData.done,
        learned: formData.learned,
        nextSteps: formData.nextSteps,
      });
      setFormData({ done: "", learned: "", nextSteps: "" });
      await fetchLogs();
    } catch (error) {
      console.error("Failed to save log:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("คุณต้องการลบบันทึกนี้ใช่หรือไม่?")) return;
    try {
      await deleteLog(id);
      await fetchLogs();
    } catch (error) {
      console.error("Failed to delete log:", error);
    }
  };

  const handleReview = async (id: string, logStatus: string) => {
    try {
      const comment = reviewData[id] || "";
      await updateLogStatus(id, logStatus, comment);

      const newReviewData = { ...reviewData };
      delete newReviewData[id];
      setReviewData(newReviewData);

      await fetchLogs();
    } catch (error) {
      console.error("Failed to review log:", error);
    }
  };

  const handleExport = () => {
    let reportText = "รายงานการฝึกงานประจำวัน\n=========================\n\n";
    logs.forEach((log) => {
      const formattedDate = new Date(log.createdAt).toLocaleDateString(
        "th-TH",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        },
      );
      reportText += `วันที่สร้าง: ${formattedDate}\n`;
      reportText += `สถานะ: ${log.status === "approved" ? "✅ อนุมัติแล้ว" : log.status === "rejected" ? "❌ ต้องแก้ไข" : "⏳ รอตรวจ"}\n`;
      if (isMentor && log.user) {
        reportText += `พนักงาน: ${log.user.name || log.user.email}\n`;
      }
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

  const getStatusBadge = (logStatus: string) => {
    switch (logStatus) {
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

  if (
    status === "loading" ||
    (status === "authenticated" && session?.user?.role === "unassigned")
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Clock className="animate-spin text-blue-500" size={40} />
          <p className="text-gray-500 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-50 p-4 rounded-full">
              <Clock className="text-blue-600" size={48} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Internship Tracker
          </h1>
          <p className="text-gray-500 mb-8">บันทึกและติดตามผลการฝึกงานของคุณ</p>
          <button
            onClick={() => signIn("google")}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-bold py-3 px-4 rounded-xl transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path
                  fill="#4285F4"
                  d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                />
                <path
                  fill="#34A853"
                  d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                />
                <path
                  fill="#FBBC05"
                  d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                />
                <path
                  fill="#EA4335"
                  d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                />
              </g>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Clock className="text-blue-600" size={32} />
              Internship Tracker
            </h1>
            <p className="text-slate-500 mt-2 flex items-center gap-2">
              <User size={16} /> {session?.user?.name || session?.user?.email}
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold ${isMentor ? "bg-indigo-100 text-indigo-700" : "bg-blue-100 text-blue-700"}`}
              >
                {isMentor ? "Mentor" : "Intern"}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl shadow-sm hover:bg-gray-50 transition-colors text-sm font-semibold"
            >
              <Download size={18} />
              Export Report
            </button>

            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 bg-white border border-gray-200 text-red-600 px-4 py-2 rounded-xl shadow-sm hover:bg-red-50 transition-colors text-sm font-semibold"
            >
              <LogOut size={18} />
              Log Out
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {!isMentor && (
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
                    (!formData.done &&
                      !formData.learned &&
                      !formData.nextSteps) ||
                    isFetching
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Save size={20} /> ส่งบันทึกให้พี่เลี้ยง
                </button>
              </div>
            </div>
          )}

          <div
            className={
              userRole === "intern" ? "lg:col-span-7" : "lg:col-span-12"
            }
          >
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-full">
              <h2 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                <FileText className="text-indigo-500" size={24} />
                {userRole === "intern"
                  ? "ประวัติของฉัน (My Logs)"
                  : "รายการบันทึกรอการตรวจสอบ (Review Dashboard)"}
              </h2>

              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  {isFetching ? (
                    <Clock
                      className="animate-spin mb-4 text-blue-400"
                      size={48}
                    />
                  ) : (
                    <>
                      <BookOpen size={48} className="mb-4 opacity-50" />
                      <p>ยังไม่มีข้อมูลบันทึกในระบบ</p>
                    </>
                  )}
                </div>
              ) : (
                <div
                  className={
                    userRole === "mentor"
                      ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                      : "space-y-6"
                  }
                >
                  {logs.map((log) => {
                    const formattedDate = new Date(
                      log.createdAt,
                    ).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={log.id}
                        className="p-5 border border-gray-100 rounded-2xl bg-slate-50 hover:shadow-md transition-shadow relative"
                      >
                        <div className="flex justify-between items-start mb-4 border-b border-gray-200 pb-3">
                          <div>
                            <div className="font-semibold text-sm text-gray-600">
                              {formattedDate}
                            </div>
                            {isMentor && log.user && (
                              <div className="text-xs font-medium text-indigo-600 mt-1">
                                👤 {log.user.name || log.user.email}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(log.status)}
                            {userRole === "intern" &&
                              log.status === "pending" && (
                                <button
                                  onClick={() => handleDelete(log.id)}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          {log.done && (
                            <div>
                              <span className="text-xs font-bold text-gray-500 uppercase">
                                What I Did
                              </span>
                              <p className="text-slate-800 text-sm mt-1 whitespace-pre-line">
                                {log.done}
                              </p>
                            </div>
                          )}
                          {log.learned && (
                            <div>
                              <span className="text-xs font-bold text-gray-500 uppercase">
                                What I Learned
                              </span>
                              <p className="text-slate-800 text-sm mt-1 whitespace-pre-line">
                                {log.learned}
                              </p>
                            </div>
                          )}
                          {log.nextSteps && (
                            <div>
                              <span className="text-xs font-bold text-gray-500 uppercase">
                                Next Steps
                              </span>
                              <p className="text-slate-800 text-sm mt-1 whitespace-pre-line">
                                {log.nextSteps}
                              </p>
                            </div>
                          )}
                        </div>

                        {userRole === "mentor" && log.status === "pending" && (
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

                        {log.supervisorComment && (
                          <div
                            className={`mt-4 p-3 rounded-lg text-sm border ${log.status === "approved" ? "bg-green-50 border-green-100 text-green-800" : "bg-red-50 border-red-100 text-red-800"}`}
                          >
                            <strong className="flex items-center gap-1 mb-1">
                              <MessageSquare size={14} /> ความเห็นจากพี่เลี้ยง:
                            </strong>
                            <p className="whitespace-pre-line">
                              {log.supervisorComment}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
