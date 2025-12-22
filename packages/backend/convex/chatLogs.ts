import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const log = mutation({
	args: {
		sessionId: v.string(),
		userMessage: v.string(),
		assistantResponse: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("chatLogs", {
			sessionId: args.sessionId,
			userMessage: args.userMessage,
			assistantResponse: args.assistantResponse,
			timestamp: Date.now(),
		});
	},
});

export const getBySession = query({
	args: {
		sessionId: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("chatLogs")
			.withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
			.order("asc")
			.collect();
	},
});

export const getRecent = query({
	args: {
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const limit = args.limit ?? 50;
		return await ctx.db.query("chatLogs").order("desc").take(limit);
	},
});
