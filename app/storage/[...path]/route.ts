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
      
      // Parse User-Agent (simple approach, we can use UAParser later if needed)
      const userAgent = req.headers.get("user-agent") || "Unknown";
      let browser = "Unknown";
      if (userAgent.includes("Chrome")) browser = "Chrome";
      else if (userAgent.includes("Firefox")) browser = "Firefox";
      else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "Safari";
      else if (userAgent.includes("Edge")) browser = "Edge";
      
      const country = req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry") || "Unknown";
      const referrer = req.headers.get("referer") || "Direct";

      if (uploadRecord) {
        // Track View Event asynchronously
        prisma.analyticsEvent.create({
          data: {
            uploadId: uploadId,
            userId: uploadRecord.userId,
            eventType: "VIEW",
            bandwidth: processedBuffer.length,
            country: country,
            browser: browser,
            referrer: referrer
          }
        }).catch(console.error);

        // Increment total views on the upload itself
        prisma.upload.update({
          where: { id: uploadId },
          data: { downloads: { increment: 1 } } // Technically views/downloads overlap here
        }).catch(console.error);
      }
      
      return new NextResponse(processedBuffer as any, { status: 200, headers });
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
