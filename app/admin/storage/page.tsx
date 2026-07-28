import { prisma } from "@/lib/prisma";
import { HardDrive, Server, FileWarning, CloudLightning, Database } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { s3Client } from "@/lib/s3";
import { ListBucketsCommand } from "@aws-sdk/client-s3";

export default async function AdminStoragePage() {
  const [totalFiles, totalSizeAgg, orphanedCount, expiredCount, largestFiles] = await Promise.all([
    prisma.upload.count(),
    prisma.upload.aggregate({ _sum: { size: true } }),
    prisma.upload.count({ where: { userId: null } }), // Example definition of orphan
    prisma.upload.count({ where: { expiresAt: { lt: new Date() } } }),
    prisma.upload.findMany({
      orderBy: { size: "desc" },
      take: 10,
      include: { user: { select: { email: true, name: true } } }
    })
  ]);

  const totalSize = totalSizeAgg._sum.size || 0;
  
  let s3Buckets: string[] = [];
  let s3Error = null;
  try {
    const data = await s3Client.send(new ListBucketsCommand({}));
    s3Buckets = data.Buckets?.map(b => b.Name || "") || [];
  } catch (err: any) {
    s3Error = err.message;
  }

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-background border rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-lg mb-4">Largest Files</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-muted-foreground border-b">
                <tr>
                  <th className="pb-3 font-medium">Filename</th>
                  <th className="pb-3 font-medium">Owner</th>
                  <th className="pb-3 font-medium">Size</th>
                  <th className="pb-3 font-medium text-right">Uploaded</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {largestFiles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-muted-foreground">No files found.</td>
                  </tr>
                ) : largestFiles.map(file => (
                  <tr key={file.id}>
                    <td className="py-3 font-medium truncate max-w-[200px]" title={file.originalName}>{file.originalName}</td>
                    <td className="py-3 text-muted-foreground">{file.user?.email || "Anonymous"}</td>
                    <td className="py-3 font-mono">{formatBytes(file.size)}</td>
                    <td className="py-3 text-right text-muted-foreground">{file.createdAt.toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-background border rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              MinIO Connection
            </h2>
            {s3Error ? (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                <strong>Connection Error:</strong> {s3Error}
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 text-sm text-green-600 mb-4">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Connected Successfully
                </div>
                <h4 className="text-sm font-medium mb-2">Detected Buckets:</h4>
                <ul className="space-y-1">
                  {s3Buckets.length === 0 ? (
                    <li className="text-sm text-muted-foreground">No buckets found.</li>
                  ) : (
                    s3Buckets.map(b => (
                      <li key={b} className="text-sm font-mono px-2 py-1 bg-muted rounded-md">{b}</li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="bg-background border rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-lg mb-4">Storage Cleanup</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Manually trigger the cron job to delete expired files from both the database and S3 buckets.
            </p>
            <form action="/api/cron/cleanup" method="GET" target="_blank">
              <button type="submit" className="w-full px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors">
                Run Cleanup Job Now
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
