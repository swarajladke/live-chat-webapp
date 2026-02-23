import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const getOrCreate = mutation({
    args: { otherUserId: v.id("users") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!me) return null;
        if (me._id === args.otherUserId) throw new Error("Cannot chat with yourself");

        // find existing
        const existingConvos = await ctx.db
            .query("conversations")
            .filter((q) => q.eq(q.field("isGroup"), false))
            .collect();

        for (const conv of existingConvos) {
            if (
                conv.memberIds.includes(me._id) &&
                conv.memberIds.includes(args.otherUserId)
            ) {
                return conv._id;
            }
        }

        // not found, create
        const newConvoId = await ctx.db.insert("conversations", {
            isGroup: false,
            memberIds: [me._id, args.otherUserId],
            updatedAt: Date.now(),
        });

        return newConvoId;
    },
});

export const createGroup = mutation({
    args: {
        memberIds: v.array(v.id("users")),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!me) throw new Error("User not found");

        // Ensure current user is in members
        const allMemberIds = Array.from(new Set([...args.memberIds, me._id]));

        const newGroupId = await ctx.db.insert("conversations", {
            isGroup: true,
            name: args.name,
            memberIds: allMemberIds,
            updatedAt: Date.now(),
        });

        return newGroupId;
    },
});

export const list = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!me) return [];

        const sorted = await ctx.db
            .query("conversations")
            .withIndex("by_updatedAt")
            .order("desc")
            .collect();

        const myConvos = sorted.filter((c) => c.memberIds.includes(me._id));

        return Promise.all(
            myConvos.map(async (c) => {
                const otherUserId = c.memberIds.find((id) => id !== me._id);
                const otherUser = otherUserId ? await ctx.db.get(otherUserId) : null;

                let lastMessage = null;
                if (c.lastMessageId) {
                    lastMessage = await ctx.db.get(c.lastMessageId);
                }

                const receipt = await ctx.db
                    .query("readReceipts")
                    .withIndex("by_conversationId_userId", (q) =>
                        q.eq("conversationId", c._id).eq("userId", me._id)
                    )
                    .first();

                const messages = await ctx.db
                    .query("messages")
                    .withIndex("by_conversationId", q => q.eq("conversationId", c._id))
                    .collect();

                let unreadCount = 0;
                if (receipt && receipt.lastReadMessageId) {
                    const lastReadIdx = messages.findIndex(m => m._id === receipt.lastReadMessageId);
                    if (lastReadIdx !== -1) {
                        unreadCount = messages.slice(lastReadIdx + 1).filter(m => m.senderId !== me._id).length;
                    } else {
                        unreadCount = messages.filter(m => m.senderId !== me._id).length;
                    }
                } else {
                    unreadCount = messages.filter(m => m.senderId !== me._id).length;
                }

                return {
                    ...c,
                    otherUser: c.isGroup ? null : otherUser,
                    name: c.isGroup ? c.name : otherUser?.name,
                    avatar: c.isGroup ? null : otherUser?.avatar,
                    lastMessage,
                    unreadCount
                };
            })
        );
    }
});

export const getConversation = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!me) return null;

        const conv = await ctx.db.get(args.conversationId);
        if (!conv || !conv.memberIds.includes(me._id)) return null;

        if (conv.isGroup) {
            return {
                ...conv,
                name: conv.name,
                memberCount: conv.memberIds.length,
            };
        }

        const otherUserId = conv.memberIds.find((id) => id !== me._id);
        const otherUser = otherUserId ? await ctx.db.get(otherUserId) : null;

        return {
            ...conv,
            otherUser,
            name: otherUser?.name
        };
    }
});
