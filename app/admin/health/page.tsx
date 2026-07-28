import { prisma } from "@/lib/prisma";
import { Activity, Database, Server, Clock, HardDrive, Cpu, ShieldCheck, CloudLightning } from "lucide-react";
import os from "os";
import { s3Client } from "@/lib/s3";
import { ListBucketsCommand } from "@aws-sdk/client-s3";

export default async function AdminHealthPage() {
  const uptime = os.uptime();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const loadAvg = os.loadavg();
  
  // Test DB connection
  let dbStatus = "Disconnected";
  let dbLatency = 0;
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - start;
    dbStatus = "Connected";
  } catch (e) {
    dbStatus = "Error";
  }

  // Test MinIO connection
  let minioStatus = "Disconnected";
  let minioLatency = 0;
  try {
    const minioStart = Date.now();
    await s3Client.send(new ListBucketsCommand({}));
    minioLatency = Date.now() - minioStart;
    minioStatus = "Connected";
  } catch (e) {
    minioStatus = "Error";
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
        <p className="text-muted-foreground mt-1">Real-time status of services and infrastructure.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-background border rounded-xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Server className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-lg">Application Server</h3>
          </div>
          <div className="space-y-2 mt-2 z-10">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="text-green-500 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Online
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Uptime</span>
              <span className="font-medium">{formatUptime(uptime)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Node Version</span>
              <span className="font-medium">{process.version}</span>
            </div>
          </div>
        </div>

        <div className="bg-background border rounded-xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Database className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-lg">PostgreSQL Database</h3>
          </div>
          <div className="space-y-2 mt-2 z-10">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className={`${dbStatus === 'Connected' ? 'text-green-500' : 'text-red-500'} font-medium flex items-center gap-1`}>
                <span className={`w-2 h-2 rounded-full ${dbStatus === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`}></span> {dbStatus}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Latency</span>
              <span className="font-medium">{dbLatency}ms</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ORM</span>
              <span className="font-medium">Prisma</span>
            </div>
          </div>
        </div>

        <div className="bg-background border rounded-xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Cpu className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-lg">System Resources</h3>
          </div>
          <div className="space-y-2 mt-2 z-10">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">CPU Load (1m, 5m, 15m)</span>
              <span className="font-medium">{loadAvg[0].toFixed(2)}, {loadAvg[1].toFixed(2)}, {loadAvg[2].toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Memory Usage</span>
              <span className="font-medium">{Math.round((totalMem - freeMem) / 1024 / 1024 / 1024 * 100) / 100} GB / {Math.round(totalMem / 1024 / 1024 / 1024 * 100) / 100} GB</span>
            </div>
          </div>
        </div>
        <div className="bg-background border rounded-xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <CloudLightning className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-2">
            <CloudLightning className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-lg">MinIO Storage</h3>
          </div>
          <div className="space-y-2 mt-2 z-10">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className={`${minioStatus === 'Connected' ? 'text-green-500' : 'text-red-500'} font-medium flex items-center gap-1`}>
                <span className={`w-2 h-2 rounded-full ${minioStatus === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`}></span> {minioStatus}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Latency</span>
              <span className="font-medium">{minioLatency}ms</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Provider</span>
              <span className="font-medium">S3 Compatible</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className={`border rounded-xl p-6 flex items-start gap-4 ${dbStatus === 'Connected' && minioStatus === 'Connected' ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-red-500/10 border-red-500/20 text-red-600'}`}>
        <ShieldCheck className="w-6 h-6 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold mb-1">{dbStatus === 'Connected' && minioStatus === 'Connected' ? 'System is Healthy' : 'System Issues Detected'}</h3>
          <p className="text-sm">{dbStatus === 'Connected' && minioStatus === 'Connected' ? 'All core services are responding normally. No active alerts.' : 'One or more core services are failing to respond. Check connection settings.'}</p>
        </div>
      </div>
    </div>
  );
}
