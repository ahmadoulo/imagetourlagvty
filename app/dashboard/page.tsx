import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { AssetManager } from "@/components/dashboard/AssetManager";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <header className="border-b border-border/40 bg-background flex-shrink-0 h-14">
        <div className="flex h-full w-full items-center justify-between px-4 lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs shadow-sm shadow-primary/20">I</div>
            <span className="hidden sm:inline-block">ImageToURL</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <UserMenu email={session.user.email} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        <AssetManager />
      </main>
    </div>
  );
}
