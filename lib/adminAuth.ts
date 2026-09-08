import "server-only";
import { createHmac, timingSafeEqual, scryptSync, randomBytes } from "crypto";
import { getSetting, setSetting } from "./settings";
import { getSupabaseAdminClient } from "./supabaseAdmin";

export const ADMIN_COOKIE_NAME = "stg_admin_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const PASSWORD_SETTING_KEY = "admin_password_hash";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** salt:hash, both hex — scrypt needs no extra dependency and no native
 * bindings, unlike bcrypt, so it works in any Node deployment target. */
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPasswordHash(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

/** True once login is usable at all — the shared master password, via
 * env or the Settings-page override, is the required baseline. Named
 * admin accounts are an additive layer on top of it (see below), not a
 * replacement, so this check is unchanged by that feature. */
export function isAdminAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}

/** Checks a candidate password against the shared "master" password:
 * a custom one set via the Settings page (stored as a salted hash), or
 * ADMIN_PASSWORD from the environment if none has been set yet. */
export async function checkMasterPassword(candidate: string): Promise<boolean> {
  if (typeof candidate !== "string" || candidate.length === 0) return false;

  const storedHash = await getSetting(PASSWORD_SETTING_KEY);
  if (storedHash) {
    return verifyPasswordHash(candidate, storedHash);
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(candidate, expected);
}

// Back-compat alias — existing call sites use this name.
export const checkPassword = checkMasterPassword;

/** Sets a new master password (persisted in app_settings), overriding
 * ADMIN_PASSWORD from here on until changed again. */
export async function setAdminPassword(newPassword: string): Promise<void> {
  await setSetting(PASSWORD_SETTING_KEY, hashPassword(newPassword));
}

/** Whether the effective master password is currently a custom one set
 * from the Settings page, as opposed to falling back to ADMIN_PASSWORD. */
export async function hasCustomPassword(): Promise<boolean> {
  return Boolean(await getSetting(PASSWORD_SETTING_KEY));
}

// ────────────────────────────────────────────────────────────────
// Named admin accounts — additive on top of the master password.
// ────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
  is_super_admin: boolean;
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, name, email, created_at, is_super_admin")
    .order("created_at", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function createAdminUser(
  name: string,
  email: string,
  password: string,
  isSuperAdmin = false
): Promise<AdminUser> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_users")
    .insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password_hash: hashPassword(password),
      is_super_admin: isSuperAdmin,
    })
    .select("id, name, email, created_at, is_super_admin")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("An admin with that email already exists.");
    }
    throw error;
  }
  return data;
}

export async function deleteAdminUser(id: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("admin_users").delete().eq("id", id);
  if (error) throw error;
}

export async function updateAdminPasswordById(id: string, newPassword: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("admin_users")
    .update({ password_hash: hashPassword(newPassword) })
    .eq("id", id);
  if (error) throw error;
}

export async function verifyAdminPasswordById(id: string, candidate: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("password_hash")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return false;
  return verifyPasswordHash(candidate, data.password_hash);
}

async function findAdminByEmail(
  email: string
): Promise<{ id: string; name: string; email: string; password_hash: string; is_super_admin: boolean } | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, name, email, password_hash, is_super_admin")
    .ilike("email", email.trim())
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

// ────────────────────────────────────────────────────────────────
// Login + session tokens
// ────────────────────────────────────────────────────────────────

export type SessionIdentity =
  | { kind: "master" }
  | { kind: "admin"; id: string; name: string; email: string; isSuperAdmin: boolean };

/**
 * Whether this identity is allowed to manage admin accounts. The shared
 * master password is always super admin — that guarantees there's always
 * at least one way in that can create/remove named admins, so nobody can
 * ever lock everyone out of admin management.
 */
export function isSuperAdmin(identity: SessionIdentity | null): boolean {
  if (!identity) return false;
  return identity.kind === "master" || identity.isSuperAdmin;
}

/**
 * Verifies credentials against either a named admin account (if an email
 * is given and matches one) or the shared master password — whichever
 * matches first. This lets the master password keep working exactly as
 * before even after named admins exist.
 */
export async function verifyLogin(
  email: string,
  password: string
): Promise<SessionIdentity | null> {
  const trimmedEmail = email.trim();
  if (trimmedEmail) {
    const admin = await findAdminByEmail(trimmedEmail);
    if (admin && verifyPasswordHash(password, admin.password_hash)) {
      return {
        kind: "admin",
        id: admin.id,
        name: admin.name,
        email: admin.email,
        isSuperAdmin: admin.is_super_admin,
      };
    }
  }
  if (await checkMasterPassword(password)) {
    return { kind: "master" };
  }
  return null;
}

/** Signed "expires-at + identity" token. No server-side session store
 * needed — everything required to verify it travels in the cookie. */
export function createSessionToken(identity: SessionIdentity): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set.");
  const payloadJson = JSON.stringify({ exp: Date.now() + SESSION_TTL_MS, identity });
  const payload = Buffer.from(payloadJson, "utf8").toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

function decodeToken(
  token: string | undefined | null
): { exp: number; identity: SessionIdentity } | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || !token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  if (!safeEqual(signature, expected)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof parsed?.exp !== "number" || !parsed?.identity) return null;
    if (Date.now() >= parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function verifySessionToken(token: string | undefined | null): boolean {
  return decodeToken(token) !== null;
}

/** The logged-in identity for this session, or null if invalid/expired.
 * Used to show "who's logged in" in the sidebar and to scope password
 * changes to the right account. */
export function getSessionIdentity(token: string | undefined | null): SessionIdentity | null {
  return decodeToken(token)?.identity ?? null;
}
