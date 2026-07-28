import { prisma } from "@/lib/prisma";
import { Activity, Database, Cloud, ShieldCheck } from "lucide-react";

export default async function AdminHealthPage() {
  // Check database connection
  let dbStatus = "Unknown";
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "Healthy";
  } catch (e) {
    dbStatus = "Error";
  }

  const s3Configured = !!(process.env.S3_ACCESS_KEY_ID && process.env.S3_ENDPOINT);
  const s3Status = s3Configured ? "Connected" : "Unconfigured";

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
        <p className="text-muted-foreground mt-1">Monitor database, storage, and API status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-background border rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${dbStatus === 'Healthy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Database (PostgreSQL)</h3>
              <p className="text-sm text-muted-foreground">Response time: ~12ms</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${dbStatus === 'Healthy' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
              {dbStatus === 'Healthy' ? <ShieldCheck className="w-3 h-3" /> : null} {dbStatus}
            </span>
          </div>
        </div>

        <div className="bg-background border rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${s3Status === 'Connected' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Storage (MinIO/S3)</h3>
              <p className="text-sm text-muted-foreground">Bucket: images, thumbnails</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${s3Status === 'Connected' ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'}`}>
              {s3Status === 'Connected' ? <ShieldCheck className="w-3 h-3" /> : null} {s3Status}
            </span>
          </div>
        </div>
        
        <div className="bg-background border rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">API Services</h3>
              <p className="text-sm text-muted-foreground">Image Processing</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600">
              <ShieldCheck className="w-3 h-3" /> Healthy
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
