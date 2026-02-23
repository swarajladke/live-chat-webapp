"use client";

import { useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import Sidebar from "@/components/sidebar/Sidebar";
import ChatArea from "@/components/chat/ChatArea";

export default function ChatApp() {
    const { user } = useUser();
    const syncUser = useMutation(api.users.syncUser as any);
    const setOffline = useMutation(api.users.setOffline as any);

    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

    const { isAuthenticated } = useConvexAuth();

    useEffect(() => {
        if (isAuthenticated && user) {
            syncUser({
                clerkId: user.id,
                name: user.fullName ?? user.username ?? "Anonymous",
                email: user.primaryEmailAddress?.emailAddress ?? "",
                avatar: user.imageUrl,
            });
        }
    }, [user, isAuthenticated, syncUser]);

    useEffect(() => {
        const handleBeforeUnload = () => {
            setOffline();
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [setOffline]);

    return (
        <div className="flex h-full w-full overflow-hidden bg-slate-50 dark:bg-black relative">
            {/* Background Decorative Blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20 dark:opacity-30">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px] animate-blob" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500 rounded-full blur-[120px] animate-blob" style={{ animationDelay: "2s" }} />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-500 rounded-full blur-[100px] animate-blob" style={{ animationDelay: "4s" }} />
            </div>

            <div className="flex h-full w-full overflow-hidden relative z-10 p-2 md:p-4 gap-2 md:gap-4">
                {/* Sidebar - hidden on mobile if a chat is selected, otherwise visible */}
                <div
                    className={`glass rounded-2xl overflow-hidden w-full md:w-[380px] flex-shrink-0 transition-all duration-300 ease-in-out ${selectedConversationId ? "hidden md:flex" : "flex"
                        }`}
                >
                    <Sidebar
                        selectedConversationId={selectedConversationId}
                        onSelectConversationAction={setSelectedConversationId}
                    />
                </div>

                {/* Chat Area - full screen on mobile when selected, visible on desktop */}
                <div
                    className={`flex-1 glass rounded-2xl overflow-hidden flex flex-col transition-all duration-300 ease-in-out ${!selectedConversationId ? "hidden md:flex" : "flex"
                        }`}
                >
                    {selectedConversationId ? (
                        <ChatArea
                            conversationId={selectedConversationId}
                            onBackAction={() => setSelectedConversationId(null)}
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center flex-col gap-6 text-slate-400 bg-white/5 dark:bg-black/5 backdrop-blur-sm">
                            <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-indigo-500/10 animate-transition-in">
                                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square text-indigo-500">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 italic">Select a conversation</h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-[280px]">Pick a user from the sidebar to start a secure, real-time message.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

