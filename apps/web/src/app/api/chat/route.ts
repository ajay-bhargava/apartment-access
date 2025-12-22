import { api } from "@apartment-access/backend/convex/_generated/api";
import { createOpenAI } from "@ai-sdk/openai";
import { type CoreMessage, streamText } from "ai";
import { ConvexHttpClient } from "convex/browser";
import { format } from "date-fns";
import { env } from "@/env";

const openai = createOpenAI({
	apiKey: env.OPENAI_API_KEY,
});

interface UIMessage {
	id: string;
	role: "user" | "assistant";
	parts?: Array<{ type: string; text?: string }>;
	content?: string;
}

function convertUIToModelMessages(messages: UIMessage[]): CoreMessage[] {
	return messages.map((msg) => {
		let content: string;
		if (typeof msg.content === "string") {
			content = msg.content;
		} else if (msg.parts && Array.isArray(msg.parts)) {
			content = msg.parts
				.filter(
					(p): p is { type: string; text: string } =>
						p.type === "text" &&
						typeof p.text === "string" &&
						p.text.length > 0,
				)
				.map((p) => p.text)
				.join("");
		} else {
			content = "";
		}
		return {
			role: msg.role,
			content,
		};
	});
}

interface AccessBlock {
	id: string;
	title: string;
	startDate: string;
	endDate: string;
	type: "access";
	notes?: string;
	includeSundays?: boolean;
}

interface AccessConfig {
	timezone: string;
	rules: {
		defaultWorkDays: number[];
		entriesPerAccessDay: number;
		entryWindows: string[];
		skipSundaysUnlessExplicit: boolean;
	};
	blocks: AccessBlock[];
}

function buildSystemPrompt(config: AccessConfig): string {
	const today = format(new Date(), "yyyy-MM-dd");
	const todayFormatted = format(new Date(), "EEEE, MMMM d, yyyy");

	const blocksInfo = config.blocks
		.map(
			(block) =>
				`- ${block.title}: ${block.startDate} to ${block.endDate}${block.notes ? ` (${block.notes})` : ""}`,
		)
		.join("\n");

	return `You are a helpful assistant that answers questions about apartment access schedules.

Today's date: ${todayFormatted} (${today})
Timezone: ${config.timezone}

Access Rules:
- Work days: ${config.rules.defaultWorkDays.map((d) => ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d]).join(", ")}
- Entries per access day: ${config.rules.entriesPerAccessDay}
- Entry windows: ${config.rules.entryWindows.join(", ")}
- Skip Sundays unless explicitly included: ${config.rules.skipSundaysUnlessExplicit}

Access Blocks:
${blocksInfo}

When answering questions:
1. Check if the requested date falls within any access block AND is a work day
2. Sundays (day 0) are skipped unless explicitly included in a block
3. Be helpful and provide context about which block a date belongs to
4. If asked about "today", use the current date provided above
5. If asked about the "next" access day, find the soonest work day within an access block from today
6. Keep responses concise and friendly

Examples of questions you might receive:
- "Do workers need access today?"
- "Do workers need access on January 10, 2026?"
- "When is the next access day?"
- "How many times can workers enter per day?"
- "What are the access windows?"`;
}

export async function POST(req: Request) {
	const { messages, config, sessionId } = await req.json();

	if (!config) {
		return new Response("Missing config", { status: 400 });
	}

	const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
	if (!convexUrl) {
		return new Response("Missing NEXT_PUBLIC_CONVEX_URL", { status: 500 });
	}
	const convex = new ConvexHttpClient(convexUrl);

	const systemPrompt = buildSystemPrompt(config);
	const modelMessages = convertUIToModelMessages(messages);

	// Get the last user message for logging
	const lastUserMessage = modelMessages.filter((m) => m.role === "user").pop();
	const userMessageText = (lastUserMessage?.content as string) || "";

	const result = await streamText({
		model: openai("gpt-4o-mini"),
		system: systemPrompt,
		messages: modelMessages,
		onFinish: async ({ text }) => {
			// Log to Convex after completion
			if (sessionId && userMessageText) {
				try {
					await convex.mutation(api.chatLogs.log, {
						sessionId,
						userMessage: userMessageText,
						assistantResponse: text,
					});
				} catch (error) {
					console.error("Failed to log chat:", error);
				}
			}
		},
	});

	return result.toTextStreamResponse();
}
