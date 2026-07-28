import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ShieldCheck, HardDrive, Database, Clock, ArrowLeft, MoreVertical } from "lucide-react";
import Link from "next/link";
import { UserActions } from "../user-actions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function UserDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      subscriptions: {
        include: { plan: true },
        orderBy: { createdAt: "desc" },
        take: 1
      },
      _count: { select: { uploads: true, folders: true, apiKeys: true } },
    }
  });

  if (!user) {
    notFound();
  }

  // Get total storage used by user
  const uploads = await prisma.upload.aggregate({
    where: { userId: id },
    _sum: { size: true }
  });
  const totalStorage = uploads._sum.size || 0;

  // Recent uploads
  const recentUploads = await prisma.upload.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  // Recent activity (Audit logs where user is the target or actor)
  const recentActivity = await prisma.auditLog.findMany({
    where: {
      OR: [
        { userId: id },
        { targetId: id }
      ]
    },
    orderBy: { createdAt: "desc" },
    take: 10
  });

  const session = await auth.api.getSession({ headers: await headers() });
  const currentUserId = session?.user?.id || "";
  const superAdminCount = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/users" className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
          <p className="text-muted-foreground">{user.email} • Joined {user.createdAt.toLocaleDateString()}</p>
        </div>
        <div className="ml-auto">
          <UserActions 
            user={user as any} 
            currentUserId={currentUserId} 
            superAdminCount={superAdminCount} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-background border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-medium">Role & Status</h3>
          </div>
          <div className="text-2xl font-semibold mb-1">{user.role}</div>
          <div className={`text-sm ${user.status === 'ACTIVE' ? 'text-green-500' : 'text-red-500'}`}>
            {user.status}
          </div>
        </div>

        <div className="bg-background border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Database className="w-5 h-5" />
            <h3 className="font-medium">Plan</h3>
          </div>
          <div className="text-2xl font-semibold mb-1">
            {user.subscriptions[0]?.plan.name || "Free"}
          </div>
          <div className="text-sm text-muted-foreground">
            {user.subscriptions[0]?.status || "No active subscription"}
          </div>
        </div>

        <div className="bg-background border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <HardDrive className="w-5 h-5" />
            <h3 className="font-medium">Storage Used</h3>
          </div>
          <div className="text-2xl font-semibold mb-1">{formatBytes(totalStorage)}</div>
          <div className="text-sm text-muted-foreground">
            across {user._count.uploads} files
          </div>
        </div>

        <div className="bg-background border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Clock className="w-5 h-5" />
            <h3 className="font-medium">Last Login</h3>
          </div>
          <div className="text-2xl font-semibold mb-1">
            Unknown
          </div>
          <div className="text-sm text-muted-foreground">
            IP: N/A
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-background border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b bg-muted/20">
            <h3 className="font-semibold">Recent Uploads</h3>
          </div>
          <div className="divide-y">
            {recentUploads.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">No uploads yet.</div>
            ) : (
              recentUploads.map(upload => (
                <div key={upload.id} className="p-4 flex items-center justify-between hover:bg-muted/10">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {upload.mimeType.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={upload.url} alt="" className="w-10 h-10 object-cover rounded" />
                    ) : (
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                        <HardDrive className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="truncate">
                      <p className="text-sm font-medium truncate">{upload.originalName}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(upload.size)}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    {upload.createdAt.toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-3 border-t bg-muted/10 text-center">
            <Link href={`/admin/images?user=${user.id}`} className="text-sm text-primary hover:underline">
              View all {user._count.uploads} uploads
            </Link>
          </div>
        </div>

        <div className="bg-background border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b bg-muted/20">
            <h3 className="font-semibold">Recent Activity</h3>
          </div>
          <div className="divide-y">
            {recentActivity.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">No activity logs found.</div>
            ) : (
              recentActivity.map(log => (
                <div key={log.id} className="p-4 text-sm hover:bg-muted/10 flex gap-4">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-primary/40 shrink-0" />
                  <div>
                    <p className="font-medium">{log.action}</p>
                    <p className="text-muted-foreground mt-0.5">
                      {log.targetType && log.targetId ? `Target: ${log.targetType} (${log.targetId.substring(0,8)}...)` : "System Action"}
                    </p>
                  </div>
                  <div className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
                    {log.createdAt.toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-3 border-t bg-muted/10 text-center">
            <Link href={`/admin/logs?user=${user.id}`} className="text-sm text-primary hover:underline">
              View all activity
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
