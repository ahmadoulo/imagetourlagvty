import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { password } = await request.json();

    const collection = await prisma.folder.findUnique({
      where: { id }
    });

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    if (!collection.password) {
      return NextResponse.json({ success: true });
    }

    const isValid = await bcrypt.compare(password, collection.password);
    
    if (!isValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // In a real app, we'd sign a JWT here to prove access. 
    // For simplicity, we just return success and the client can pass the password in subsequent requests.
    return NextResponse.json({ success: true, token: "authorized" });

  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
