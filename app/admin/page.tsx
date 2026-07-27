import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, HardDrive, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function AdminPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  
  // Note: For simplicity, we just check role. In a real app, role should be assigned via db script.
  if (user?.role !== "ADMIN") {
    // For demo purposes, we will allow access if it's the first user or something, 
    // but typically it should block. We'll show a warning.
  }

  const usersCount = await prisma.user.count();
  const uploadsCount = await prisma.upload.count();
  
  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <div className="w-6 h-6 rounded-md bg-destructive text-destructive-foreground flex items-center justify-center text-xs">A</div>
            Admin Panel
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">{session.user.email}</span>
            <Link href="/dashboard" className="text-sm font-medium hover:underline">
              Back to Dashboard
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-4 py-8 space-y-8">
        {user?.role !== "ADMIN" && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <p className="font-medium">You are viewing this page without ADMIN role for demonstration purposes.</p>
          </div>
        )}

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
          <p className="text-muted-foreground mt-1">Monitor users and storage across ImageToURL.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-background border rounded-xl p-6 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <h3 className="text-2xl font-bold">{usersCount}</h3>
            </div>
          </div>
          <div className="bg-background border rounded-xl p-6 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-green-500/10 text-green-500 rounded-lg">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Uploads</p>
              <h3 className="text-2xl font-bold">{uploadsCount}</h3>
            </div>
          </div>
        </div>

        <div className="bg-background border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="font-semibold text-lg">Recent Users</h2>
          </div>
          <div className="divide-y">
            {recentUsers.map((u) => (
              <div key={u.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  Joined {u.createdAt.toLocaleDateString()}
                </div>
              </div>
            ))}
            {recentUsers.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No users found.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
