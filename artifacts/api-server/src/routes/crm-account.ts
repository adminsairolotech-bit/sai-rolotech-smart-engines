import { Router, type Request, type Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { deletionRateLimiter } from "../middleware/security.js";

const router = Router();

// Supabase admin client for server-side operations
function getSupabaseAdmin() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_KEY"];
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * POST /api/account-deletion-request
 * User requests account deletion. Admin reviews and deletes.
 */
router.post("/account-deletion-request", async (req: Request, res: Response) => {
  try {
    const { userId, email, reason } = req.body as {
      userId?: number;
      email?: string;
      reason?: string;
    };

    if (!email) {
      return res.status(400).json({ success: false, error: "Email required" });
    }

    const SUPABASE_URL = process.env["SUPABASE_URL"];
    const SUPABASE_SERVICE_KEY = process.env["SUPABASE_SERVICE_KEY"];

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      // Demo mode — log request and return success
      console.log(`[account-deletion] Demo request: ${email} — reason: ${reason || "not provided"}`);
      return res.json({
        success: true,
        message: "Deletion request received (demo mode — Supabase not configured)",
        requestId: `demo-${Date.now()}`,
      });
    }

    const headers = {
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
    };

    // Check if user exists
    const userRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=id,name`,
      { headers }
    );
    const users = await userRes.json() as Array<{ id: number; name: string }>;

    if (users.length === 0) {
      return res.status(404).json({ success: false, error: "Account not found" });
    }

    const userIdNum = userId || users[0].id;

    // Create deletion request record (if feedback_reports table exists)
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/feedback_reports`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: "account_deletion",
          subject: `Account Deletion Request — ${email}`,
          message: `User ${email} (ID: ${userIdNum}) has requested account deletion.\nReason: ${reason || "Not provided"}\nRequested at: ${new Date().toISOString()}`,
          status: "pending_review",
          priority: "high",
        }),
      });
    } catch {
      // Table might not exist — non-fatal
    }

    console.log(`[account-deletion] Request received for: ${email} (ID: ${userIdNum})`);

    return res.json({
      success: true,
      message: "Deletion request submitted successfully. Our team will review it within 48 hours and notify you via email.",
      requestId: `req-${Date.now()}`,
    });
  } catch (err) {
    console.error("[account-deletion] Error:", err);
    return res.status(500).json({ success: false, error: "Failed to submit deletion request" });
  }
});

/**
 * DELETE /api/users/:id
 * Admin deletes a user account.
 * Requires admin authentication + strict rate limit.
 */
router.delete("/users/:id", deletionRateLimiter, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id ?? "");

    // Check admin auth from header
    const adminToken = req.headers["x-admin-password"] as string | undefined;
    const configuredAdminPassword = process.env["ADMIN_PASSWORD"] || "sairolotech2026";

    if (!adminToken || adminToken !== configuredAdminPassword) {
      return res.status(401).json({ success: false, error: "Unauthorized — admin password required" });
    }

    const SUPABASE_URL = process.env["SUPABASE_URL"];
    const SUPABASE_SERVICE_KEY = process.env["SUPABASE_SERVICE_KEY"];

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return res.status(503).json({ success: false, error: "Supabase not configured" });
    }

    const headers = {
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
    };

    // Delete user from Supabase Auth
    const supabaseAdmin = getSupabaseAdmin();
    if (supabaseAdmin) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(id);
      } catch {
        // User might not exist in auth — continue with DB delete
      }
    }

    // Delete user's leads
    await fetch(`${SUPABASE_URL}/rest/v1/leads?user_id=eq.${id}`, {
      method: "DELETE",
      headers,
    }).catch(() => { /* non-fatal */ });

    // Delete user record
    const delRes = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${id}`, {
      method: "DELETE",
      headers,
    });

    if (!delRes.ok) {
      throw new Error("Failed to delete user from database");
    }

    console.log(`[account-deletion] User ${id} deleted by admin`);

    return res.json({ success: true, message: "User account deleted successfully" });
  } catch (err) {
    console.error("[account-deletion] Error:", err);
    return res.status(500).json({ success: false, error: "Deletion failed" });
  }
});

export default router;
