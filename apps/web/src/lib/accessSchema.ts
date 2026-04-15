import { z } from "zod";

const AccessBlockSchema = z.object({
	id: z.string(),
	title: z.string(),
	startDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
	endDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
	type: z.literal("access"),
	notes: z.string().optional(),
	includeSundays: z.boolean().optional(),
	entryWindows: z.array(z.string()).optional(),
});

const AccessConfigSchema = z.object({
	timezone: z.string(),
	rules: z.object({
		defaultWorkDays: z.array(z.number().min(0).max(6)),
		entriesPerAccessDay: z.number().positive(),
		entryWindows: z.array(z.string()),
		skipSundaysUnlessExplicit: z.boolean(),
	}),
	blocks: z.array(AccessBlockSchema),
});

export type AccessConfig = z.infer<typeof AccessConfigSchema>;
export type AccessBlock = z.infer<typeof AccessBlockSchema>;

export function validateAccessConfig(config: unknown): {
	success: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	try {
		const result = AccessConfigSchema.safeParse(config);

		if (!result.success) {
			// Zod v4 uses result.error.issues
			const issues = result.error.issues ?? [];
			for (const issue of issues) {
				errors.push(`${issue.path.join(".")}: ${issue.message}`);
			}
		}

		// Additional validation: startDate <= endDate
		if (
			config &&
			typeof config === "object" &&
			"blocks" in config &&
			Array.isArray((config as { blocks: unknown[] }).blocks)
		) {
			(
				config as {
					blocks: Array<{ startDate?: string; endDate?: string; id?: string }>;
				}
			).blocks.forEach((block, index) => {
				if (block.startDate && block.endDate) {
					const start = new Date(block.startDate);
					const end = new Date(block.endDate);
					if (start > end) {
						errors.push(
							`Block ${index + 1} (${block.id}): startDate must be before or equal to endDate`,
						);
					}
				}
			});
		}

		return {
			success: errors.length === 0,
			errors,
		};
	} catch (e) {
		errors.push(
			`Validation failed: ${e instanceof Error ? e.message : String(e)}`,
		);
		return { success: false, errors };
	}
}
