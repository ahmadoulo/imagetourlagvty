import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import archiver from "archiver";
import { s3Client } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export async function POST(req: NextRequest) {
  try {
    const { imageIds, collectionId, password } = await req.json();

    let uploadsToZip = [];

    // Option A: Download by Collection ID
    if (collectionId) {
      const collection = await prisma.folder.findUnique({
        where: { id: collectionId },
        include: { uploads: true }
      });

      if (!collection) return NextResponse.json({ error: "Collection not found" }, { status: 404 });
      
      // Basic access check
      if (collection.visibility === "PRIVATE") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      // Check expiration
      if (collection.expiresAt && collection.expiresAt < new Date()) {
        return NextResponse.json({ error: "Collection expired" }, { status: 410 });
      }

      uploadsToZip = collection.uploads;
    } 
    // Option B: Download specific images
    else if (imageIds && Array.isArray(imageIds)) {
      uploadsToZip = await prisma.upload.findMany({
        where: { id: { in: imageIds } }
      });
    }

    if (uploadsToZip.length === 0) {
      return NextResponse.json({ error: "No images found" }, { status: 404 });
    }

    if (uploadsToZip.length > 50) {
      return NextResponse.json({ error: "Cannot download more than 50 images at once" }, { status: 400 });
    }

    // Prepare Archiver
    const archive = archiver('zip', {
      zlib: { level: 5 } // Standard compression
    });

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    
    // Pipe archiver output to the TransformStream
    archive.on('data', (chunk) => writer.write(chunk));
    archive.on('end', () => writer.close());
    archive.on('error', (err) => {
      console.error("Archive error:", err);
      writer.abort(err);
    });

    // Start appending files to the zip in the background
    (async () => {
      const s3Bucket = process.env.S3_BUCKET_IMAGES || "images";
      for (const upload of uploadsToZip) {
        try {
          const command = new GetObjectCommand({
            Bucket: s3Bucket,
            Key: upload.filename,
          });
          const response = await s3Client.send(command);
          if (response.Body) {
            // Need to convert Web Stream to Node Stream for archiver
            const nodeStream = (response.Body as any).transformToString ? await (response.Body as any).transformToByteArray() : response.Body;
            archive.append(nodeStream as any, { name: upload.originalName });
            
            // Increment downloads
            await prisma.upload.update({
              where: { id: upload.id },
              data: { downloads: { increment: 1 } }
            });
          }
        } catch (e) {
          console.error(`Failed to fetch ${upload.filename} from S3`, e);
        }
      }
      archive.finalize();
    })();

    const headers = new Headers();
    headers.set("Content-Type", "application/zip");
    headers.set("Content-Disposition", `attachment; filename="images_${Date.now()}.zip"`);

    return new NextResponse(stream.readable, { headers });

  } catch (error) {
    console.error("Error creating zip:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
