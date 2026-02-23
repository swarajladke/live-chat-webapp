import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
            .collect();

        return Promise.all(
            messages.map(async (m) => {
                const sender = await ctx.db.get(m.senderId);
                const fileUrl = m.fileId ? await ctx.storage.getUrl(m.fileId) : null;

                const reactions = await ctx.db
                    .query("reactions")
                    .withIndex("by_messageId", (q) => q.eq("messageId", m._id))
                    .collect();

                return { ...m, sender, fileUrl, reactions };
            })
        );
    },
});

export const send = mutation({
    args: {
        conversationId: v.id("conversations"),
        content: v.string(),
        format: v.optional(v.union(v.literal("text"), v.literal("image"), v.literal("file"))),
        fileId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!me) throw new Error("User not found");

        const messageId = await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderId: me._id,
            content: args.content,
            format: args.format || "text",
            fileId: args.fileId,
            isDeleted: false,
        });

        await ctx.db.patch(args.conversationId, {
            lastMessageId: messageId,
            updatedAt: Date.now(),
        });

        return messageId;
    },
});

export const markRead = mutation({
    args: {
        conversationId: v.id("conversations"),
        messageId: v.id("messages"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!me) return;

        const existingId = await ctx.db
            .query("readReceipts")
            .withIndex("by_conversationId_userId", (q) =>
                q.eq("conversationId", args.conversationId).eq("userId", me._id)
            )
            .first();

        if (existingId) {
            await ctx.db.patch(existingId._id, {
                lastReadMessageId: args.messageId,
            });
        } else {
            await ctx.db.insert("readReceipts", {
                conversationId: args.conversationId,
                userId: me._id,
                lastReadMessageId: args.messageId,
            });
        }
    },
});

export const setTyping = mutation({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!me) return;

        const existing = await ctx.db
            .query("typingIndicators")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
            .filter((q) => q.eq(q.field("userId"), me._id))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, { updatedAt: Date.now() });
        } else {
            await ctx.db.insert("typingIndicators", {
                conversationId: args.conversationId,
                userId: me._id,
                updatedAt: Date.now(),
            });
        }
    },
});

export const getTyping = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!me) return [];

        const indicators = await ctx.db
            .query("typingIndicators")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
            .collect();

        // typing status clears after 3 seconds of inactivity
        const active = indicators.filter(
            (ind) => ind.userId !== me._id && Date.now() - ind.updatedAt < 3000
        );

        return Promise.all(
            active.map(async (ind) => {
                const user = await ctx.db.get(ind.userId);
                return user;
            })
        );
    },
});

export const remove = mutation({
    args: { messageId: v.id("messages") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const message = await ctx.db.get(args.messageId);
        if (!message) throw new Error("Message not found");

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!me || me._id !== message.senderId) {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.messageId, {
            content: "This message was deleted",
            isDeleted: true,
            fileId: undefined, // Clear file if deleted
        });
    },
});

export const toggleReaction = mutation({
    args: {
        messageId: v.id("messages"),
        emoji: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
        if (!me) throw new Error("User not found");

        const existing = await ctx.db
            .query("reactions")
            .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
            .filter((q) => q.and(q.eq(q.field("userId"), me._id), q.eq(q.field("emoji"), args.emoji)))
            .first();

        if (existing) {
            await ctx.db.delete(existing._id);
        } else {
            await ctx.db.insert("reactions", {
                messageId: args.messageId,
                userId: me._id,
                emoji: args.emoji,
            });
        }
    },
});
