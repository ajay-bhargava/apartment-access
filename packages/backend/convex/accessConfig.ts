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
					id: "drop-n2-block-1",
					title: "Drop N2 — Mobilization & Scaffold Move (Block 1)",
					startDate: "2026-01-19",
					endDate: "2026-01-23",
					type: "access" as const,
					notes: "Access every day for 5 straight working days (crew working on MLK Day). Crew may enter/exit morning, midday, and end-of-day.",
				},
				{
					id: "drop-n5-block-3",
					title: "Drop N5 — Scaffold Mobilization & Platform Access (Block 3)",
					startDate: "2026-02-02",
					endDate: "2026-02-20",
					type: "access" as const,
					notes: "Access every working day for 17 straight working days, until facade work is complete. Crew may enter/exit morning, midday, and end-of-day. Overlaps with Drop N2 demobilization on Feb 9–11.",
				},
				{
					id: "drop-n2-block-2",
					title: "Drop N2 — Scaffold Demobilization (Block 2)",
					startDate: "2026-02-09",
					endDate: "2026-02-11",
					type: "access" as const,
					notes: "Access every day for 3 straight working days. Crew may enter/exit morning, midday, and end-of-day. These dates overlap with Drop N5.",
				},
				{
					id: "drop-n6-block-4",
					title: "Drop N6 — Scaffold Mobilization & Platform Access (Block 4)",
					startDate: "2026-02-20",
					endDate: "2026-03-11",
					type: "access" as const,
					notes: "Access every working day for 17 straight working days, until facade work is complete. Crew may enter/exit morning, midday, and end-of-day. Continues from Drop N5 end date with no gap (Feb 20 overlap).",
				},
			],
		};

		return await ctx.db.insert("accessConfig", defaultConfig);
	},
});
