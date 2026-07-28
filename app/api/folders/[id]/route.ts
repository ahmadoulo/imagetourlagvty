import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(
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
    const folder = await prisma.folder.findUnique({
      where: { 
        id,
        userId: session.user.id
      },
      select: {
        id: true,
        name: true,
        description: true,
        visibility: true,
        expiresAt: true,
        // we intentionally omit password hash, but we can return boolean hasPassword
      }
    });
    
    if (!folder) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Let's also figure out if it has a password by querying again or just checking if password exists
    const fullFolder = await prisma.folder.findUnique({ where: { id }});
    const hasPassword = !!fullFolder?.password;

    return NextResponse.json({ ...folder, hasPassword });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.visibility !== undefined) updateData.visibility = body.visibility;
    if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt;
    
    if (body.password !== undefined) {
      if (body.password === null || body.password === "") {
        updateData.password = null;
      } else {
        updateData.password = await bcrypt.hash(body.password, 10);
      }
    }

    const updated = await prisma.folder.update({
      where: { 
        id,
        userId: session.user.id
      },
      data: updateData
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating folder:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
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
    await prisma.folder.delete({
      where: { 
        id,
        userId: session.user.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting folder:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
