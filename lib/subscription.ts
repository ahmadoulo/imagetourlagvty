import { prisma } from "./prisma";

/**
 * Ensures the given user has a subscription.
 * If not, automatically assigns the "Free" plan to them.
 */
export async function ensureDefaultSubscription(userId: string) {
  // Check if user already has an active subscription
  const existingSub = await prisma.subscription.findFirst({
    where: { userId, status: "ACTIVE" },
    include: { plan: true }
  });

  if (existingSub) {
    return existingSub;
  }

  // Find the Free plan
  const freePlan = await prisma.plan.findFirst({
    where: { name: "Free" }
  });

  if (!freePlan) {
    throw new Error("Free plan not found in database. Seed the database first.");
  }

  // Calculate billing cycle end date (1 month from now)
  const currentPeriodEnd = new Date();
  currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

  // Create subscription
  const newSub = await prisma.subscription.create({
    data: {
      userId,
      planId: freePlan.id,
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd
    },
    include: { plan: true }
  });

  return newSub;
}
