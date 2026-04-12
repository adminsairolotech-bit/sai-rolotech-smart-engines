import { Router, type IRouter, type Request, type Response } from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const ADMIN_PASSWORD = process.env["ADMIN_PASSWORD"] || "SAIRTECH-ADMIN-2026";

function generateToken(email: string, name: string): string {
  const rand = crypto.randomBytes(12).toString("hex");
  const hash = crypto.createHash("sha256").update(`${email}|${name}|${rand}|SAITECH2026`).digest("hex").slice(0, 16);
  return `SAI-${hash.toUpperCase().slice(0, 4)}-${hash.slice(4, 8).toUpperCase()}-${rand.slice(0, 8).toUpperCase()}`;
}

function generateId(): string {
  return crypto.randomBytes(16).toString("hex");
}

function requireAdmin(req: Request, res: Response): boolean {
  const pwd = (req.headers["x-admin-password"] as string | undefined)
    || (req.query["pwd"] as string | undefined);
  if (pwd !== ADMIN_PASSWORD) {
    res.status(401).json({ ok: false, error: "Unauthorized — admin password galat hai" });
    return false;
  }
  return true;
}

// Simple user store (in-memory for demo)
const users: Map<string, { id: string; email: string; name: string; token: string; createdAt: string }> = new Map();

// ── Public Login Router (mounted at /license) ──────────────────
export const licenseRouter: IRouter = Router();

// POST /api/license/login - Login with email/password
licenseRouter.post("/login", (req: Request, res: Response) => {
  const { email, password, name } = req.body as {
    email?: string; password?: string; name?: string;
  };

  if (!email || !password) {
    res.status(400).json({ ok: false, error: "Email aur password dono chahiye" });
    return;
  }

  // Simple validation - any email with password works
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name?.trim() || email.split("@")[0];

  // Check if user exists
  let user = Array.from(users.values()).find(u => u.email === cleanEmail);

  if (!user) {
    // Create new user
    user = {
      id: generateId(),
      email: cleanEmail,
      name: cleanName,
      token: generateToken(cleanEmail, cleanName),
      createdAt: new Date().toISOString()
    };
    users.set(user.id, user);
    console.log(`[License] New user registered: ${cleanEmail}`);
  }

  res.json({
    ok: true,
    token: user.token,
    user: { email: user.email, name: user.name }
  });
});

// GET /api/license/verify?token=xxx
licenseRouter.get("/verify", (req: Request, res: Response) => {
  const { token } = req.query as { token?: string };

  if (!token) {
    res.status(400).json({ active: false, reason: "Token chahiye" });
    return;
  }

  const user = Array.from(users.values()).find(u => u.token === token);

  if (!user) {
    res.json({ active: false, reason: "Token not found — please login again" });
    return;
  }

  res.json({ active: true, user: { email: user.email, name: user.name } });
});

// GET /api/license/status
licenseRouter.get("/status", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    type: "email-login",
    message: "License-free mode active — email/password se login karo"
  });
});

// ── Admin Router ─────────────────────────────────────────────────
export const adminRouter: IRouter = Router();

// GET /api/admin/users
adminRouter.get("/users", (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const userList = Array.from(users.values()).map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    createdAt: u.createdAt
  }));
  res.json({ ok: true, users: userList, total: userList.length });
});

// GET /api/admin/stats
adminRouter.get("/stats", (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const total = users.size;
  res.json({ ok: true, total, active: total });
});

console.log("[License] Email/Password Login mode - No license required!");
