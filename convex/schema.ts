import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        clerkId: v.string(),
        name: v.string(),
        email: v.string(),
        avatar: v.string(),
        isOnline: v.boolean(),
        lastSeen: v.number(),
    }).index("by_clerkId", ["clerkId"]),

    conversations: defineTable({
        isGroup: v.boolean(),
        name: v.optional(v.string()),
        memberIds: v.array(v.id("users")),
        lastMessageId: v.optional(v.id("messages")),
        updatedAt: v.number(),
    }).index("by_updatedAt", ["updatedAt"]),

    messages: defineTable({
        conversationId: v.id("conversations"),
        senderId: v.id("users"),
        content: v.string(),
        format: v.optional(v.union(v.literal("text"), v.literal("image"), v.literal("file"))),
        fileId: v.optional(v.string()), // This can be a Convex storageId
        isDeleted: v.boolean(),
    })
        .index("by_conversationId", ["conversationId"])
        .index("by_senderId", ["senderId"]),

    readReceipts: defineTable({
        conversationId: v.id("conversations"),
        userId: v.id("users"),
        lastReadMessageId: v.optional(v.id("messages")),
    })
        .index("by_conversationId_userId", ["conversationId", "userId"])
        .index("by_userId", ["userId"]),

    reactions: defineTable({
        messageId: v.id("messages"),
        userId: v.id("users"),
        emoji: v.string(),
    })
        .index("by_messageId", ["messageId"])
        .index("by_userId", ["userId"]),

    typingIndicators: defineTable({
        conversationId: v.id("conversations"),
        userId: v.id("users"),
        updatedAt: v.number(),
    }).index("by_conversationId", ["conversationId"]),
});
