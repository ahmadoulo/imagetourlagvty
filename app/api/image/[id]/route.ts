import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { s3Client } from "@/lib/s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function DELETE(
  req: NextRequest,
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

    // Find the image and ensure it belongs to the user
    const image = await prisma.upload.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found or unauthorized" }, { status: 404 });
    }

    // Extract bucket and key from the relative URL if we used the storage proxy
    // Our URLs are like /storage/images/filename.ext
    let bucket = process.env.S3_BUCKET || "images";
    let key = image.url.split('/').pop() || "";
    
    // Attempt to delete from S3
    if (key) {
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: bucket,
          Key: key
        }));
      } catch (s3Error) {
        console.error("Failed to delete from S3, continuing with DB deletion:", s3Error);
      }
    }

    // Delete from Database
    await prisma.upload.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
