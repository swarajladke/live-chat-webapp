import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get current user from identity
 */
export const me = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
        return user;
    },
});

/**
 * Sync user from Clerk to Convex (called on login/load).
 * Also updates online status and lastSeen.
 */
export const syncUser = mutation({
    args: {
        clerkId: v.string(),
        name: v.string(),
        email: v.string(),
        avatar: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();

        const timestamp = Date.now();

        if (existingUser) {
            await ctx.db.patch(existingUser._id, {
                name: args.name,
                email: args.email,
                avatar: args.avatar,
                isOnline: true,
                lastSeen: timestamp,
            });
            return existingUser._id;
        }

        const newUserId = await ctx.db.insert("users", {
            clerkId: args.clerkId,
            name: args.name,
            email: args.email,
            avatar: args.avatar,
            isOnline: true,
            lastSeen: timestamp,
        });

        return newUserId;
    },
});

/**
 * Called periodically or on blur to set user offline
 */
export const setOffline = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (user) {
            await ctx.db.patch(user._id, {
                isOnline: false,
                lastSeen: Date.now(),
            });
        }
    },
});

/**
 * Get all users except current user
 */
export const getAllExceptMe = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const users = await ctx.db.query("users").collect();
        return users.filter((u) => u.clerkId !== identity.subject);
    },
});
