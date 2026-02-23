"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatTimestamp } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Users, Check, X, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar({
    selectedConversationId,
    onSelectConversationAction,
}: {
    selectedConversationId: string | null;
    onSelectConversationAction: (id: string) => void;
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [groupName, setGroupName] = useState("");

    const conversations = useQuery(api.conversations.list as any);
    const users = useQuery(api.users.getAllExceptMe as any);
    const getOrCreate = useMutation(api.conversations.getOrCreate as any);
    const createGroup = useMutation(api.conversations.createGroup as any);

    const filteredUsers = users?.filter((u: any) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const startChat = async (userId: string) => {
        if (isCreatingGroup) {
            setSelectedUsers(prev =>
                prev.includes(userId)
                    ? prev.filter(id => id !== userId)
                    : [...prev, userId]
            );
            return;
        }
        try {
            const convId = await getOrCreate({ otherUserId: userId });
            onSelectConversationAction(convId);
            setSearchQuery("");
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedUsers.length === 0) return;
        try {
            const convId = await createGroup({
                memberIds: selectedUsers,
                name: groupName
            });
            onSelectConversationAction(convId);
            setIsCreatingGroup(false);
            setSelectedUsers([]);
            setGroupName("");
            setSearchQuery("");
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black/40 backdrop-blur-md overflow-hidden">
            {/* Header & Search Area */}
            <div className="p-6 space-y-6 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase">
                            Messages
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Network Active</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsCreatingGroup(!isCreatingGroup)}
                            className={`p-2 rounded-xl border transition-all ${isCreatingGroup ? "bg-indigo-500 text-white border-indigo-400" : "bg-neutral-900 border-neutral-800 text-slate-400 hover:text-white"}`}
                        >
                            {isCreatingGroup ? <X className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                        </motion.button>
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-[2px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl shadow-indigo-500/20 active:shadow-none transition-shadow"
                        >
                            <div className="bg-black rounded-[14px] p-1 flex items-center justify-center">
                                <UserButton
                                    appearance={{
                                        elements: {
                                            userButtonAvatarBox: "h-10 w-10 rounded-xl",
                                            userButtonTrigger: "rounded-xl focus:shadow-none focus:outline-none"
                                        }
                                    }}
                                />
                            </div>
                        </motion.div>
                    </div>
                </div>

                <div className="space-y-4">
                    <AnimatePresence>
                        {isCreatingGroup && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-3 overflow-hidden"
                            >
                                <div className="relative group">
                                    <Input
                                        placeholder="Group Name..."
                                        className="h-11 bg-indigo-500/5 border-indigo-500/20 focus-visible:ring-indigo-500 rounded-xl text-white placeholder:text-slate-500"
                                        value={groupName}
                                        onChange={e => setGroupName(e.target.value)}
                                    />
                                    {selectedUsers.length > 0 && groupName.trim() && (
                                        <motion.button
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            onClick={handleCreateGroup}
                                            className="absolute right-2 top-2 h-7 w-7 bg-indigo-500 text-white rounded-lg flex items-center justify-center shadow-lg"
                                        >
                                            <ArrowRight className="h-4 w-4" />
                                        </motion.button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 px-1">
                                    <Badge variant="secondary" className="bg-neutral-900 text-indigo-400 border-neutral-800">
                                        {selectedUsers.length} Selected
                                    </Badge>
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Pick members below</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="relative group">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <Input
                            placeholder={isCreatingGroup ? "Search members..." : "Find someone to chat..."}
                            className="pl-10 h-11 bg-neutral-900/50 border-neutral-800 focus-visible:ring-indigo-500 rounded-xl text-white placeholder:text-slate-500"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* List Area */}
            <div className="flex-1 overflow-y-auto px-3 pb-4 custom-scrollbar">
                <AnimatePresence mode="wait">
                    {searchQuery ? (
                        <motion.div
                            key="search"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-1"
                        >
                            <h3 className="px-3 py-2 text-xs font-bold text-indigo-500 uppercase tracking-widest">Search Results</h3>
                            {!filteredUsers ? (
                                <div className="p-3 space-y-3">
                                    <Skeleton className="h-14 w-full rounded-xl" />
                                    <Skeleton className="h-14 w-full rounded-xl" />
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="p-8 text-center text-sm text-slate-500">
                                    No users found matching "{searchQuery}"
                                </div>
                            ) : (
                                filteredUsers.map((user: any) => (
                                    <motion.button
                                        layout
                                        key={user._id}
                                        onClick={() => startChat(user._id)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full text-left p-3 flex items-center gap-4 rounded-2xl hover:bg-neutral-900 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group"
                                    >
                                        <div className="relative">
                                            <Avatar className={`h-12 w-12 ring-2 transition-all ${isCreatingGroup && selectedUsers.includes(user._id) ? "ring-indigo-500 scale-110" : "ring-transparent group-hover:ring-indigo-500/30"}`}>
                                                <AvatarImage src={user.avatar} className="object-cover" />
                                                <AvatarFallback className="bg-neutral-900 text-slate-400">{user.name[0]}</AvatarFallback>
                                            </Avatar>
                                            {isCreatingGroup && selectedUsers.includes(user._id) && (
                                                <div className="absolute -top-1 -right-1 bg-indigo-500 text-white rounded-full p-0.5 border-2 border-black">
                                                    <Check className="h-2 w-2" />
                                                </div>
                                            )}
                                            {user.isOnline && !isCreatingGroup && (
                                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full shadow-lg"></span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-100 truncate group-hover:text-indigo-400 transition-colors uppercase tracking-tight text-sm">{user.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                {user.isOnline ? (
                                                    <span className="text-emerald-500 flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        Active Now
                                                    </span>
                                                ) : "Recently active"}
                                            </p>
                                        </div>
                                    </motion.button>
                                ))
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="conversations"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-2"
                        >
                            {!conversations ? (
                                <div className="p-3 space-y-4">
                                    <Skeleton className="h-20 w-full rounded-2xl" />
                                    <Skeleton className="h-20 w-full rounded-2xl" />
                                    <Skeleton className="h-20 w-full rounded-2xl" />
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="p-10 text-center flex flex-col items-center gap-4">
                                    <div className="bg-neutral-900 p-4 rounded-full">
                                        <Search className="h-8 w-8 text-indigo-500 opacity-50" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">No chats yet</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Search for users to start talking!</p>
                                    </div>
                                </div>
                            ) : (
                                conversations.map((conv: any) => {
                                    const isSelected = selectedConversationId === conv._id;

                                    return (
                                        <motion.button
                                            layout
                                            key={conv._id}
                                            onClick={() => onSelectConversationAction(conv._id)}
                                            whileHover={{ x: 4 }}
                                            className={`w-full text-left p-4 flex items-center gap-4 rounded-2xl transition-all relative group ${isSelected
                                                ? "bg-neutral-900 shadow-xl shadow-indigo-500/10"
                                                : "hover:bg-neutral-900/40"
                                                }`}
                                        >
                                            {isSelected && (
                                                <motion.div
                                                    layoutId="active-pill"
                                                    className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-indigo-500 rounded-r-full"
                                                />
                                            )}
                                            <div className="relative">
                                                <Avatar className={`h-14 w-14 transition-all duration-300 ${isSelected ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-black scale-105" : "group-hover:ring-2 group-hover:ring-neutral-800"}`}>
                                                    {conv.isGroup ? (
                                                        <AvatarFallback className="bg-indigo-500/20 text-indigo-400 font-bold text-lg">
                                                            <Users className="h-6 w-6" />
                                                        </AvatarFallback>
                                                    ) : (
                                                        <>
                                                            <AvatarImage src={conv.avatar} className="object-cover" />
                                                            <AvatarFallback className="bg-neutral-900 text-indigo-400 font-bold text-lg">{conv.name ? conv.name[0]?.toUpperCase() : "?"}</AvatarFallback>
                                                        </>
                                                    )}
                                                </Avatar>
                                                {conv.otherUser?.isOnline && (
                                                    <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-black rounded-full shadow-lg"></span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className={`font-bold uppercase tracking-tight text-sm ${isSelected ? "text-indigo-400" : "text-white"}`}>
                                                        {conv.name}
                                                    </p>
                                                    {conv.updatedAt > 0 && (
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                            {formatTimestamp(conv.updatedAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center gap-2">
                                                    <p className={`text-sm truncate leading-tight ${conv.unreadCount > 0 ? "font-bold text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}>
                                                        {conv.lastMessage?.content || "No messages"}
                                                    </p>
                                                    {conv.unreadCount > 0 && (
                                                        <Badge className="bg-indigo-500 hover:bg-indigo-600 text-white flex-shrink-0 rounded-full px-1.5 min-w-5 h-5 flex items-center justify-center text-[10px] font-bold animate-pulse">
                                                            {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.button>
                                    );
                                })
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

