import { prisma } from "@/lib/prisma";
import { Users, HardDrive, Eye, Download, Image as ImageIcon, Activity, TrendingUp } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import AdminOverviewChart from "./AdminOverviewChart";
import Link from "next/link";

export default async function AdminPage() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [
    usersCount, newUsersToday, 
    uploadsCount, newUploadsToday,
    storageAgg,
    totalViews, totalDownloads,
    recentUsers, recentUploads,
    recentEvents
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.upload.count(),
    prisma.upload.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.upload.aggregate({ _sum: { size: true } }),
    prisma.analyticsEvent.count({ where: { eventType: "VIEW" } }),
    prisma.analyticsEvent.count({ where: { eventType: "DOWNLOAD" } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.upload.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { user: { select: { name: true } } } }),
    prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { eventType: true, createdAt: true }
    })
  ]);

  const totalStorage = storageAgg._sum.size || 0;

  // Process chart data
  const chartDataMap: Record<string, { views: number, downloads: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    chartDataMap[d.toISOString().split('T')[0]] = { views: 0, downloads: 0 };
  }

  recentEvents.forEach(e => {
    const d = e.createdAt.toISOString().split('T')[0];
    if (chartDataMap[d]) {
      if (e.eventType === 'VIEW') chartDataMap[d].views++;
      if (e.eventType === 'DOWNLOAD') chartDataMap[d].downloads++;
    }
  });

  const chartData = Object.entries(chartDataMap).map(([date, data]) => ({
    date,
    views: data.views,
    downloads: data.downloads
  }));

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Command Center</h1>
          <p className="text-muted-foreground mt-1">Real-time pulse of your SaaS platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center text-sm text-emerald-500 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
            All Systems Operational
          </span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-background/60 backdrop-blur-xl border border-border/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Users</p>
              <h3 className="text-3xl font-bold">{usersCount.toLocaleString()}</h3>
              <p className="text-xs text-blue-500 font-medium mt-2 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" /> +{newUsersToday} today
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-background/60 backdrop-blur-xl border border-border/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Assets</p>
              <h3 className="text-3xl font-bold">{uploadsCount.toLocaleString()}</h3>
              <p className="text-xs text-purple-500 font-medium mt-2 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" /> +{newUploadsToday} today
              </p>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-600 rounded-xl">
              <ImageIcon className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-background/60 backdrop-blur-xl border border-border/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Global Views</p>
              <h3 className="text-3xl font-bold">{totalViews.toLocaleString()}</h3>
              <p className="text-xs text-emerald-500 font-medium mt-2">All time</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <Eye className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-background/60 backdrop-blur-xl border border-border/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Storage Consumed</p>
              <h3 className="text-3xl font-bold">{formatBytes(totalStorage)}</h3>
              <p className="text-xs text-orange-500 font-medium mt-2">Across all tiers</p>
            </div>
            <div className="p-3 bg-orange-500/10 text-orange-600 rounded-xl">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="bg-background/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Platform Traffic (30 Days)</h2>
        </div>
        <div className="h-[350px] w-full">
          <AdminOverviewChart data={chartData} />
        </div>
      </div>

      {/* Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-background/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border/40 flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" /> Newest Users
            </h2>
            <Link href="/admin/users" className="text-sm text-primary hover:underline font-medium">View all</Link>
          </div>
          <div className="divide-y divide-border/40 flex-1">
            {recentUsers.map((u) => (
              <div key={u.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <div className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                  {u.createdAt.toLocaleDateString()}
                </div>
              </div>
            ))}
            {recentUsers.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">No users yet.</div>
            )}
          </div>
        </div>

        <div className="bg-background/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border/40 flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-500" /> Recent Uploads
            </h2>
            <Link href="/admin/images" className="text-sm text-primary hover:underline font-medium">View all</Link>
          </div>
          <div className="divide-y divide-border/40 flex-1">
            {recentUploads.map((img) => (
              <div key={img.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-muted flex-shrink-0 overflow-hidden relative border border-border/50">
                    <img src={img.url} alt="" className="object-cover w-full h-full" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate pr-4">{img.originalName}</p>
                    <p className="text-xs text-muted-foreground truncate">By {img.user?.name || "Guest"} • {formatBytes(img.size)}</p>
                  </div>
                </div>
                <div className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-md shrink-0">
                  {img.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            ))}
            {recentUploads.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">No uploads yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
