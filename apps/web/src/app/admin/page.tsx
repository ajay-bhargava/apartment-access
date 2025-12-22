"use client";

import { api } from "@apartment-access/backend/convex/_generated/api";
import {
	Authenticated,
	AuthLoading,
	Unauthenticated,
	useMutation,
	useQuery,
} from "convex/react";
import {
	AlertCircle,
	ArrowLeft,
	CheckCircle2,
	Loader2,
	Save,
	ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import SignInForm from "@/components/sign-in-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { validateAccessConfig } from "@/lib/accessSchema";
import { authClient } from "@/lib/auth-client";

const ADMIN_EMAIL = "bhargava.ajay@gmail.com";

function AdminContent() {
	const { data: session } = authClient.useSession();
	const storedConfig = useQuery(api.accessConfig.get);
	const upsertConfig = useMutation(api.accessConfig.upsert);

	const [jsonInput, setJsonInput] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const isAdmin = session?.user?.email === ADMIN_EMAIL;

	// Load config when it becomes available
	useEffect(() => {
		if (storedConfig) {
			const { _id, _creationTime, ...configWithoutMeta } = storedConfig;
			setJsonInput(JSON.stringify(configWithoutMeta, null, 2));
		}
	}, [storedConfig]);

	const handleValidateAndApply = async () => {
		setError(null);
		setSuccess(false);
		setIsSaving(true);

		try {
			const parsed = JSON.parse(jsonInput);
			const validation = validateAccessConfig(parsed);

			if (!validation.success) {
				setError(validation.errors.join("\n"));
				setIsSaving(false);
				return;
			}

			// Save to Convex
			await upsertConfig({ config: parsed });
			setSuccess(true);

			// Clear success message after 3 seconds
			setTimeout(() => setSuccess(false), 3000);
		} catch (e) {
			if (e instanceof SyntaxError) {
				setError("Invalid JSON format. Please check your syntax.");
			} else if (e instanceof Error) {
				setError(e.message);
			} else {
				setError("An unknown error occurred");
			}
		} finally {
			setIsSaving(false);
		}
	};

	// Not admin - show access denied
	if (!isAdmin) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<Card className="max-w-md p-8 text-center">
					<ShieldAlert className="mx-auto mb-4 h-12 w-12 text-destructive" />
					<h2 className="mb-2 font-semibold text-foreground text-xl">
						Access Denied
					</h2>
					<p className="mb-4 text-muted-foreground">
						You don&apos;t have permission to access the admin panel. Only{" "}
						<strong>{ADMIN_EMAIL}</strong> can manage the access configuration.
					</p>
					<p className="mb-4 text-muted-foreground text-sm">
						Logged in as: <strong>{session?.user?.email}</strong>
					</p>
					<Link href="/">
						<Button variant="outline">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Calendar
						</Button>
					</Link>
				</Card>
			</div>
		);
	}

	// Loading config
	if (storedConfig === undefined) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<div className="flex items-center gap-2 text-muted-foreground">
					<Loader2 className="h-5 w-5 animate-spin" />
					<span>Loading configuration...</span>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<header className="border-border border-b bg-card">
				<div className="container mx-auto px-4 py-4">
					<div className="flex items-center gap-4">
						<Link href="/">
							<Button variant="ghost" size="sm">
								<ArrowLeft className="mr-2 h-4 w-4" />
								Back
							</Button>
						</Link>
						<div className="flex items-center gap-3">
							<h1 className="font-semibold text-foreground text-xl">
								Admin Configuration
							</h1>
							<Badge variant="secondary">JSON Editor</Badge>
						</div>
					</div>
				</div>
			</header>

			<main className="container mx-auto max-w-4xl px-4 py-8">
				<Card className="mb-6 p-6">
					<h2 className="mb-2 font-semibold text-foreground text-lg">
						How to Use
					</h2>
					<ul className="list-inside list-disc space-y-1 text-muted-foreground text-sm">
						<li>Edit the JSON below to modify access blocks and rules</li>
						<li>Ensure all dates are in ISO format (YYYY-MM-DD)</li>
						<li>Ensure startDate ≤ endDate for each block</li>
						<li>Click "Validate & Apply" to save changes</li>
					</ul>
				</Card>

				{error && (
					<Alert
						className="mb-6 border-destructive/20 bg-destructive/10"
						variant="destructive"
					>
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Validation Error</AlertTitle>
						<AlertDescription>
							<pre className="mt-2 whitespace-pre-wrap font-mono text-sm">
								{error}
							</pre>
						</AlertDescription>
					</Alert>
				)}

				{success && (
					<Alert className="mb-6 border-green-500/20 bg-green-500/10">
						<CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
						<AlertTitle className="text-green-600 dark:text-green-400">
							Configuration Saved
						</AlertTitle>
						<AlertDescription className="text-green-600/80 dark:text-green-400/80">
							Your changes have been applied successfully.
						</AlertDescription>
					</Alert>
				)}

				<Card className="p-6">
					<div className="mb-4 flex items-center justify-between">
						<h2 className="font-semibold text-foreground text-lg">
							JSON Configuration
						</h2>
						<Button onClick={handleValidateAndApply} disabled={isSaving}>
							{isSaving ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Saving...
								</>
							) : (
								<>
									<Save className="mr-2 h-4 w-4" />
									Validate & Apply
								</>
							)}
						</Button>
					</div>
					<Textarea
						value={jsonInput}
						onChange={(e) => setJsonInput(e.target.value)}
						className="min-h-[500px] font-mono text-sm"
						placeholder="Enter JSON configuration..."
					/>
				</Card>
			</main>
		</div>
	);
}

function SignInPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<Card className="w-full max-w-md p-8">
				<SignInForm onSwitchToSignUp={() => {}} />
				<div className="mt-4 text-center">
					<Link href="/">
						<Button variant="ghost" size="sm">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Calendar
						</Button>
					</Link>
				</div>
			</Card>
		</div>
	);
}

export default function AdminPage() {
	return (
		<>
			<Authenticated>
				<AdminContent />
			</Authenticated>
			<Unauthenticated>
				<SignInPage />
			</Unauthenticated>
			<AuthLoading>
				<div className="flex min-h-screen items-center justify-center bg-background">
					<div className="flex items-center gap-2 text-muted-foreground">
						<Loader2 className="h-5 w-5 animate-spin" />
						<span>Checking authentication...</span>
					</div>
				</div>
			</AuthLoading>
		</>
	);
}
