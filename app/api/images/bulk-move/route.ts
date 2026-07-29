import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedUser } from "@/lib/api-utils";
import { z } from "zod";

const bulkMoveSchema = z.object({
  ids: z.array(z.string()).min(1),
  folderId: z.string().nullable().optional()
});

export const POST = withAuth(async (request: Request, user: AuthenticatedUser) => {
  const body = await request.json();
  const { ids, folderId } = bulkMoveSchema.parse(body);

  // Verify folder ownership if folderId is provided
  if (folderId) {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId, userId: user.id }
    });
    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }
  }

  const result = await prisma.upload.updateMany({
    where: {
      id: { in: ids },
      userId: user.id
    },
    data: {
      folderId: folderId || null
    }
  });

  return NextResponse.json({ success: true, count: result.count });
});
