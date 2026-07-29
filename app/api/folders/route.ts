import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedUser } from "@/lib/api-utils";
import { z } from "zod";

export const GET = withAuth(async (request: Request, user: AuthenticatedUser) => {
  const folders = await prisma.folder.findMany({
    where: { userId: user.id },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      userId: true,
      visibility: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
      // exclude password
    }
  });

  return NextResponse.json(folders);
});

const postSchema = z.object({
  name: z.string().min(1, "Folder name is required").trim()
});

export const POST = withAuth(async (request: Request, user: AuthenticatedUser) => {
  const body = await request.json();
  const { name } = postSchema.parse(body);

  try {
    const folder = await prisma.folder.create({
      data: {
        name,
        userId: user.id
      }
    });
    return NextResponse.json(folder);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "A folder with this name already exists" }, { status: 400 });
    }
    throw error;
  }
});
