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

    const { ids } = await request.json();
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // First fetch the records to verify ownership and get keys (for actual S3 deletion if needed in the future)
    // Here we just delete from database. The actual S3 deletion should be handled if required.
    const result = await prisma.upload.deleteMany({
      where: {
        id: { in: ids },
        userId: session.user.id
      }
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("Error in bulk delete:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
