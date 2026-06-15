"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { setRole, verifyMentorCode } from "../actions";
import { Clock } from "lucide-react";

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [showMentorInput, setShowMentorInput] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "unassigned") {
      router.push("/");
    }
  }, [session, status, router]);

  if (status === "loading" || (status === "authenticated" && session?.user?.role !== "unassigned")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Clock className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }

  const handleIntern = () => {
    setIsLoading(true);
    
    startTransition(async () => {
      try {
        await setRole("intern");
        await update();
        window.location.href = "/";
      } catch (e) {
        console.error("Error in handleIntern:", e);
      } finally {
        setIsLoading(false);
      }
    });
  };

  const handleMentor = () => {
    if (!code) {
      setError("Please enter a code");
      return;
    }
    setIsLoading(true);
    
    startTransition(async () => {
      try {
        const result = await verifyMentorCode(code);
        
        if (result && "error" in result) {
          setError(result.error as string);
        } else {
          await update();
          window.location.href = "/";
        }
      } catch (e) {
        console.error("Error in handleMentor:", e);
        setError("An error occurred");
      } finally {
        setIsLoading(false);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans text-gray-800">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-2 text-center">Welcome!</h1>
        <p className="text-gray-500 text-center mb-8">Please choose your role to continue</p>
        
        {!showMentorInput ? (
          <div className="space-y-4 mt-8">
            <button
              onClick={handleIntern}
              disabled={isLoading || isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 px-4 rounded-xl transition-colors"
            >
              {isLoading || isPending ? "Processing..." : "I am an Intern"}
            </button>
            <button
              onClick={() => setShowMentorInput(true)}
              disabled={isLoading}
              className="w-full bg-indigo-100 hover:bg-indigo-200 disabled:bg-indigo-50 text-indigo-700 font-bold py-3 px-4 rounded-xl transition-colors"
            >
              I am a Mentor
            </button>
          </div>
        ) : (
          <div className="space-y-4 mt-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Secret Mentor Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError("");
                }}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Enter secret code..."
              />
              <p className="text-xs text-gray-400 mt-2">Tip: Default code is &quot;mentor123&quot;</p>
            </div>
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            <button
              onClick={handleMentor}
              disabled={isLoading || isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-3 px-4 rounded-xl transition-colors"
            >
              {isLoading || isPending ? "Verifying..." : "Verify Code"}
            </button>
            <button
              onClick={() => setShowMentorInput(false)}
              disabled={isLoading}
              className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium mt-2"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
