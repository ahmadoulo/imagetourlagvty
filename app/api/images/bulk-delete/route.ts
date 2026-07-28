import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ids } = await request.json();
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const uploads = await prisma.upload.findMany({
      where: {
        id: { in: ids },
        userId: session.user.id
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
        await deleteFromS3(s3Bucket, upload.filename).catch(e => console.error("S3 delete error:", e));
        
        // Delete thumbnails if not SVG
        if (upload.mimeType !== "image/svg+xml") {
          await deleteFromS3(thumbBucket, `${upload.id}-large.webp`).catch(e => console.error("S3 delete error:", e));
          await deleteFromS3(thumbBucket, `${upload.id}-medium.webp`).catch(e => console.error("S3 delete error:", e));
          await deleteFromS3(thumbBucket, `${upload.id}-small.webp`).catch(e => console.error("S3 delete error:", e));
        }
      })
    );

    const result = await prisma.upload.deleteMany({
      where: {
        id: { in: uploads.map(u => u.id) },
        userId: session.user.id
      }
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("Error in bulk delete:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
