import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { withAuth, AuthenticatedUser } from "@/lib/api-utils";
import { z } from "zod";

export const GET = withAuth(async (request: Request, user: AuthenticatedUser, params: { id: string }) => {
  const { id } = await params;
  
  const folder = await prisma.folder.findUnique({
    where: { 
      id,
      userId: user.id
    },
    select: {
      id: true,
      name: true,
      description: true,
      visibility: true,
      expiresAt: true,
      password: true
    }
  });
  
  if (!folder) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const hasPassword = !!folder.password;
  const { password, ...folderData } = folder;

  return NextResponse.json({ ...folderData, hasPassword });
});

const patchSchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  visibility: z.enum(["PRIVATE", "PUBLIC", "PASSWORD_PROTECTED"]).optional(),
  expiresAt: z.string().nullable().optional(),
  password: z.string().nullable().optional()
});

export const PATCH = withAuth(async (request: Request, user: AuthenticatedUser, params: { id: string }) => {
  const { id } = await params;
  const body = await request.json();
  const validated = patchSchema.parse(body);
  
  const updateData: any = {};
  if (validated.name !== undefined) updateData.name = validated.name;
  if (validated.description !== undefined) updateData.description = validated.description;
  if (validated.visibility !== undefined) updateData.visibility = validated.visibility;
  if (validated.expiresAt !== undefined) updateData.expiresAt = validated.expiresAt;
  
  if (validated.password !== undefined) {
    if (validated.password === null || validated.password === "") {
      updateData.password = null;
    } else {
      updateData.password = await bcrypt.hash(validated.password, 10);
    }
  }

  const updated = await prisma.folder.update({
    where: { 
      id,
      userId: user.id
    },
    data: updateData
  });

  return NextResponse.json(updated);
});

export const DELETE = withAuth(async (request: Request, user: AuthenticatedUser, params: { id: string }) => {
  const { id } = await params;
  await prisma.folder.delete({
    where: { 
      id,
      userId: user.id
    }
  });

  return NextResponse.json({ success: true });
});
