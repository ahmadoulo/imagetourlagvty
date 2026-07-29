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

    let deletedCount = 0;
    let failedCount = 0;

    for (const upload of expiredUploads) {
      try {
        await deleteFromS3(s3Bucket, upload.filename);
        if (upload.mimeType !== "image/svg+xml") {
          await deleteFromS3(thumbBucket, `${upload.id}-large.webp`);
          await deleteFromS3(thumbBucket, `${upload.id}-medium.webp`);
          await deleteFromS3(thumbBucket, `${upload.id}-small.webp`);
        }
        
        // Delete from DB (cascade will handle share links and analytics)
        await prisma.upload.delete({
          where: { id: upload.id }
        });

        // Audit Log
        if (upload.userId) {
          await prisma.auditLog.create({
            data: {
              userId: upload.userId,
              action: "AUTO_DELETE_EXPIRED",
              targetId: upload.id,
              targetType: "UPLOAD",
              metadata: JSON.stringify({ filename: upload.originalName, expiresAt: upload.expiresAt }),
            }
          });
        }
        deletedCount++;
      } catch (err) {
        logger.error(`Failed to completely clean up upload ${upload.id}`, err);
        failedCount++;
      }
    }

    logger.info(`Cron cleanup: deleted ${deletedCount}, failed ${failedCount}`);
    return NextResponse.json({ success: true, count: deletedCount, failed: failedCount });

  } catch (error) {
    logger.error("Error in cron cleanup", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
