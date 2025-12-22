"use client";

import { api } from "@apartment-access/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { CalendarDays, Loader2, Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AccessCalendar } from "@/components/access-calendar";
import { ResidentQA } from "@/components/resident-qa";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type AccessConfig, expandAccessDates } from "@/lib/expandAccessDates";

const DEFAULT_CONFIG: AccessConfig = {
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
			type: "access",
			notes: "Full crew access",
		},
		{
			id: "block-2",
			title: "Block 2 — Second access period",
			startDate: "2026-01-27",
			endDate: "2026-01-29",
			type: "access",
			notes: "Full crew access",
		},
		{
			id: "block-3",
			title: "Block 3 — Continues immediately",
			startDate: "2026-01-30",
			endDate: "2026-02-01",
			type: "access",
			notes: "Full crew access",
		},
		{
			id: "block-4",
			title: "Block 4 — Final long access period",
			startDate: "2026-02-07",
			endDate: "2026-03-13",
			type: "access",
			notes: "Full crew access",
		},
	],
};

export default function HomePage() {
	const storedConfig = useQuery(api.accessConfig.get);
	const initializeDefault = useMutation(api.accessConfig.initializeDefault);
	const [isInitializing, setIsInitializing] = useState(false);

	// Use stored config if available, otherwise use default
	const config: AccessConfig = useMemo(() => {
		if (storedConfig) {
			return {
				timezone: storedConfig.timezone,
				rules: storedConfig.rules,
				blocks: storedConfig.blocks,
			};
		}
		return DEFAULT_CONFIG;
	}, [storedConfig]);

	// Initialize default config if none exists
	useEffect(() => {
		if (storedConfig === null && !isInitializing) {
			setIsInitializing(true);
			initializeDefault().finally(() => setIsInitializing(false));
		}
	}, [storedConfig, initializeDefault, isInitializing]);

	const accessDateMap = useMemo(() => expandAccessDates(config), [config]);

	const totalAccessDays = accessDateMap.size;
	const totalBlocks = config.blocks.length;

	// Show loading state while fetching config
	if (storedConfig === undefined) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<div className="flex items-center gap-2 text-muted-foreground">
					<Loader2 className="h-5 w-5 animate-spin" />
					<span>Loading access schedule...</span>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<header className="border-border border-b bg-card">
				<div className="container mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<CalendarDays className="h-6 w-6 text-primary" />
							<h1 className="font-semibold text-foreground text-xl">
								Apartment Access Calendar
							</h1>
						</div>
						<Link href="/admin">
							<Button variant="outline" size="sm">
								<Settings className="mr-2 h-4 w-4" />
								Admin
							</Button>
						</Link>
					</div>
				</div>
			</header>

			<main className="container mx-auto max-w-6xl px-4 py-8">
				<Card className="mb-6 border-muted bg-muted/30 p-6">
					<div className="flex items-start gap-4">
						<div className="flex-1">
							<h2 className="mb-2 font-medium text-foreground text-lg">
								Access Schedule Overview
							</h2>
							<p className="text-muted-foreground text-sm leading-relaxed">
								Access required on{" "}
								<span className="font-semibold text-foreground">
									{totalAccessDays} working days
								</span>{" "}
								across{" "}
								<span className="font-semibold text-foreground">
									{totalBlocks} blocks
								</span>
								. On access days, crew may enter up to{" "}
								<span className="font-semibold text-foreground">
									{config.rules.entriesPerAccessDay} times per day
								</span>{" "}
								({config.rules.entryWindows.join(", ")}).
							</p>
						</div>
						<Badge variant="secondary" className="mt-1">
							{config.timezone}
						</Badge>
					</div>
				</Card>

				<div className="grid gap-6 lg:grid-cols-[1fr_380px]">
					<div>
						<AccessCalendar config={config} accessDateMap={accessDateMap} />
					</div>
					<div>
						<ResidentQA config={config} />
					</div>
				</div>
			</main>
		</div>
	);
}
