import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedUser } from "@/lib/api-utils";
import { z } from "zod";
import { logger } from "@/lib/logger";

const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1)
});

export const POST = withAuth(async (request: Request, user: AuthenticatedUser) => {
  const body = await request.json();
  const { ids } = bulkDeleteSchema.parse(body);

  const uploads = await prisma.upload.findMany({
    where: {
      id: { in: ids },
      userId: user.id
    }
  });

  if (uploads.length === 0) {
    return NextResponse.json({ success: true, count: 0 });
  }

  // Delete from S3
  const { deleteFromS3 } = await import("@/lib/s3");
  const s3Bucket = process.env.S3_BUCKET_IMAGES || "images";
  const thumbBucket = process.env.S3_BUCKET_THUMBNAILS || "thumbnails";

  await Promise.all(
    uploads.map(async (upload) => {
      // Delete original
      await deleteFromS3(s3Bucket, upload.filename).catch(e => logger.error("S3 delete error:", e));
      
      // Delete thumbnails if not SVG
      if (upload.mimeType !== "image/svg+xml") {
        await deleteFromS3(thumbBucket, `${upload.id}-large.webp`).catch(e => logger.error("S3 delete error:", e));
        await deleteFromS3(thumbBucket, `${upload.id}-medium.webp`).catch(e => logger.error("S3 delete error:", e));
        await deleteFromS3(thumbBucket, `${upload.id}-small.webp`).catch(e => logger.error("S3 delete error:", e));
      }
    })
  );

  const result = await prisma.upload.deleteMany({
    where: {
      id: { in: uploads.map(u => u.id) },
      userId: user.id
    }
  });

  return NextResponse.json({ success: true, count: result.count });
});
