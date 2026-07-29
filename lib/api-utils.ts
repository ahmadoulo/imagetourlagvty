import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: string;
};

type RouteHandler = (req: Request, user: AuthenticatedUser, params?: any) => Promise<NextResponse>;

/**
 * Wraps an API route with authentication, error handling, and structured logging.
 */
export function withAuth(handler: RouteHandler) {
  return async (req: Request, { params }: { params?: any } = {}) => {
    try {
      const session = await auth.api.getSession({
        headers: await headers()
      });

      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      return await handler(req, session.user as AuthenticatedUser, params);
    } catch (error) {
      logger.error(`API Error in ${req.method} ${req.url}:`, error);
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 });
      }
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  };
}

/**
 * Generic response formatter
 */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
