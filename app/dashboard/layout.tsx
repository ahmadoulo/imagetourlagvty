import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import Link from "next/link";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <header className="border-b border-border/40 bg-background flex-shrink-0 h-14 z-20 relative">
        <div className="flex h-full w-full items-center justify-between px-4 lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-tight hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm shadow-sm shadow-primary/20">P</div>
            <span className="hidden sm:inline-block">Pixora</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <UserMenu email={session.user.email} role={session.user.role as string} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative w-full h-[calc(100vh-56px)]">
        {children}
      </main>
    </div>
  );
}
