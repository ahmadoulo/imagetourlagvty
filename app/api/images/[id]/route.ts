import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { withAuth, AuthenticatedUser } from "@/lib/api-utils";
import { z } from "zod";
import { logger } from "@/lib/logger";

const patchSchema = z.object({
  name: z.string().optional(),
  isFavorite: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  folderId: z.string().nullable().optional(),
  visibility: z.enum(["PRIVATE", "PUBLIC", "PASSWORD_PROTECTED"]).optional(),
  expiresAt: z.string().nullable().optional(),
  maxDownloads: z.number().nullable().optional(),
  password: z.string().nullable().optional()
});

export const PATCH = withAuth(async (request: Request, user: AuthenticatedUser, params: { id: string }) => {
  const { id } = await params;
  const body = await request.json();
  const validated = patchSchema.parse(body);
  
  const updateData: any = {};
  if (validated.name !== undefined) updateData.originalName = validated.name;
  if (validated.isFavorite !== undefined) updateData.isFavorite = validated.isFavorite;
  if (validated.isPinned !== undefined) updateData.isPinned = validated.isPinned;
  if (validated.folderId !== undefined) updateData.folderId = validated.folderId === "null" ? null : validated.folderId;
  if (validated.visibility !== undefined) updateData.visibility = validated.visibility;
  if (validated.expiresAt !== undefined) updateData.expiresAt = validated.expiresAt;
  if (validated.maxDownloads !== undefined) updateData.maxDownloads = validated.maxDownloads;
  
  if (validated.password !== undefined) {
    if (validated.password === null || validated.password === "") {
      updateData.password = null;
    } else {
      updateData.password = await bcrypt.hash(validated.password, 10);
    }
  }

  const updated = await prisma.upload.update({
    where: { 
      id,
      userId: user.id // Ensure they own it
    },
    data: updateData
  });

  return NextResponse.json(updated);
});

export const DELETE = withAuth(async (req: Request, user: AuthenticatedUser, params: { id: string }) => {
  const { id } = await params;

  const image = await prisma.upload.findFirst({
    where: {
      id,
      userId: user.id
    }
  });

  if (!image) {
    return NextResponse.json({ error: "Image not found or unauthorized" }, { status: 404 });
  }

  const { deleteFromS3 } = await import("@/lib/s3");
  let bucket = process.env.S3_BUCKET_IMAGES || "images";
  let thumbBucket = process.env.S3_BUCKET_THUMBNAILS || "thumbnails";
  let key = image.filename || image.url.split('/').pop() || "";
  
  if (key) {
    try {
      await deleteFromS3(bucket, key);
      if (image.mimeType !== "image/svg+xml") {
        await deleteFromS3(thumbBucket, `${image.id}-large.webp`).catch(e => logger.error("Thumb delete error:", e));
        await deleteFromS3(thumbBucket, `${image.id}-medium.webp`).catch(e => logger.error("Thumb delete error:", e));
        await deleteFromS3(thumbBucket, `${image.id}-small.webp`).catch(e => logger.error("Thumb delete error:", e));
      }
    } catch (s3Error) {
      logger.error("Failed to delete from S3, continuing with DB deletion:", s3Error);
    }
  }

  await prisma.upload.delete({
    where: { id }
  });

  return NextResponse.json({ success: true });
});
