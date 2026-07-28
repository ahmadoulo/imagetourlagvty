import { prisma } from "./prisma";
import { auth } from "./auth";
import { headers } from "next/headers";

export async function logAudit(action: string, targetId?: string, targetType?: string, metadata?: any) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (session?.user?.id) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action,
          targetId,
          targetType,
          metadata: metadata ? JSON.stringify(metadata) : null,
          ipAddress: "server-action"
        }
      });
    }
  } catch (error) {
    console.error("Failed to log audit action", error);
  }
}

