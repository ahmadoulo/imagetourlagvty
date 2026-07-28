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
  if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden");
  }

  return user; // Return the full user object from DB
}

export async function deleteUser(formData: FormData) {
  const currentUser = await requireAdmin();
  const userId = formData.get("userId") as string;
  if (!userId) throw new Error("User ID required");

  // CRITICAL SAFEGUARD: A Super Admin cannot delete themselves
  if (userId === currentUser.id) {
    throw new Error("You cannot delete your own account.");
  }

  // Check if target is a SUPER_ADMIN
  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (targetUser?.role === "SUPER_ADMIN") {
    const superAdminCount = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
    if (superAdminCount <= 1) {
      throw new Error("Cannot delete the only remaining Super Admin.");
    }
  }

  // Since we set up Cascade delete for Uploads and Folders in Phase 2,
  // deleting the user here will automatically delete all their uploads in the DB.
  // Note: MinIO S3 orphan files will be caught by the orphaned cleanup script or cron.
  await prisma.user.delete({
    where: { id: userId }
  });

  revalidatePath("/admin/users");
}

export async function changeUserRole(formData: FormData) {
  const currentUser = await requireAdmin();
  const userId = formData.get("userId") as string;
  const currentRole = formData.get("currentRole") as string;
  
  if (!userId) throw new Error("User ID required");

  const newRole = currentRole === "SUPER_ADMIN" ? "USER" : (currentRole === "ADMIN" ? "USER" : "ADMIN");

  // CRITICAL SAFEGUARD: Self-demotion checks
  if (userId === currentUser.id && currentRole === "SUPER_ADMIN") {
    const superAdminCount = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
    if (superAdminCount <= 1) {
      throw new Error("You are the only remaining Super Admin. You cannot demote yourself.");
    }
    // If > 1, the action is allowed (UI handles confirmation dialog)
  }

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

export async function changeUserStatus(formData: FormData) {
  const currentUser = await requireAdmin();
  const userId = formData.get("userId") as string;
  const newStatus = formData.get("status") as "ACTIVE" | "SUSPENDED" | "BANNED";
  
  if (!userId || !newStatus) throw new Error("Invalid parameters");

  // CRITICAL SAFEGUARD: A Super Admin cannot change their own status to anything other than ACTIVE
  if (userId === currentUser.id && newStatus !== "ACTIVE") {
    throw new Error("You cannot ban or suspend your own account.");
  }

  // Check if target is a SUPER_ADMIN
  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (targetUser?.role === "SUPER_ADMIN" && newStatus !== "ACTIVE") {
    const superAdminCount = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
    if (superAdminCount <= 1) {
      throw new Error("Cannot ban or suspend the only remaining Super Admin.");
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: newStatus }
  });

  await logAdminAction("CHANGE_USER_STATUS", userId, "User", { status: newStatus });

  revalidatePath("/admin/users");
}

export async function verifyUserEmail(formData: FormData) {
  await requireAdmin();
  const userId = formData.get("userId") as string;
  if (!userId) throw new Error("User ID required");

  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true }
  });

  revalidatePath("/admin/users");
}

export async function resetUserPassword(formData: FormData) {
  await requireAdmin();
  const userId = formData.get("userId") as string;
  if (!userId) throw new Error("User ID required");

  const newPassword = Math.random().toString(36).slice(-10) + "A1!";
  const bcrypt = require("bcryptjs");
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const account = await prisma.account.findFirst({
    where: { userId, providerId: "credential" }
  });

  if (account) {
    await prisma.account.update({
      where: { id: account.id },
      data: { password: hashedPassword }
    });
  }

  return { success: true, newPassword };
}


export async function createPlan(formData: FormData) {
  await requireAdmin();
  const name = formData.get("name") as string;
  const price = parseFloat(formData.get("price") as string || "0");
  const maxStorageMB = parseInt(formData.get("maxStorageMB") as string || "1024");
  const maxBandwidthMB = parseInt(formData.get("maxBandwidthMB") as string || "10240");
  const maxFileSizeMB = parseInt(formData.get("maxFileSizeMB") as string || "10");
  
  await prisma.plan.create({
    data: { name, price, maxStorageMB, maxBandwidthMB, maxFileSizeMB }
  });
  revalidatePath("/admin/plans");
}

export async function deletePlan(formData: FormData) {
  await requireAdmin();
  const planId = formData.get("planId") as string;
  if (!planId) throw new Error("Plan ID required");

  await prisma.plan.delete({ where: { id: planId } });
  revalidatePath("/admin/plans");
}


export async function updateSetting(formData: FormData) {
  await requireAdmin();
  const key = formData.get("key") as string;
  const value = formData.get("value") as string;
  const type = formData.get("type") as string || "string";
  const description = formData.get("description") as string || "";

  if (!key) throw new Error("Key is required");

  await prisma.systemSetting.upsert({
    where: { key },
    update: { value, type, description },
    create: { key, value, type, description, id: key }
  });

  const { clearSettingsCache } = await import("@/lib/settings");
  await clearSettingsCache();

  revalidatePath("/admin/settings");
}


export async function logAdminAction(action: string, targetId?: string, targetType?: string, metadata?: object) {
  try {
    const { auth } = await import("@/lib/auth");
    const { headers } = await import("next/headers");
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (session?.user?.id) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action,
          targetId,
          targetType,
          metadata: metadata ? JSON.stringify(metadata) : null,
          ipAddress: "server-action"
        }
      });
    }
  } catch (error) {
    console.error("Failed to log admin action", error);
  }
}


export async function updatePlan(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const price = parseFloat(formData.get("price") as string);
  const maxStorageMB = parseInt(formData.get("maxStorageMB") as string);
  const maxBandwidthMB = parseInt(formData.get("maxBandwidthMB") as string);
  const maxFileSizeMB = parseInt(formData.get("maxFileSizeMB") as string);

  await prisma.plan.update({
    where: { id },
    data: { name, price, maxStorageMB, maxBandwidthMB, maxFileSizeMB }
  });

  await logAdminAction("UPDATE_PLAN", id, "Plan", { name });
  
  const { redirect } = await import("next/navigation");
  redirect("/admin/plans");
}

export async function deleteImage(formData: FormData) {
  await requireAdmin();
  const imageId = formData.get("imageId") as string;

  await prisma.upload.delete({
    where: { id: imageId }
  });

  await logAdminAction("DELETE_IMAGE", imageId, "Upload");
  
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/admin/images");
}


export async function createPlan(formData: FormData) {
  await requireAdmin();
  const name = formData.get("name") as string;
  const price = parseFloat(formData.get("price") as string);
  const maxStorageMB = parseInt(formData.get("maxStorageMB") as string);
  const maxBandwidthMB = parseInt(formData.get("maxBandwidthMB") as string);
  const maxFileSizeMB = parseInt(formData.get("maxFileSizeMB") as string);

  const plan = await prisma.plan.create({
    data: { name, price, maxStorageMB, maxBandwidthMB, maxFileSizeMB }
  });

  await logAdminAction("CREATE_PLAN", plan.id, "Plan", { name });
  
  const { redirect } = await import("next/navigation");
  redirect("/admin/plans");
}

export async function deletePlan(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;

  await prisma.plan.delete({
    where: { id }
  });

  await logAdminAction("DELETE_PLAN", id, "Plan");
  
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/admin/plans");
}

