import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	/**
	 * Server-side environment variables schema.
	 * These are only available on the server.
	 */
	server: {
		ANTHROPIC_API_KEY: z.string().min(1).optional(),
		ANTHROPIC_MODEL: z.string().min(1).default("claude-sonnet-4-6"),
	},

	/**
	 * Client-side environment variables schema.
	 * These are exposed to the client and must be prefixed with NEXT_PUBLIC_.
	 */
	client: {
		NEXT_PUBLIC_CONVEX_URL: z
			.string()
			.url("NEXT_PUBLIC_CONVEX_URL must be a valid URL"),
		NEXT_PUBLIC_CONVEX_SITE_URL: z
			.string()
			.url("NEXT_PUBLIC_CONVEX_SITE_URL must be a valid URL"),
	},

	/**
	 * Runtime environment variables.
	 * These are used to destructure the environment variables at runtime.
	 */
	runtimeEnv: {
		ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
		ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
		NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
		NEXT_PUBLIC_CONVEX_SITE_URL: process.env.NEXT_PUBLIC_CONVEX_SITE_URL,
	},

	/**
	 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
	 * This is especially useful for Docker builds.
	 */
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,

	/**
	 * Makes it so that empty strings are treated as undefined.
	 * `SOME_VAR: z.string()` and `SOME_VAR=''` will throw an error.
	 */
	emptyStringAsUndefined: true,
});
