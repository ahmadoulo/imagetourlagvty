import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    
    // Allow updating name, favorite, pin status, and folder
    const updateData: any = {};
    if (body.name !== undefined) updateData.originalName = body.name;
    if (body.isFavorite !== undefined) updateData.isFavorite = body.isFavorite;
    if (body.isPinned !== undefined) updateData.isPinned = body.isPinned;
    if (body.folderId !== undefined) updateData.folderId = body.folderId === "null" ? null : body.folderId;

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
