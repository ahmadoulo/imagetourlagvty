import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFromS3 } from "@/lib/s3";
import { withAuth, AuthenticatedUser } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

export const DELETE = withAuth(async (req: Request, user: AuthenticatedUser, params: { id: string }) => {
  const { id } = await params;
  
  const upload = await prisma.upload.findUnique({
    where: { id },
  });

  if (!upload) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Check if the user is the owner or an admin
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (upload.userId !== user.id && dbUser?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete from MinIO
  const s3Bucket = process.env.S3_BUCKET_IMAGES || "images";
  await deleteFromS3(s3Bucket, upload.filename).catch(e => logger.error("MinIO delete error:", e));

  if (upload.mimeType !== "image/svg+xml") {
    const thumbBucket = process.env.S3_BUCKET_THUMBNAILS || "thumbnails";
    await deleteFromS3(thumbBucket, `${upload.id}.webp`).catch(e => logger.error("MinIO delete error:", e));
  }

  // Delete from DB
  await prisma.upload.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
});
