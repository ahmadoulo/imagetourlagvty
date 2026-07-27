import { NextRequest, NextResponse } from "next/server";
import { s3Client } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { parseImageParams, processImage } from "@/lib/image-processing";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    if (!path || path.length < 2) {
      return new NextResponse("Invalid path", { status: 400 });
    }

    const bucket = path[0];
    const key = path.slice(1).join('/');

    // 1. Access Control via Database
    // Extract base ID from filename (e.g. 123-large.webp -> 123)
    let uploadId = key.split('.')[0];
    uploadId = uploadId.replace(/-large|-medium|-small/, '');
    
    // We only enforce if we can find the record (thumbnails might have different ids, but base is same)
    const uploadRecord = await prisma.upload.findUnique({
      where: { id: uploadId }
    });

    if (uploadRecord) {
      // Check Expiration
      if (uploadRecord.expiresAt && uploadRecord.expiresAt < new Date()) {
        return new NextResponse("Link expired", { status: 410 });
      }

      // Check Downloads limit
      if (uploadRecord.maxDownloads && uploadRecord.downloads >= uploadRecord.maxDownloads) {
        return new NextResponse("Download limit reached", { status: 410 });
      }

      // Check Privacy
      if (uploadRecord.visibility === 'PRIVATE') {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session || session.user.id !== uploadRecord.userId) {
          return new NextResponse("Unauthorized", { status: 403 });
        }
      }
      
      // We don't check password here for direct image links because browsers can't prompt for it in <img> tags.
      // Password protection is enforced at the Gallery/Collection page level.

      // Increment views/downloads asynchronously
      prisma.upload.update({
        where: { id: uploadId },
        data: { downloads: { increment: 1 } }
      }).catch(console.error);
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return new NextResponse("Image not found", { status: 404 });
    }

    const searchParams = req.nextUrl.searchParams;
    const processingOptions = parseImageParams(searchParams);

    const headers = new Headers();
    // Cache transformed images heavily on CDN, immutable cache for originals
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    // Fast path: No transformations requested, just stream original S3 object directly
    if (!processingOptions) {
      if (response.ContentType) headers.set("Content-Type", response.ContentType);
      if (response.ContentLength) headers.set("Content-Length", response.ContentLength.toString());
      
      const stream = response.Body.transformToWebStream();
      return new NextResponse(stream, { status: 200, headers });
    }

    // Processing Path: Load into memory, transform, then return
    try {
      const arrayBuffer = await response.Body.transformToByteArray();
      const buffer = Buffer.from(arrayBuffer);
      
      const { buffer: processedBuffer, contentType } = await processImage(buffer, processingOptions);
      
      headers.set("Content-Type", contentType);
      headers.set("Content-Length", processedBuffer.length.toString());
      
      return new NextResponse(processedBuffer, { status: 200, headers });
    } catch (processError) {
      console.error("Error processing image on the fly:", processError);
      // Fallback to original image if processing fails
      if (response.ContentType) headers.set("Content-Type", response.ContentType);
      return new NextResponse(response.Body.transformToWebStream(), { status: 200, headers });
    }
  } catch (error: any) {
    console.error("Error proxying image from S3:", error);
    if (error.name === "NoSuchKey") {
      return new NextResponse("Image not found", { status: 404 });
    }
    return new NextResponse("Internal server error", { status: 500 });
  }
}
