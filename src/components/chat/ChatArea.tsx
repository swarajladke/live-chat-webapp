"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, Send, ArrowDown, MoreVertical, Paperclip, Smile, Image as ImageIcon, FileIcon, X, Users } from "lucide-react";
import { useState, useRef, useEffect, UIEvent } from "react";
import { formatTimestamp } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import Picker from 'emoji-picker-react';
import { Theme } from 'emoji-picker-react';

export default function ChatArea({
    conversationId,
    onBackAction,
}: {
    conversationId: string;
    onBackAction: () => void;
}) {
    const { user } = useUser();
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const conversation = useQuery(api.conversations.getConversation as any, { conversationId });
    const messages = useQuery(api.messages.list as any, { conversationId });
    const typingUsers = useQuery(api.messages.getTyping as any, { conversationId });

    const sendMessage = useMutation(api.messages.send as any);
    const markRead = useMutation(api.messages.markRead as any);
    const setTyping = useMutation(api.messages.setTyping as any);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const removeMessage = useMutation(api.messages.remove);
    const toggleReaction = useMutation(api.messages.toggleReaction);

    const meUser = useQuery(api.users.me);

    // Mark read
    useEffect(() => {
        if (messages && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            markRead({ conversationId, messageId: lastMessage._id });
        }
    }, [messages, conversationId, markRead]);

    // Handle typing indicator
    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);
        setTyping({ conversationId });
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await sendMessage({ conversationId, content: newMessage, format: "text" });
            setNewMessage("");
            setShowEmojiPicker(false);
            scrollToBottom();
        } catch (error) {
            console.error(error);
        }
    };

    const onEmojiClick = (emojiData: any) => {
        setNewMessage(prev => prev + emojiData.emoji);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // 1. Get upload URL
            const postUrl = await generateUploadUrl();

            // 2. Upload file
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json();

            // 3. Send message
            const format = file.type.startsWith("image/") ? "image" : "file";
            await sendMessage({
                conversationId,
                content: file.name,
                format,
                fileId: storageId,
            });

            scrollToBottom();
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // Smart auto-scroll logic
    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior });
        }
    };

    useEffect(() => {
        if (scrollContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

            if (isNearBottom) {
                scrollToBottom("smooth");
            } else {
                setShowScrollButton(true);
            }
        }
    }, [messages]);

    const handleScroll = (e: UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
        setShowScrollButton(!isNearBottom);
    };

    if (conversation === undefined || messages === undefined) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-xl">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" />
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Establishing Connection</p>
                </div>
            </div>
        );
    }

    if (!conversation) {
        return (
            <div className="flex-1 flex items-center justify-center text-slate-500 bg-white/50 dark:bg-black/50 backdrop-blur-xl">
                <div className="flex flex-col items-center gap-2">
                    <p className="font-bold uppercase tracking-widest text-sm text-slate-400">Secure link broken</p>
                    <p className="text-xs">Conversation could not be verified.</p>
                </div>
            </div>
        );
    }

    const otherUser = conversation.otherUser;

    return (
        <div className="flex flex-col h-full w-full bg-white/70 dark:bg-black/70 backdrop-blur-xl relative">
            {/* Header */}
            <div className="p-4 md:p-6 flex items-center justify-between border-b border-white/20 dark:border-white/5 glass-morphism z-20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBackAction}
                        className="md:hidden p-2 -ml-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <ChevronLeft className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                    </button>
                    {conversation.isGroup ? (
                        <>
                            <div className="relative">
                                <Avatar className="h-12 w-12 ring-2 ring-indigo-500/20 shadow-lg bg-black">
                                    <AvatarFallback className="bg-indigo-500/20 text-indigo-400 font-bold">
                                        <Users className="h-6 w-6" />
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight text-sm leading-none mb-1">{conversation.name}</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5 leading-none">
                                    {conversation.memberCount} Members
                                </p>
                            </div>
                        </>
                    ) : otherUser && (
                        <>
                            <div className="relative">
                                <Avatar className="h-12 w-12 ring-2 ring-indigo-500/20 shadow-lg bg-black">
                                    <AvatarImage src={otherUser.avatar} className="object-cover" />
                                    <AvatarFallback className="bg-neutral-900 text-indigo-400 font-bold">{otherUser.name[0]?.toUpperCase()}</AvatarFallback>
                                </Avatar>
                                {otherUser.isOnline && (
                                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-black rounded-full shadow-lg"></span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight text-sm leading-none mb-1">{otherUser.name}</h3>
                                <p className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1.5 leading-none">
                                    {otherUser.isOnline ? (
                                        <>
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Active Now
                                        </>
                                    ) : (
                                        <span className="text-slate-500">Offline</span>
                                    )}
                                </p>
                            </div>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:shadow-indigo-500/10 transition-all text-slate-600 dark:text-slate-300">
                        <MoreVertical className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 custom-scrollbar scroll-smooth"
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 select-none opacity-50 italic">
                        <div className="bg-white/50 dark:bg-black/50 p-6 rounded-3xl shadow-xl shadow-indigo-500/5">
                            <Avatar className="h-20 w-20">
                                {conversation.isGroup ? (
                                    <AvatarFallback className="bg-neutral-900 text-indigo-400 font-bold text-2xl">
                                        <Users className="h-10 w-10" />
                                    </AvatarFallback>
                                ) : (
                                    <>
                                        <AvatarImage src={otherUser?.avatar} className="object-cover" />
                                        <AvatarFallback className="bg-neutral-900 text-indigo-400 font-bold text-2xl">?</AvatarFallback>
                                    </>
                                )}
                            </Avatar>
                        </div>
                        <div className="text-center font-bold uppercase tracking-[0.2em] text-[10px]">
                            <p className="mb-1">Encrypted Link Ready</p>
                            <p>No messages yet.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="text-center py-6 opacity-30 select-none">
                            <div className="flex items-center justify-center gap-4 text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400">
                                <span className="h-px w-10 bg-slate-200 dark:bg-white/5" />
                                End-to-end encrypted
                                <span className="h-px w-10 bg-slate-200 dark:bg-white/5" />
                            </div>
                        </div>

                        <AnimatePresence initial={false}>
                            {messages.map((msg: any, idx: number) => {
                                const isMe = msg.sender?.clerkId === user?.id;
                                return (
                                    <motion.div
                                        key={msg._id}
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${isMe ? "ml-auto flex-row-reverse" : ""}`}
                                    >
                                        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} min-w-0`}>
                                            <div className="flex items-center gap-2 group/msg">
                                                {isMe && !msg.isDeleted && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm("Delete this message?")) {
                                                                removeMessage({ messageId: msg._id });
                                                            }
                                                        }}
                                                        className="opacity-0 group-hover/msg:opacity-100 p-1.5 text-slate-400 hover:text-red-500 transition-all"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                )}
                                                <div
                                                    className={`p-3.5 rounded-2xl shadow-xl transition-all relative group ${isMe
                                                        ? "bg-indigo-600 text-white rounded-tr-none shadow-indigo-500/20"
                                                        : "bg-neutral-900 text-slate-100 rounded-tl-none border-none shadow-slate-500/5"
                                                        } ${msg.isDeleted ? "opacity-50 !bg-transparent border border-white/10 italic text-slate-500" : ""}`}
                                                >
                                                    {conversation.isGroup && !isMe && !msg.isDeleted && (
                                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">{msg.sender?.name || "Member"}</p>
                                                    )}
                                                    {msg.isDeleted ? (
                                                        "This message was deleted"
                                                    ) : msg.format === "image" ? (
                                                        <div className="space-y-2">
                                                            <img
                                                                src={msg.fileUrl}
                                                                alt="Sent image"
                                                                className="max-h-64 rounded-xl object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                                                onClick={() => window.open(msg.fileUrl, '_blank')}
                                                            />
                                                            {msg.content && <p>{msg.content}</p>}
                                                        </div>
                                                    ) : msg.format === "file" ? (
                                                        <a
                                                            href={msg.fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-3 bg-white/10 p-3 rounded-xl hover:bg-white/20 transition-all no-underline"
                                                        >
                                                            <div className="p-2 bg-indigo-500 rounded-lg">
                                                                <FileIcon className="h-4 w-4 text-white" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold truncate text-xs">{msg.content}</p>
                                                                <p className="text-[10px] opacity-50 uppercase font-black">Open File</p>
                                                            </div>
                                                        </a>
                                                    ) : (
                                                        msg.content
                                                    )}
                                                </div>
                                            </div>

                                            {/* Reactions */}
                                            {!msg.isDeleted && (
                                                <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                                                    {["👍", "❤️", "😂", "😮", "😢"].map((emoji) => {
                                                        const reactions = msg.reactions || [];
                                                        const emojiReactions = reactions.filter((r: any) => r.emoji === emoji);
                                                        const hasReacted = emojiReactions.some((r: any) => r.userId === meUser?._id);

                                                        // Actually, it's easier to compare if we have the me._id
                                                        // I should fetch me._id in ChatArea.

                                                        return (
                                                            <button
                                                                key={emoji}
                                                                onClick={() => toggleReaction({ messageId: msg._id, emoji })}
                                                                className={`px-2 py-0.5 rounded-full text-[10px] transition-all flex items-center gap-1 ${emojiReactions.length > 0
                                                                    ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                                                                    : "bg-transparent text-slate-500 hover:bg-white/5 opacity-0 group-hover/msg:opacity-100"
                                                                    }`}
                                                            >
                                                                <span>{emoji}</span>
                                                                {emojiReactions.length > 0 && <span>{emojiReactions.length}</span>}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            <span className={`text-[10px] font-bold text-slate-400 mt-1.5 px-1 uppercase tracking-wider ${isMe ? "text-right" : "text-left"}`}>
                                                {formatTimestamp(msg._creationTime)}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}

                {typingUsers && typingUsers.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 px-1"
                    >
                        <div className="flex gap-1.5 p-3.5 bg-slate-100/50 dark:bg-black/50 rounded-2xl rounded-tl-none border border-white/20 dark:border-white/5 backdrop-blur-sm">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                        </div>
                        <span className="text-[10px] font-bold text-indigo-500/70 dark:text-indigo-400/70 uppercase tracking-widest italic">{typingUsers[0]?.name} is typing...</span>
                    </motion.div>
                )}

                <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* New Messages Button */}
            <AnimatePresence>
                {showScrollButton && (
                    <motion.button
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        onClick={() => scrollToBottom()}
                        className="absolute bottom-32 right-8 bg-indigo-600 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest z-30 hover:bg-indigo-700 transition-all border border-indigo-400/30"
                    >
                        <ArrowDown className="h-4 w-4" />
                        New Messages
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="p-4 md:p-6 bg-white/30 dark:bg-black/30 backdrop-blur-md border-t border-white/20 dark:border-white/5 glass-morphism relative">
                {/* Emoji Picker Popup */}
                <AnimatePresence>
                    {showEmojiPicker && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full right-4 mb-4 z-50 shadow-2xl rounded-2xl overflow-hidden border border-white/10"
                        >
                            <Picker
                                onEmojiClick={onEmojiClick}
                                theme={Theme.DARK}
                                lazyLoadEmojis={true}
                                skinTonesDisabled={true}
                                searchDisabled={false}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSend} className="flex gap-3 items-end max-w-5xl mx-auto w-full">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileUpload}
                        accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    />

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className={`mb-2 p-2.5 rounded-xl transition-all ${isUploading ? "animate-pulse bg-indigo-500/10" : "text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10"}`}
                    >
                        {isUploading ? (
                            <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent animate-spin rounded-full" />
                        ) : (
                            <Paperclip className="h-5 w-5" />
                        )}
                    </motion.button>

                    <div className="relative flex-1">
                        <textarea
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value);
                                setTyping({ conversationId });
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(e as any);
                                }
                            }}
                            placeholder={isUploading ? "Uploading file..." : "Type a secure message..."}
                            className="w-full bg-white dark:bg-neutral-900/50 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 rounded-2xl shadow-inner shadow-slate-500/5 pr-12 min-h-[48px] max-h-32 py-3 px-4 resize-none outline-none transition-all text-sm scrollbar-hide"
                            rows={1}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = "auto";
                                target.style.height = `${target.scrollHeight}px`;
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className={`absolute right-3 bottom-3 p-1 transition-colors ${showEmojiPicker ? "text-indigo-500" : "text-slate-400 hover:text-indigo-500"}`}
                        >
                            <Smile className="h-5 w-5" />
                        </button>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={!newMessage.trim() || isUploading}
                        className={`mb-1 p-3.5 rounded-2xl shadow-lg ring-1 transition-all ${newMessage.trim() && !isUploading
                            ? "bg-indigo-600 text-white shadow-indigo-500/30 ring-indigo-500/50"
                            : "bg-neutral-900 text-slate-600 ring-transparent cursor-not-allowed shadow-none"
                            }`}
                    >
                        <Send className="h-5 w-5" />
                    </motion.button>
                </form>
            </div>
        </div>
    );
}
