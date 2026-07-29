import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const image = await prisma.upload.findUnique({
      where: { id }
    });

    if (!image) {
      return new NextResponse("Image not found", { status: 404 });
    }

    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    const isBot = /bot|crawler|spider|crawling|whatsapp|telegram|slack|discord/i.test(userAgent);

    if (!isBot) {
      await prisma.analyticsEvent.create({
        data: {
          uploadId: image.id,
          userId: image.userId, // owner of the image
          eventType: "DOWNLOAD",
          bandwidth: image.size,
          browser: userAgent.substring(0, 50),
          country: "Unknown", 
          referrer: headersList.get("referer") || "Direct"
        }
      });
      
      // Increment the total downloads counter on the upload itself for fast querying
      await prisma.upload.update({
        where: { id: image.id },
        data: { downloads: { increment: 1 } }
      });
    }

    // Redirect to the actual S3/MinIO URL
    return NextResponse.redirect(new URL(image.url, request.url));

  } catch (error) {
    console.error("Download tracking error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
