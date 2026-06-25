import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser, type SessionUser } from "@/lib/session";
import type { UserRole } from "@/lib/constants";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Resolve the current user for an API route. Returns either the user or a
 * NextResponse error to return early:
 *
 *   const auth = await requireUser();
 *   if (auth instanceof NextResponse) return auth;
 *   const user = auth;
 */
export async function requireUser(
  role?: UserRole
): Promise<SessionUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (role && user.role !== role) return jsonError("Forbidden", 403);
  return user;
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", issues: error.issues },
      { status: 422 }
    );
  }
  console.error("API error:", error);
  return jsonError("Internal server error", 500);
}

// ─── JSON (de)serialization helpers for SQLite string columns ───────

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
