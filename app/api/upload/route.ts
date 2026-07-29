import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/s3";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { logger } from "@/lib/logger";
import { getSettings } from "@/lib/settings";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
  "image/heic",
];

export async function POST(req: NextRequest) {
  let userId: string | undefined;
  try {
    // 1. Check Authentication (Optional for Guests, but they have limits)
    // For now we allow everyone, but we'll add limit logic later.
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    userId = session?.user?.id;

    // 2. Parse FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folderId = formData.get("folderId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Fetch Plan Limits
    let plan = null;
    if (userId) {
      const { ensureDefaultSubscription } = await import("@/lib/subscription");
      const activeSub = await ensureDefaultSubscription(userId);
      plan = activeSub?.plan;
    }
    
    // Default fallback limits if no plan exists (e.g. Guests)
    const maxFileSizeMB = plan?.maxFileSizeMB ?? 10;
    const maxStorageMB = plan?.maxStorageMB ?? 1024;
    const maxUploadsPerMonth = plan?.maxUploadsPerMonth ?? 0;
    const retentionDays = plan?.retentionDays ?? 30; // Guests default to 30 days retention

    // Validate File Size
    if (maxFileSizeMB > 0 && file.size > maxFileSizeMB * 1024 * 1024) {
      return NextResponse.json({ error: `File exceeds plan limit of ${maxFileSizeMB}MB` }, { status: 400 });
    }

    // Validate Total Storage & Monthly Limits (for authenticated users only)
    if (userId) {
      const userUsage = await prisma.upload.aggregate({
        where: { userId },
        _sum: { size: true },
        _count: { id: true }
      });
      
      const currentStorage = userUsage._sum.size || 0;
      if (maxStorageMB > 0 && (currentStorage + file.size) > maxStorageMB * 1024 * 1024) {
        return NextResponse.json({ error: `Storage limit of ${maxStorageMB}MB exceeded. Upgrade your plan.` }, { status: 403 });
      }

      if (maxUploadsPerMonth > 0) {
        // Find uploads in current month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0,0,0,0);
        
        const monthlyUploads = await prisma.upload.count({
          where: { 
            userId,
            createdAt: { gte: startOfMonth }
          }
        });
        
        if (monthlyUploads >= maxUploadsPerMonth) {
          return NextResponse.json({ error: `Monthly upload limit of ${maxUploadsPerMonth} exceeded. Upgrade your plan.` }, { status: 403 });
        }
      }
    } else {
      // Guest logic
      const settings = await getSettings();
      const allowGuestUploads = settings["ALLOW_GUEST_UPLOADS"] !== false;
      const maxGuestUploadSizeMB = Number(settings["MAX_GUEST_UPLOAD_SIZE_MB"] || 5);

      if (!allowGuestUploads) {
        return NextResponse.json({ error: "Guest uploads are disabled. Please sign in." }, { status: 403 });
      }

      if (file.size > maxGuestUploadSizeMB * 1024 * 1024) {
        return NextResponse.json({ error: `Guests are limited to ${maxGuestUploadSizeMB}MB. Please sign in for larger limits.` }, { status: 400 });
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Image Processing
    let width: number | undefined;
    let height: number | undefined;
    let processedBuffer = buffer;
    
    // We don't process SVGs with sharp usually to preserve them as vectors
    if (file.type !== "image/svg+xml") {
      const image = sharp(buffer);
      const metadata = await image.metadata();
      
      width = metadata.width;
      height = metadata.height;
      
      // Optimize image (strip EXIF, auto-orient, optimize)
      processedBuffer = await image
        .rotate() // Auto orient based on EXIF
        .toBuffer();
    }

    // 5. Generate UUID and file extension
    const id = crypto.randomUUID();
    const originalName = file.name;
    const extension = originalName.split('.').pop() || "jpg";
    const filename = `${id}.${extension}`;

    // 6. Upload Original to MinIO
    const s3Bucket = process.env.S3_BUCKET_IMAGES || "images";
    const publicUrl = await uploadToS3(s3Bucket, filename, processedBuffer, file.type);

    // 7. Generate and Upload Thumbnails
    if (file.type !== "image/svg+xml") {
      const thumbBucket = process.env.S3_BUCKET_THUMBNAILS || "thumbnails";
      
      const variants = [
        { suffix: "-large", width: 1200 },
        { suffix: "-medium", width: 800 },
        { suffix: "-small", width: 300 },
      ];

      await Promise.all(
        variants.map(async (variant) => {
          // If original is smaller than the variant width, we just don't enlarge it
          const thumbBuffer = await sharp(processedBuffer)
            .resize({ width: variant.width, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();
            
          return uploadToS3(thumbBucket, `${id}${variant.suffix}.webp`, thumbBuffer, "image/webp");
        })
      );
    }

    // 8. Calculate Retention
    let expiresAt = null;
    let retentionPolicy = "UNLIMITED";
    if (retentionDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + retentionDays);
      retentionPolicy = `${retentionDays}_DAYS`;
    }

    // 9. Save to Database
    const uploadRecord = await prisma.upload.create({
      data: {
        id,
        userId: userId || null,
        folderId: folderId || null,
        originalName,
        filename,
        extension,
        mimeType: file.type,
        size: processedBuffer.length,
        url: publicUrl,
        width,
        height,
        expiresAt,
        retentionPolicy,
        status: "ACTIVE"
      }
    });

    // 9. Return success
    logger.info("File uploaded successfully", { userId, uploadId: id, size: processedBuffer.length, mimeType: file.type });
    return NextResponse.json({
      success: true,
      upload: uploadRecord
    });

  } catch (error) {
    logger.error("Upload error", error, { userId });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
