import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { deleteFromS3 } from "@/lib/s3";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const upload = await prisma.upload.findUnique({
      where: { id },
    });

    if (!upload) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check if the user is the owner or an admin
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (upload.userId !== session.user.id && user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete from MinIO
    const s3Bucket = process.env.S3_BUCKET_IMAGES || "images";
    await deleteFromS3(s3Bucket, upload.filename);

    if (upload.mimeType !== "image/svg+xml") {
      const thumbBucket = process.env.S3_BUCKET_THUMBNAILS || "thumbnails";
      await deleteFromS3(thumbBucket, `${upload.id}.webp`);
    }

    // Delete from DB
    await prisma.upload.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
