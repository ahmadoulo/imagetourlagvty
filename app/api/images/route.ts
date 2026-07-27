import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Filters
    const query = searchParams.get("query") || "";
    const filter = searchParams.get("filter") || "all"; // all, favorites, pinned
    const folderId = searchParams.get("folderId");
    const sortBy = searchParams.get("sortBy") || "createdAt"; // createdAt, size, name
    const sortOrder = searchParams.get("sortOrder") || "desc";

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
      }),
      prisma.upload.count({ where })
    ]);

    return NextResponse.json({ 
      images, 
      total, 
      page, 
      totalPages: Math.ceil(total / limit) 
    });
    
  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
