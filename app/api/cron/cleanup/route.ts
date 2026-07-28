import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFromS3 } from "@/lib/s3";
import { logger } from "@/lib/logger";

// This route should be protected in production using a secret key
// e.g. /api/cron/cleanup?key=YOUR_CRON_SECRET

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (process.env.CRON_SECRET && key !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Find expired uploads
    const expiredUploads = await prisma.upload.findMany({
      where: {
        expiresAt: {
          lt: now
        }
      }
    });

    if (expiredUploads.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: "No expired images found" });
    }

    const s3Bucket = process.env.S3_BUCKET_IMAGES || "images";
    const thumbBucket = process.env.S3_BUCKET_THUMBNAILS || "thumbnails";

    // Delete from S3
    await Promise.all(
      expiredUploads.map(async (upload) => {
        try {
          await deleteFromS3(s3Bucket, upload.filename);
          if (upload.mimeType !== "image/svg+xml") {
            await deleteFromS3(thumbBucket, `${upload.id}-large.webp`);
            await deleteFromS3(thumbBucket, `${upload.id}-medium.webp`);
            await deleteFromS3(thumbBucket, `${upload.id}-small.webp`);
          }
        } catch (s3Error) {
          logger.error(`Failed to delete S3 objects for expired upload ${upload.id}`, s3Error);
        }
      })
    );

    // Delete from DB
    const deleteResult = await prisma.upload.deleteMany({
      where: {
        id: { in: expiredUploads.map(u => u.id) }
      }
    });

    logger.info(`Cron cleanup: deleted ${deleteResult.count} expired images`);
    return NextResponse.json({ success: true, count: deleteResult.count });

  } catch (error) {
    logger.error("Error in cron cleanup", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
