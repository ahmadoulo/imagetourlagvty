"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  return session.user;
}

export async function deleteUser(formData: FormData) {
  await requireAdmin();
  const userId = formData.get("userId") as string;
  if (!userId) throw new Error("User ID required");

  // Since we set up Cascade delete for Uploads and Folders in Phase 2,
  // deleting the user here will automatically delete all their uploads in the DB.
  // Note: MinIO S3 orphan files will be caught by the orphaned cleanup script or cron.
  await prisma.user.delete({
    where: { id: userId }
  });

  revalidatePath("/admin/users");
}

export async function changeUserRole(formData: FormData) {
  await requireAdmin();
  const userId = formData.get("userId") as string;
  const currentRole = formData.get("currentRole") as string;
  
  if (!userId) throw new Error("User ID required");

  const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole }
  });

  revalidatePath("/admin/users");
}

export async function deleteImage(formData: FormData) {
  await requireAdmin();
  const imageId = formData.get("imageId") as string;
  if (!imageId) throw new Error("Image ID required");

  const image = await prisma.upload.findUnique({
    where: { id: imageId }
  });

  if (!image) throw new Error("Image not found");

  const { deleteFromS3 } = await import("@/lib/s3");
  let bucket = process.env.S3_BUCKET_IMAGES || "images";
  let thumbBucket = process.env.S3_BUCKET_THUMBNAILS || "thumbnails";
  let key = image.filename || image.url.split('/').pop() || "";
  
  if (key) {
    try {
      await deleteFromS3(bucket, key);
      if (image.mimeType !== "image/svg+xml") {
        await deleteFromS3(thumbBucket, `${image.id}-large.webp`).catch(() => {});
        await deleteFromS3(thumbBucket, `${image.id}-medium.webp`).catch(() => {});
        await deleteFromS3(thumbBucket, `${image.id}-small.webp`).catch(() => {});
      }
    } catch (e) {
      console.error("Admin S3 delete error", e);
    }
  }

  await prisma.upload.delete({
    where: { id: imageId }
  });

  revalidatePath("/admin/images");
}
