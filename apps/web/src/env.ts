import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	/**
	 * Server-side environment variables schema.
	 * These are only available on the server.
	 */
	server: {
		OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
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
		OPENAI_API_KEY: process.env.OPENAI_API_KEY,
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
