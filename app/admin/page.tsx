import { prisma } from "@/lib/prisma";
import { Users, HardDrive } from "lucide-react";

export default async function AdminPage() {
  const usersCount = await prisma.user.count();
  const uploadsCount = await prisma.upload.count();
  
  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
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
    </div>
  );
}
