import { prisma } from "@/lib/prisma";
import { HardDrive, Server, FileWarning, CloudLightning } from "lucide-react";
import { formatBytes } from "@/lib/utils";

export default async function AdminStoragePage() {
  const [totalFiles, totalSizeAgg, orphanedCount, expiredCount] = await Promise.all([
    prisma.upload.count(),
    prisma.upload.aggregate({ _sum: { size: true } }),
    prisma.upload.count({ where: { userId: null } }), // Example definition of orphan
    prisma.upload.count({ where: { expiresAt: { lt: new Date() } } })
  ]);

  const totalSize = totalSizeAgg._sum.size || 0;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Storage Management</h1>
        <p className="text-muted-foreground mt-1">Monitor MinIO buckets and clean up unused assets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-background rounded-xl border border-border/60 p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
              <HardDrive className="w-5 h-5" />
            </div>
            <h3 className="font-semibold">Total Usage</h3>
          </div>
          <h2 className="text-3xl font-bold">{formatBytes(totalSize)}</h2>
          <p className="text-sm text-muted-foreground mt-1">Across all users</p>
        </div>

        <div className="bg-background rounded-xl border border-border/60 p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-500/10 text-green-500 rounded-lg">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="font-semibold">Total Files</h3>
          </div>
          <h2 className="text-3xl font-bold">{totalFiles.toLocaleString()}</h2>
          <p className="text-sm text-muted-foreground mt-1">Images stored in DB</p>
        </div>

        <div className="bg-background rounded-xl border border-border/60 p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-lg">
              <FileWarning className="w-5 h-5" />
            </div>
            <h3 className="font-semibold">Expired Files</h3>
          </div>
          <h2 className="text-3xl font-bold">{expiredCount.toLocaleString()}</h2>
          <p className="text-sm text-muted-foreground mt-1">Ready for cleanup</p>
        </div>

        <div className="bg-background rounded-xl border border-border/60 p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
              <CloudLightning className="w-5 h-5" />
            </div>
            <h3 className="font-semibold">Orphaned DB Records</h3>
          </div>
          <h2 className="text-3xl font-bold">{orphanedCount.toLocaleString()}</h2>
          <p className="text-sm text-muted-foreground mt-1">Files without owners</p>
        </div>
      </div>

      <div className="bg-background border rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-lg mb-4">Storage Cleanup</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Manually trigger the cron job to delete expired files from both the database and S3 buckets.
        </p>
        <form action="/api/cron/cleanup" method="GET" target="_blank">
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors">
            Run Cleanup Job Now
          </button>
        </form>
      </div>
    </div>
  );
}
