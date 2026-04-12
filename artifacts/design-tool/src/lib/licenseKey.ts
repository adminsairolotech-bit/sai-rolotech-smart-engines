// ─── Email/Password Login Library ─────────────────────────────────────────────
// No license key required - just email and password!

const STORAGE_TOKEN = "sai_user_token";
const STORAGE_EMAIL = "sai_user_email";
const STORAGE_NAME  = "sai_user_name";

const API_BASE = "/api/license";

// ── Local token storage ─────────────────────────────────────────────────────
export function getStoredToken(): string | null {
  return localStorage.getItem(STORAGE_TOKEN);
}

export function getStoredName(): string | null {
  return localStorage.getItem(STORAGE_NAME);
}

export function getStoredEmail(): string | null {
  return localStorage.getItem(STORAGE_EMAIL);
}

export function getLicenseType(): "full" | "demo" | null {
  // No more license types - everyone is full access
  return localStorage.getItem(STORAGE_TOKEN) ? "full" : null;
}

function storeLogin(token: string, email: string, name: string) {
  localStorage.setItem(STORAGE_TOKEN, token);
  localStorage.setItem(STORAGE_EMAIL, email);
  localStorage.setItem(STORAGE_NAME, name);
}

export function clearLicense() {
  localStorage.removeItem(STORAGE_TOKEN);
  localStorage.removeItem(STORAGE_EMAIL);
  localStorage.removeItem(STORAGE_NAME);
}

// ── Demo remaining (not used anymore) ───────────────────────────────────────
export function getDemoRemainingMs(): number {
  return 0; // No demo - everyone gets full access
}

export function isDemoExpiredLocally(): boolean {
  return false;
}

// ── API calls ────────────────────────────────────────────────────────────────

export interface LoginResult {
  ok: boolean;
  token?: string;
  user?: { email?: string; name?: string };
  message?: string;
  error?: string;
}

export interface VerifyResult {
  active: boolean;
  user?: { email?: string; name?: string };
  reason?: string;
}

// POST /api/license/login - Login with email/password
export async function loginWithEmail(
  email: string,
  password: string,
  name?: string
): Promise<LoginResult> {
  try {
    const r = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password: password,
        name: name || email.split("@")[0]
      }),
    });
    const data = await r.json() as LoginResult;

    if (data.ok && data.token && data.user) {
      storeLogin(data.token, data.user.email || email, data.user.name || email.split("@")[0]);
    }
    return data;
  } catch {
    return { ok: false, error: "Server se connection nahi ho raha — internet check karo" };
  }
}

// Keep old function names for compatibility
export async function activateLicense(
  _key: string,
  name: string,
  _mobile: string
): Promise<LoginResult> {
  // Redirect to login
  return { ok: false, error: "Ab email/password se login karo" };
}

export async function activateDemo(_name: string, _mobile: string): Promise<LoginResult> {
  return { ok: false, error: "Ab email/password se login karo" };
}

// GET /api/license/verify - Startup check
export async function verifyLicense(): Promise<VerifyResult> {
  const token = getStoredToken();

  if (!token) return { active: false, reason: "Login required" };

  try {
    const r = await fetch(`${API_BASE}/verify?token=${encodeURIComponent(token)}`);
    const data = await r.json() as VerifyResult;

    if (data.active) {
      return { active: true, user: data.user };
    }

    // Token invalid - clear and require re-login
    clearLicense();
    return { active: false, reason: "Session expired - please login again" };
  } catch {
    // Offline fallback
    return { active: false, reason: "Server unreachable" };
  }
}
