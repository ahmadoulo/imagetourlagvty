import { NextRequest, NextResponse } from "next/server";
import { s3Client } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { parseImageParams, processImage } from "@/lib/image-processing";

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
