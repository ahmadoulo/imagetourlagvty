import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedUser } from "@/lib/api-utils";
import { z } from "zod";

const querySchema = z.object({
  range: z.string().optional().default("30")
});

export const GET = withAuth(async (request: Request, user: AuthenticatedUser) => {
  const userId = user.id;
  const url = new URL(request.url);
  
  const params = Object.fromEntries(url.searchParams.entries());
  const validated = querySchema.parse(params);
  
  const range = validated.range; // days
  const rangeDate = new Date();
  rangeDate.setDate(rangeDate.getDate() - parseInt(range));

  // Get total metrics
  const totalViews = await prisma.analyticsEvent.count({
    where: { userId, eventType: "VIEW" }
  });
  const totalDownloads = await prisma.analyticsEvent.count({
    where: { userId, eventType: "DOWNLOAD" }
  });
  
  // Using Prisma aggregation for bandwidth
  const bandwidthAgg = await prisma.analyticsEvent.aggregate({
    where: { userId },
    _sum: { bandwidth: true }
  });
  const totalBandwidth = bandwidthAgg._sum.bandwidth || 0;

  // Upload metrics
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [totalUploads, uploadsToday, uploadsThisMonth, storageAgg, expiringUploadsCount, activeSub] = await Promise.all([
    prisma.upload.count({ where: { userId } }),
    prisma.upload.count({ where: { userId, createdAt: { gte: startOfToday } } }),
    prisma.upload.count({ where: { userId, createdAt: { gte: startOfMonth } } }),
    prisma.upload.aggregate({ where: { userId }, _sum: { size: true } }),
    prisma.upload.count({ where: { userId, expiresAt: { not: null } } }),
    prisma.subscription.findFirst({ where: { userId, status: "ACTIVE" }, include: { plan: true } })
  ]);

  const storageUsed = storageAgg._sum.size || 0;
  const maxStorage = activeSub?.plan?.maxStorageMB ? activeSub.plan.maxStorageMB * 1024 * 1024 : 0;
  const storageRemaining = maxStorage > 0 ? Math.max(0, maxStorage - storageUsed) : null;

  // Daily activity
  const recentEvents = await prisma.analyticsEvent.findMany({
    where: { 
      userId,
      createdAt: { gte: rangeDate }
    },
    select: {
      eventType: true,
      bandwidth: true,
      createdAt: true,
      country: true,
      browser: true,
      referrer: true,
      upload: {
        select: { originalName: true, id: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  // Groupings in memory
  const dailyActivity: Record<string, { views: number, downloads: number, bandwidth: number }> = {};
  const countries: Record<string, number> = {};
  const browsers: Record<string, number> = {};
  const referrers: Record<string, number> = {};
  const topImages: Record<string, { name: string, views: number, downloads: number, value: number }> = {};

  recentEvents.forEach(event => {
    const date = event.createdAt.toISOString().split('T')[0];
    if (!dailyActivity[date]) dailyActivity[date] = { views: 0, downloads: 0, bandwidth: 0 };
    
    if (event.eventType === "VIEW") dailyActivity[date].views++;
    if (event.eventType === "DOWNLOAD") dailyActivity[date].downloads++;
    dailyActivity[date].bandwidth += event.bandwidth;

    if (event.country && event.country !== "Unknown") {
      countries[event.country] = (countries[event.country] || 0) + 1;
    }
    if (event.browser && event.browser !== "Unknown") {
      browsers[event.browser] = (browsers[event.browser] || 0) + 1;
    }
    if (event.referrer && event.referrer !== "Direct") {
      try {
        const refHost = event.referrer.startsWith('http') ? new URL(event.referrer).hostname : event.referrer;
        referrers[refHost] = (referrers[refHost] || 0) + 1;
      } catch(e) {
        referrers[event.referrer] = (referrers[event.referrer] || 0) + 1;
      }
    }

    if (event.upload) {
      if (!topImages[event.upload.id]) {
        topImages[event.upload.id] = { name: event.upload.originalName, views: 0, downloads: 0, value: 0 };
      }
      if (event.eventType === "VIEW") topImages[event.upload.id].views++;
      if (event.eventType === "DOWNLOAD") topImages[event.upload.id].downloads++;
      topImages[event.upload.id].value = topImages[event.upload.id].views + topImages[event.upload.id].downloads;
    }
  });

  const formatTopList = (obj: Record<string, number>) => 
    Object.entries(obj).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);

  const formatTopImages = (obj: Record<string, any>) => 
    Object.values(obj).sort((a: any, b: any) => b.value - a.value).slice(0, 10);

  return NextResponse.json({
    totals: {
      views: totalViews,
      downloads: totalDownloads,
      bandwidth: totalBandwidth,
      uploads: totalUploads,
      uploadsToday,
      uploadsThisMonth,
      storageUsed,
      storageRemaining,
      maxStorage,
      expiringImages: expiringUploadsCount
    },
    chartData: Object.entries(dailyActivity).map(([date, data]) => ({ date, ...data })),
    topCountries: formatTopList(countries),
    topBrowsers: formatTopList(browsers),
    topReferrers: formatTopList(referrers),
    topImages: formatTopImages(topImages)
  });
});
