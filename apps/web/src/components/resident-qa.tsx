"use client";

import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport, type UIMessage } from "ai";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { type FormEvent, useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AccessConfig } from "@/lib/expandAccessDates";

interface ResidentQAProps {
	config: AccessConfig;
}

export function ResidentQA({ config }: ResidentQAProps) {
	const [input, setInput] = useState("");
	const chatId = useId();
	const sessionId = useMemo(
		() => `session-${Date.now()}-${Math.random().toString(36).slice(2)}`,
		[],
	);

	const transport = useMemo(
		() =>
			new TextStreamChatTransport({
				api: "/api/chat",
				body: { config, sessionId },
			}),
		[config, sessionId],
	);

	const initialMessages: UIMessage[] = [
		{
			id: "0",
			role: "assistant",
			parts: [
				{
					type: "text",
					text: 'Hello! Ask me questions about apartment access, like "Do workers need access today?" or "When is the next access day?"',
				},
			],
		},
	];

	const { messages, sendMessage, status, error } = useChat({
		id: chatId,
		transport,
		messages: initialMessages,
	});

	const isLoading = status === "streaming" || status === "submitted";

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!input.trim() || isLoading) return;

		const userMessage = input.trim();
		setInput("");
		await sendMessage({ text: userMessage });
	};

	const getMessageContent = (message: UIMessage) => {
		if ("content" in message && typeof message.content === "string") {
			return message.content;
		}
		if ("parts" in message && Array.isArray(message.parts)) {
			return message.parts
				.filter(
					(part): part is { type: "text"; text: string } =>
						part.type === "text" && typeof part.text === "string",
				)
				.map((part) => part.text)
				.join("");
		}
		return "";
	};

	return (
		<Card className="flex h-[600px] flex-col p-6">
			<div className="mb-4 flex items-center gap-3 border-border border-b pb-4">
				<MessageCircle className="h-5 w-5 text-primary" />
				<h2 className="font-semibold text-foreground text-lg">
					Ask a Question
				</h2>
			</div>

			{/* Messages */}
			<div className="mb-4 flex-1 space-y-4 overflow-y-auto">
				{error && (
					<div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-destructive text-sm">
						Error:{" "}
						{error.message ||
							"Failed to get response. Please check your OpenAI API key."}
					</div>
				)}
				{messages.map((message) => (
					<div
						key={message.id}
						className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
					>
						<div
							className={`max-w-[85%] rounded-lg p-3 text-sm ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}
              `}
						>
							{getMessageContent(message)}
						</div>
					</div>
				))}
				{isLoading && (
					<div className="flex justify-start">
						<div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-foreground text-sm">
							<Loader2 className="h-4 w-4 animate-spin" />
							Thinking...
						</div>
					</div>
				)}
			</div>

			{/* Input */}
			<form onSubmit={handleSubmit} className="flex gap-2">
				<Input
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Do workers need access today?"
					className="flex-1"
					disabled={isLoading}
				/>
				<Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
					<Send className="h-4 w-4" />
				</Button>
			</form>

			<div className="mt-3 text-muted-foreground text-xs">
				<p className="mb-1 font-medium">Try asking:</p>
				<ul className="list-inside list-disc space-y-0.5">
					<li>Do workers need access today?</li>
					<li>Do workers need access on January 10, 2026?</li>
					<li>When is the next access day?</li>
				</ul>
			</div>
		</Card>
	);
}
