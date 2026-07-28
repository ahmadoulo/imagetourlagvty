import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { uploads: true, folders: true } }
    }
  });

  // Generate CSV
  const header = ["ID", "Name", "Email", "Role", "Status", "Email Verified", "Uploads", "Folders", "Joined At"];
  const rows = users.map(u => [
    u.id,
    `"${u.name.replace(/"/g, '""')}"`,
    u.email,
    u.role,
    u.status,
    u.emailVerified ? "Yes" : "No",
    u._count.uploads,
    u._count.folders,
    u.createdAt.toISOString()
  ]);

  const csvContent = [header.join(","), ...rows.map(r => r.join(","))].join("\n");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="users-export.csv"'
    }
  });
}
