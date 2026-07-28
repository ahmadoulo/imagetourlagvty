import { prisma } from "@/lib/prisma";
import { LineChart, BarChart2, Eye, Download } from "lucide-react";
import { formatBytes } from "@/lib/utils";

export default async function AdminAnalyticsPage() {
  const [totalViews, totalDownloads, topUsers, topBrowsers, topCountries] = await Promise.all([
    prisma.analyticsEvent.count({ where: { eventType: "VIEW" } }),
    prisma.analyticsEvent.count({ where: { eventType: "DOWNLOAD" } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { uploads: { _count: 'desc' } },
      include: { _count: { select: { uploads: true } } }
    }),
    prisma.analyticsEvent.groupBy({
      by: ['browser'],
      _count: { _all: true },
      orderBy: { _count: { browser: 'desc' } },
      take: 5
    }),
    prisma.analyticsEvent.groupBy({
      by: ['country'],
      _count: { _all: true },
      orderBy: { _count: { country: 'desc' } },
      take: 5
    })
  ]);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Analytics</h1>
        <p className="text-muted-foreground mt-1">Platform-wide usage and growth metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-background rounded-xl border border-border/60 p-6 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-500/10 text-blue-500 rounded-xl">
            <Eye className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-muted-foreground font-medium">Total Image Views</h3>
            <p className="text-4xl font-bold">{totalViews.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-background rounded-xl border border-border/60 p-6 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-green-500/10 text-green-500 rounded-xl">
            <Download className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-muted-foreground font-medium">Total File Downloads</h3>
            <p className="text-4xl font-bold">{totalDownloads.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <div className="bg-background border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="font-semibold text-lg flex items-center gap-2"><BarChart2 className="w-5 h-5 text-muted-foreground" /> Top Users by Uploads</h2>
          </div>
          <div className="divide-y">
            {topUsers.map((user) => (
              <div key={user.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="truncate pr-4">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold">{user._count.uploads}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">uploads</p>
                </div>
              </div>
            ))}
            {topUsers.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No users found.</div>
            )}
          </div>
        </div>
        
        <div className="bg-background border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="font-semibold text-lg flex items-center gap-2"><Eye className="w-5 h-5 text-muted-foreground" /> Top Browsers</h2>
          </div>
          <div className="divide-y">
            {topBrowsers.map((b) => (
              <div key={b.browser || "Unknown"} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <p className="font-medium">{b.browser || "Unknown"}</p>
                <div className="text-right">
                  <p className="font-bold">{b._count._all}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">events</p>
                </div>
              </div>
            ))}
            {topBrowsers.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No browser data.</div>
            )}
          </div>
        </div>

        <div className="bg-background border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="font-semibold text-lg flex items-center gap-2"><Eye className="w-5 h-5 text-muted-foreground" /> Top Countries</h2>
          </div>
          <div className="divide-y">
            {topCountries.map((c) => (
              <div key={c.country || "Unknown"} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <p className="font-medium">{c.country || "Unknown"}</p>
                <div className="text-right">
                  <p className="font-bold">{c._count._all}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">events</p>
                </div>
              </div>
            ))}
            {topCountries.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No country data.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
