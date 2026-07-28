import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  
  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col overflow-hidden">
      <header className="border-b bg-background sticky top-0 z-20 shrink-0">
        <div className="flex h-14 items-center justify-between px-4 w-full">
          <Link href="/admin" className="flex items-center gap-2 font-bold tracking-tight">
            <div className="w-6 h-6 rounded-md bg-destructive text-destructive-foreground flex items-center justify-center text-xs">A</div>
            SaaS Admin
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">{session.user.email}</span>
            <Link href="/dashboard" className="text-sm font-medium hover:underline">
              Exit Admin
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-56px)]">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
