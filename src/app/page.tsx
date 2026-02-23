"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import ChatApp from "@/components/ChatApp";

export default function Home() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <main className="flex h-screen items-center justify-center bg-[#020617]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-500/10 border-t-indigo-500" />
            <div className="absolute inset-0 h-16 w-16 animate-pulse rounded-full bg-indigo-500/10 blur-xl" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-indigo-500 font-bold uppercase tracking-[0.3em] text-xs">Initializing</p>
            <p className="text-slate-500 text-sm italic">Securing your connection...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="relative flex h-screen items-center justify-center bg-black overflow-hidden">
        {/* Animated Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600 rounded-full blur-[150px] opacity-20 animate-blob" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600 rounded-full blur-[150px] opacity-20 animate-blob" style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative z-10 w-full max-w-md px-6">
          <div className="bg-slate-900/40 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl shadow-indigo-500/10 text-center space-y-8">
            <div className="mx-auto bg-gradient-to-tr from-indigo-500 to-purple-500 p-5 rounded-3xl w-fit shadow-xl shadow-indigo-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">
                Live<span className="text-indigo-500 italic">Chat</span>
              </h1>
              <p className="text-slate-400 text-sm font-medium tracking-wide">
                Experience the next generation of real-time 1:1 messaging.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <Link
                href="/sign-in"
                className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/30 active:scale-95 uppercase tracking-widest text-xs inline-block"
              >
                Get Started
              </Link>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Secure • Encrypted • Instant
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen w-full overflow-hidden bg-black p-2 md:p-4">
      <ChatApp />
    </main>
  );
}
