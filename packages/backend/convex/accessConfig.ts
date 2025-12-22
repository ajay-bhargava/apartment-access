import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const accessBlockValidator = v.object({
	id: v.string(),
	title: v.string(),
	startDate: v.string(),
	endDate: v.string(),
	type: v.literal("access"),
	notes: v.optional(v.string()),
	includeSundays: v.optional(v.boolean()),
});

const accessConfigValidator = v.object({
	timezone: v.string(),
	rules: v.object({
		defaultWorkDays: v.array(v.number()),
		entriesPerAccessDay: v.number(),
		entryWindows: v.array(v.string()),
		skipSundaysUnlessExplicit: v.boolean(),
	}),
	blocks: v.array(accessBlockValidator),
});

// Get the current access config (only one config exists at a time)
export const get = query({
	args: {},
	handler: async (ctx) => {
		const config = await ctx.db.query("accessConfig").first();
		return config;
	},
});

// Create or update the access config
export const upsert = mutation({
	args: {
		config: accessConfigValidator,
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (identity === null) {
			throw new Error("Not authenticated");
		}

		// Only allow the admin email to update
		if (identity.email !== "bhargava.ajay@gmail.com") {
			throw new Error("Not authorized - admin access required");
		}

		const existing = await ctx.db.query("accessConfig").first();

		if (existing) {
			await ctx.db.patch(existing._id, args.config);
			return existing._id;
		}

		return await ctx.db.insert("accessConfig", args.config);
	},
});

// Initialize with default config if none exists
export const initializeDefault = mutation({
	args: {},
	handler: async (ctx) => {
		const existing = await ctx.db.query("accessConfig").first();
		if (existing) {
			return existing._id;
		}

		const defaultConfig = {
			timezone: "America/New_York",
			rules: {
				defaultWorkDays: [1, 2, 3, 4, 5, 6],
				entriesPerAccessDay: 3,
				entryWindows: ["morning", "midday", "end-of-day"],
				skipSundaysUnlessExplicit: true,
			},
			blocks: [
				{
					id: "block-1",
					title: "Block 1 — First access period",
					startDate: "2026-01-06",
					endDate: "2026-01-10",
					type: "access" as const,
					notes: "Full crew access",
				},
				{
					id: "block-2",
					title: "Block 2 — Second access period",
					startDate: "2026-01-27",
					endDate: "2026-01-29",
					type: "access" as const,
					notes: "Full crew access",
				},
				{
					id: "block-3",
					title: "Block 3 — Continues immediately",
					startDate: "2026-01-30",
					endDate: "2026-02-01",
					type: "access" as const,
					notes: "Full crew access",
				},
				{
					id: "block-4",
					title: "Block 4 — Final long access period",
					startDate: "2026-02-07",
					endDate: "2026-03-13",
					type: "access" as const,
					notes: "Full crew access",
				},
			],
		};

		return await ctx.db.insert("accessConfig", defaultConfig);
	},
});
