import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	accessConfig: defineTable({
		timezone: v.string(),
		rules: v.object({
			defaultWorkDays: v.array(v.number()),
			entriesPerAccessDay: v.number(),
			entryWindows: v.array(v.string()),
			skipSundaysUnlessExplicit: v.boolean(),
		}),
		blocks: v.array(
			v.object({
				id: v.string(),
				title: v.string(),
				startDate: v.string(),
				endDate: v.string(),
				type: v.literal("access"),
				notes: v.optional(v.string()),
				includeSundays: v.optional(v.boolean()),
				entryWindows: v.optional(v.array(v.string())),
			}),
		),
	}),
	chatLogs: defineTable({
		sessionId: v.string(),
		userMessage: v.string(),
		assistantResponse: v.string(),
		timestamp: v.number(),
	}).index("by_session", ["sessionId"]),
});
