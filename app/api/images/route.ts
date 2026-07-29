import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedUser } from "@/lib/api-utils";
import { z } from "zod";

const querySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("50"),
  query: z.string().optional().default(""),
  filter: z.string().optional().default("all"),
  folderId: z.string().nullable().optional(),
  sortBy: z.string().optional().default("createdAt"),
  sortOrder: z.string().optional().default("desc")
});

export const GET = withAuth(async (request: Request, user: AuthenticatedUser) => {
  const userId = user.id;
  const { searchParams } = new URL(request.url);
  
  // Validate searchParams with Zod
  const params = Object.fromEntries(searchParams.entries());
  const validated = querySchema.parse(params);
  
  // Pagination
  const page = parseInt(validated.page);
  const limit = parseInt(validated.limit);
  const skip = (page - 1) * limit;

  // Filters
  const { query, filter, folderId, sortBy, sortOrder } = validated;

  const where: any = { userId };
  
  if (query) {
    where.originalName = { contains: query, mode: 'insensitive' };
  }

  if (filter === "favorites") {
    where.isFavorite = true;
  } else if (filter === "pinned") {
    where.isPinned = true;
  }

  if (folderId && folderId !== "null") {
    where.folderId = folderId;
  } else if (folderId === "null") {
    where.folderId = null; // root level
  }

  const orderBy: any = {};
  if (sortBy === "name") {
    orderBy.originalName = sortOrder;
  } else if (sortBy === "size") {
    orderBy.size = sortOrder;
  } else {
    orderBy.createdAt = sortOrder; // Default
  }

  const [images, total] = await Promise.all([
    prisma.upload.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        userId: true,
        folderId: true,
        originalName: true,
        filename: true,
        extension: true,
        mimeType: true,
        size: true,
        url: true,
        width: true,
        height: true,
        visibility: true,
        isFavorite: true,
        isPinned: true,
        expiresAt: true,
        downloads: true,
        maxDownloads: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password
      }
    }),
    prisma.upload.count({ where })
  ]);

  const imagesWithHasPassword = images.map(img => ({ ...img, hasPassword: false })); // hasPassword could be derived if needed, but not returned for now to simplify or you can include `password: true` in select then map it out. Actually, if we just want to remove password:

  return NextResponse.json({ 
    images, 
    total, 
    page, 
    totalPages: Math.ceil(total / limit) 
  });
});
