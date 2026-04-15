import { eachDayOfInterval, format } from "date-fns";

export interface AccessBlock {
	id: string;
	title: string;
	startDate: string;
	endDate: string;
	type: "access";
	notes?: string;
	includeSundays?: boolean;
	entryWindows?: string[];
}

export interface AccessConfig {
	timezone: string;
	rules: {
		defaultWorkDays: number[];
		entriesPerAccessDay: number;
		entryWindows: string[];
		skipSundaysUnlessExplicit: boolean;
	};
	blocks: AccessBlock[];
}

export interface AccessDateInfo {
	blockId: string;
	title: string;
	notes?: string;
	entriesAllowed: number;
	entryWindows: string[];
}

export function expandAccessDates(
	config: AccessConfig,
): Map<string, AccessDateInfo> {
	const accessMap = new Map<string, AccessDateInfo>();

	config.blocks.forEach((block) => {
		const start = new Date(`${block.startDate}T00:00:00`);
		const end = new Date(`${block.endDate}T00:00:00`);

		const days = eachDayOfInterval({ start, end });

		days.forEach((day) => {
			const dayOfWeek = day.getDay();
			const isSunday = dayOfWeek === 0;

			// Skip Sundays unless explicitly included
			if (
				isSunday &&
				config.rules.skipSundaysUnlessExplicit &&
				!block.includeSundays
			) {
				return;
			}

			// Check if day is in defaultWorkDays
			if (
				!config.rules.defaultWorkDays.includes(dayOfWeek) &&
				!block.includeSundays
			) {
				return;
			}

			const dateKey = format(day, "yyyy-MM-dd");
			accessMap.set(dateKey, {
				blockId: block.id,
				title: block.title,
				notes: block.notes,
				entriesAllowed: block.entryWindows?.length ?? config.rules.entriesPerAccessDay,
				entryWindows: block.entryWindows ?? config.rules.entryWindows,
			});
		});
	});

	return accessMap;
}
