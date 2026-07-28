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

    const { ids, folderId } = await request.json();
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Verify folder ownership if folderId is provided
    if (folderId) {
      const folder = await prisma.folder.findUnique({
        where: { id: folderId, userId: session.user.id }
      });
      if (!folder) {
        return NextResponse.json({ error: "Folder not found" }, { status: 404 });
      }
    }

    const result = await prisma.upload.updateMany({
      where: {
        id: { in: ids },
        userId: session.user.id
      },
      data: {
        folderId: folderId || null
      }
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("Error in bulk move:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
