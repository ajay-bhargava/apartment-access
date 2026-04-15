"use client";

import {
	addMonths,
	eachDayOfInterval,
	endOfMonth,
	endOfWeek,
	format,
	isSameMonth,
	isToday,
	startOfMonth,
	startOfWeek,
	subMonths,
} from "date-fns";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import type { AccessConfig, AccessDateInfo } from "@/lib/expandAccessDates";

interface AccessCalendarProps {
	config: AccessConfig;
	accessDateMap: Map<string, AccessDateInfo>;
}

export function AccessCalendar({ config, accessDateMap }: AccessCalendarProps) {
	const [currentMonth, setCurrentMonth] = useState(new Date());

	const monthStart = startOfMonth(currentMonth);
	const monthEnd = endOfMonth(currentMonth);
	const calendarStart = startOfWeek(monthStart);
	const calendarEnd = endOfWeek(monthEnd);

	const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

	const goToToday = () => {
		setCurrentMonth(new Date());
	};

	const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
	const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

	return (
		<Card className="p-6">
			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Calendar className="h-5 w-5 text-muted-foreground" />
					<h2 className="font-semibold text-foreground text-lg">
						{format(currentMonth, "MMMM yyyy")}
					</h2>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={goToToday}>
						Today
					</Button>
					<Button variant="ghost" size="icon" onClick={prevMonth}>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button variant="ghost" size="icon" onClick={nextMonth}>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Legend */}
			<div className="mb-4 flex items-center gap-4 text-muted-foreground text-xs">
				<div className="flex items-center gap-2">
					<div className="h-4 w-4 rounded-sm border-2 border-primary bg-primary/20" />
					<span>Access Required</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="h-4 w-4 rounded-sm border border-border bg-muted" />
					<span>No Access</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="h-4 w-4 rounded-sm border border-border/50 bg-muted/50" />
					<span>Sunday</span>
				</div>
			</div>

			{/* Calendar Grid */}
			<div className="grid grid-cols-7 gap-1">
				{/* Day headers */}
				{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
					<div
						key={day}
						className="py-2 text-center font-medium text-muted-foreground text-xs"
					>
						{day}
					</div>
				))}

				{/* Calendar days */}
				{days.map((day) => {
					const dateKey = format(day, "yyyy-MM-dd");
					const accessInfo = accessDateMap.get(dateKey);
					const hasAccess = !!accessInfo;
					const inCurrentMonth = isSameMonth(day, currentMonth);
					const isSunday = day.getDay() === 0;

					return (
						<Popover key={dateKey}>
							<PopoverTrigger asChild>
								<button
									type="button"
									className={`aspect-square rounded-lg p-1 text-sm transition-colors ${!inCurrentMonth ? "opacity-40" : ""}
                    ${hasAccess ? "border-2 border-primary bg-primary/20 font-medium hover:bg-primary/30" : "border border-border bg-muted hover:bg-muted/80"}
                    ${isSunday && !hasAccess ? "border-border/50 bg-muted/50" : ""}
                    ${isToday(day) ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : ""}
                  `}
								>
									<div className="flex h-full flex-col items-center justify-center">
										<span
											className={hasAccess ? "text-primary" : "text-foreground"}
										>
											{format(day, "d")}
										</span>
									</div>
								</button>
							</PopoverTrigger>
							<PopoverContent className="w-80">
								<div className="space-y-3">
									<div>
										<h4 className="mb-1 font-semibold text-foreground">
											{format(day, "EEEE, MMMM d, yyyy")}
										</h4>
										{isSunday && !hasAccess && (
											<Badge variant="secondary" className="text-xs">
												No work (Sunday)
											</Badge>
										)}
									</div>

									{hasAccess ? (
										<div className="space-y-2">
											<div className="flex items-center gap-2">
												<Badge variant="default">Access Required</Badge>
											</div>
											<div className="text-muted-foreground text-sm">
												<p className="mb-2">
													Crew may enter up to{" "}
													<span className="font-semibold text-foreground">
														{accessInfo.entriesAllowed} times
													</span>
													:
												</p>
												<ul className="list-inside list-disc space-y-1">
													{accessInfo.entryWindows.map((window) => (
														<li key={window} className="capitalize">
															{window}
														</li>
													))}
												</ul>
											</div>
											<div className="border-border border-t pt-2">
												<p className="mb-1 font-medium text-muted-foreground text-xs">
													Block:
												</p>
												<p className="text-foreground text-sm">
													{accessInfo.title}
												</p>
												{accessInfo.notes && (
													<p className="mt-1 text-muted-foreground text-xs">
														{accessInfo.notes}
													</p>
												)}
											</div>
										</div>
									) : (
										<div className="space-y-2">
											<Badge variant="secondary">No Access Required</Badge>
											<p className="text-muted-foreground text-sm">
												No crew access scheduled for this day.
											</p>
										</div>
									)}
								</div>
							</PopoverContent>
						</Popover>
					);
				})}
			</div>
		</Card>
	);
}
