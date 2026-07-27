import { NextRequest, NextResponse } from "next/server";
import { s3Client } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";

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

    // Convert Web ReadableStream to response
    const stream = response.Body.transformToWebStream();

    const headers = new Headers();
    if (response.ContentType) {
      headers.set("Content-Type", response.ContentType);
    }
    if (response.ContentLength) {
      headers.set("Content-Length", response.ContentLength.toString());
    }
    
    // Add cache headers so browsers cache the image
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new NextResponse(stream, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Error proxying image from S3:", error);
    if (error.name === "NoSuchKey") {
      return new NextResponse("Image not found", { status: 404 });
    }
    return new NextResponse("Internal server error", { status: 500 });
  }
}
