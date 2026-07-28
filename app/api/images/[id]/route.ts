import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    const updateData: any = {};
    if (body.name !== undefined) updateData.originalName = body.name;
    if (body.isFavorite !== undefined) updateData.isFavorite = body.isFavorite;
    if (body.isPinned !== undefined) updateData.isPinned = body.isPinned;
    if (body.folderId !== undefined) updateData.folderId = body.folderId === "null" ? null : body.folderId;
    if (body.visibility !== undefined) updateData.visibility = body.visibility;
    if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt;
    if (body.maxDownloads !== undefined) updateData.maxDownloads = body.maxDownloads;
    
    if (body.password !== undefined) {
      if (body.password === null || body.password === "") {
        updateData.password = null;
      } else {
        updateData.password = await bcrypt.hash(body.password, 10);
      }
    }

    const updated = await prisma.upload.update({
      where: { 
        id,
        userId: session.user.id // Ensure they own it
      },
      data: updateData
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating image:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const image = await prisma.upload.findFirst({
      where: {
        id,
        userId: session.user.id
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
          await deleteFromS3(thumbBucket, `${image.id}-large.webp`).catch(e => console.error("Thumb delete error:", e));
          await deleteFromS3(thumbBucket, `${image.id}-medium.webp`).catch(e => console.error("Thumb delete error:", e));
          await deleteFromS3(thumbBucket, `${image.id}-small.webp`).catch(e => console.error("Thumb delete error:", e));
        }
      } catch (s3Error) {
        console.error("Failed to delete from S3, continuing with DB deletion:", s3Error);
      }
    }

    await prisma.upload.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
