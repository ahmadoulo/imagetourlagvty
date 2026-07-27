import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/s3";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import crypto from "crypto";
import { auth } from "@/lib/auth";

const MAX_UPLOAD_SIZE = 50 * 1024 * 1024; // 50MB
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
  try {
    // 1. Check Authentication (Optional for Guests, but they have limits)
    // For now we allow everyone, but we'll add limit logic later.
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    const userId = session?.user?.id;

    // 2. Parse FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 3. Validation
    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json({ error: "File exceeds 50MB limit" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
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
        .withMetadata(false) // Strip EXIF for privacy
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

    // 7. Generate and Upload Thumbnail
    if (file.type !== "image/svg+xml") {
      const thumbBucket = process.env.S3_BUCKET_THUMBNAILS || "thumbnails";
      const thumbBuffer = await sharp(processedBuffer)
        .resize({ width: 300, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      
      await uploadToS3(thumbBucket, `${id}.webp`, thumbBuffer, "image/webp");
    }

    // 8. Save to Database
    const uploadRecord = await prisma.upload.create({
      data: {
        id,
        userId: userId || null,
        originalName,
        filename,
        extension,
        mimeType: file.type,
        size: processedBuffer.length,
        url: publicUrl,
        width,
        height,
      }
    });

    // 9. Return success
    return NextResponse.json({
      success: true,
      upload: uploadRecord
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
