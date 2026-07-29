import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-utils";
import { Role } from "@prisma/client";

export const PATCH = withAuth(async (req, user) => {
  if (user.role !== Role.SUPER_ADMIN && user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { userId, planId } = body;

    if (!userId || !planId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Upsert subscription
    // If user already has an active subscription, update it. Else create it.
    const activeSub = await prisma.subscription.findFirst({
      where: { userId, status: "ACTIVE" }
    });

    if (activeSub) {
      await prisma.subscription.update({
        where: { id: activeSub.id },
        data: { planId }
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId,
          planId,
          status: "ACTIVE",
          provider: "Manual Admin Override",
        }
      });
    }

    // Also update any retention rules retroactively? (Optional, but let's stick to future uploads)

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change Plan error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
});
