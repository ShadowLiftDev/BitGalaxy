"use server";

import type { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { cookies, headers } from "next/headers";

export type OrgRole = "owner" | "admin" | "staff" | "player" | "dev" | string;

export interface AuthUser {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

const SESSION_COOKIE_NAME = "session";

/**
 * Dev helper: use NEXT_PUBLIC_DEV_UID if set.
 * ⬅️ IMPORTANT: only active in NON-PRODUCTION
 */
async function getDevUser(): Promise<AuthUser | null> {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const devUid = process.env.NEXT_PUBLIC_DEV_UID;
  if (!devUid) return null;

  return {
    uid: devUid,
    email: null,
    displayName: "Dev User",
    photoURL: null,
  };
}

async function getTokenFromRequest(req: NextRequest): Promise<string | null> {
  // 1) Authorization header: Bearer <token>
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  // 2) Session cookie (Firebase session cookie or raw ID token in dev)
  const cookieToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

/**
 * Server-component context: pull token from headers() + cookies()
 */
async function getTokenFromServerContext(): Promise<string | null> {
  try {
    const h = await headers();
    const authHeader = h.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.slice("Bearer ".length).trim();
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    return sessionCookie?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * Unified helper: works in route handlers (with req) and Server Components (no req).
 */
export async function getServerUser(
  req?: NextRequest,
): Promise<AuthUser | null> {
  // 🧪 Dev override FIRST, but ONLY in non-production
  const devUser = await getDevUser();
  if (devUser) return devUser;

  let token: string | null = null;

  if (req) {
    token = await getTokenFromRequest(req);
  } else {
    token = await getTokenFromServerContext();
  }

  if (!token) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      displayName: decoded.name ?? null,
      photoURL: decoded.picture ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Require an authenticated user (throws if missing/invalid).
 */
export async function requireUser(req?: NextRequest): Promise<AuthUser> {
  const u = await getServerUser(req);
  if (!u) throw new Error("Unauthorized: no auth token provided");
  return u;
}

/**
 * Fetch org roles for a user.
 * Tries orgMembers first, then members (for compatibility).
 */
export async function getUserOrgRoles(
  orgId: string,
  userId: string,
): Promise<OrgRole[]> {
  if (!orgId) throw new Error("getUserOrgRoles: orgId is required");
  if (!userId) throw new Error("getUserOrgRoles: userId is required");

  const orgMembersRef = adminDb
    .collection("orgs")
    .doc(orgId)
    .collection("orgMembers")
    .doc(userId);

  const orgMembersSnap = await orgMembersRef.get();
  let data: any | null = null;

  if (orgMembersSnap.exists) {
    data = orgMembersSnap.data();
  } else {
    // Fallback to "members" if you ever used that earlier
    const membersRef = adminDb
      .collection("orgs")
      .doc(orgId)
      .collection("members")
      .doc(userId);
    const membersSnap = await membersRef.get();
    if (membersSnap.exists) {
      data = membersSnap.data();
    }
  }

  if (!data) return [];

  if (Array.isArray(data.roles)) {
    return data.roles as OrgRole[];
  }
  if (typeof data.role === "string") {
    return [data.role as OrgRole];
  }

  return [];
}

/**
 * Ensures the given user has at least one of the required roles within an org.
 */
export async function requireRole(
  orgId: string,
  userId: string,
  allowedRoles: OrgRole[],
  _req?: NextRequest,
): Promise<void> {
  if (!orgId) throw new Error("requireRole: orgId is required");
  if (!userId) throw new Error("requireRole: userId is required");

  const roles = await getUserOrgRoles(orgId, userId);

  // If no specific roles requested, just ensure membership.
  if (!allowedRoles || allowedRoles.length === 0) {
    if (roles.length === 0) {
      throw new Error("Forbidden: user is not a member of this org");
    }
    return;
  }

  // Owners always pass
  if (roles.includes("owner")) {
    return;
  }

  const hasAllowedRole = roles.some((r) => allowedRoles.includes(r));
  if (!hasAllowedRole) {
    throw new Error(
      `Forbidden: user lacks required role(s). Required: ${allowedRoles.join(
        ", ",
      )}. User roles: ${roles.join(", ") || "none"}`,
    );
  }
}