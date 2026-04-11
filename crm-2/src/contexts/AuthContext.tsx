import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from "react";

export type UserType = "admin" | "machine_user" | "supplier" | "new_user" | "operator";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  userType: UserType;
  company?: string;
}

export interface ActivityEntry {
  id: string;
  event: "login" | "logout" | "register" | "password_changed" | "login_failed" | "account_locked" | "session_expired";
  ts: string;
  detail?: string;
  ip?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  lastLoginAt: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setUserType: (userType: UserType) => void;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPw: string, newPw: string) => Promise<{ success: boolean; error?: string }>;
  getActivityLog: () => ActivityEntry[];
  clearActivityLog: () => void;
  sessionExpiresAt: number | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY    = "sai_crm_session";
const USERS_KEY      = "sai_crm_users_v2";
const LOCK_KEY       = "sai_crm_locks";
const ACTIVITY_KEY   = "sai_crm_activity";
const AUTH_USER_KEY  = "sai_crm_auth_user";
const MAX_ATTEMPTS   = 5;
const LOCK_DURATION  = 15 * 60 * 1000;
const IDLE_TIMEOUT   = 30 * 60 * 1000; // 30 min idle auto-logout
const SESSION_TTL    = 7 * 24 * 60 * 60 * 1000; // 7 days

/* ── Crypto helpers ─────────────────────────────────────────── */
async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(salt + password + "sai_rolotech_2025");
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2,"0")).join("");
}
function generateSalt(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2,"0")).join("");
}
function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2,"0")).join("");
}

/* ── Activity Log ───────────────────────────────────────────── */
function logActivity(event: ActivityEntry["event"], detail?: string): void {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    const log: ActivityEntry[] = raw ? JSON.parse(raw) : [];
    const entry: ActivityEntry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      event,
      ts: new Date().toISOString(),
      detail,
    };
    log.unshift(entry);
    if (log.length > 100) log.splice(100);
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(log));
  } catch {}
}

function getLog(): ActivityEntry[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

/* ── Rate limiting ──────────────────────────────────────────── */
function checkRateLimit(email: string): { locked: boolean; remaining: number } {
  const raw = localStorage.getItem(LOCK_KEY);
  const locks: Record<string, { attempts: number; lockedUntil?: number }> = raw ? JSON.parse(raw) : {};
  const entry = locks[email.toLowerCase()];
  if (!entry) return { locked: false, remaining: MAX_ATTEMPTS };
  if (entry.lockedUntil && Date.now() < entry.lockedUntil) return { locked: true, remaining: 0 };
  if (entry.lockedUntil && Date.now() >= entry.lockedUntil) {
    delete locks[email.toLowerCase()];
    localStorage.setItem(LOCK_KEY, JSON.stringify(locks));
    return { locked: false, remaining: MAX_ATTEMPTS };
  }
  return { locked: false, remaining: MAX_ATTEMPTS - (entry.attempts || 0) };
}

function recordFailedAttempt(email: string): void {
  const raw = localStorage.getItem(LOCK_KEY);
  const locks: Record<string, { attempts: number; lockedUntil?: number }> = raw ? JSON.parse(raw) : {};
  const key = email.toLowerCase();
  const entry = locks[key] || { attempts: 0 };
  entry.attempts = (entry.attempts || 0) + 1;
  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCK_DURATION;
    logActivity("account_locked", `Email: ${email}`);
  }
  locks[key] = entry;
  localStorage.setItem(LOCK_KEY, JSON.stringify(locks));
}

function clearFailedAttempts(email: string): void {
  const raw = localStorage.getItem(LOCK_KEY);
  if (!raw) return;
  const locks = JSON.parse(raw);
  delete locks[email.toLowerCase()];
  localStorage.setItem(LOCK_KEY, JSON.stringify(locks));
}

/* ── Session management ─────────────────────────────────────── */
interface Session {
  user: AuthUser;
  token: string;
  authToken?: string | null;
  expiresAt: number;
  lastLoginAt: string;
  lastActiveAt: number;
}

function persistAuthUser(user: AuthUser, authToken?: string | null): void {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ ...user, token: authToken || "" }));
}

function normalizeUserType(raw?: string | null): UserType {
  switch ((raw || "").toLowerCase()) {
    case "admin":
      return "admin";
    case "supplier":
      return "supplier";
    case "operator":
      return "operator";
    case "machine_user":
    case "machine-user":
    case "sales":
    case "support":
    case "viewer":
      return "machine_user";
    case "new_user":
      return "new_user";
    default:
      return "machine_user";
  }
}

function mapBackendUser(user: any): AuthUser {
  return {
    id: String(user?.id ?? ""),
    name: String(user?.name || user?.username || "User"),
    email: String(user?.email || user?.username || ""),
    userType: normalizeUserType(user?.role),
    company: user?.company || undefined,
  };
}

async function tryBackendLogin(identifier: string, password: string): Promise<{ token: string; user: AuthUser } | null> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, email: identifier, username: identifier, password }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.success || !data?.token || !data?.user) return null;
  return { token: data.token, user: mapBackendUser(data.user) };
}

async function tryBackendRegister(name: string, email: string, password: string): Promise<{ token?: string; user: AuthUser } | null> {
  const username = email.split("@")[0]?.trim().toLowerCase() || `user_${Date.now()}`;
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, username, password, role: "machine_user" }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.success || !data?.user) return null;
  return {
    token: data.token,
    user: { ...mapBackendUser(data.user), userType: "new_user" },
  };
}

function saveSession(user: AuthUser, prevLastLogin?: string, authToken?: string | null): void {
  const now = Date.now();
  const session: Session = {
    user,
    token: generateToken(),
    authToken: authToken || null,
    expiresAt: now + SESSION_TTL,
    lastLoginAt: new Date().toISOString(),
    lastActiveAt: now,
  };
  if (prevLastLogin) (session as any)._prevLastLogin = prevLastLogin;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  persistAuthUser(user, authToken);
}

function loadSession(): { user: AuthUser; lastLoginAt: string; expiresAt: number } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: Session = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      clearSession();
      logActivity("session_expired", session.user?.email);
      return null;
    }
    return { user: session.user, lastLoginAt: session.lastLoginAt, expiresAt: session.expiresAt };
  } catch { return null; }
}

function updateLastActive(): void {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const session = JSON.parse(raw);
    session.lastActiveAt = Date.now();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {}
}

function getLastActive(): number {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    if (!raw) return 0;
    const session = JSON.parse(raw);
    return session.lastActiveAt || Date.now();
  } catch { return 0; }
}

function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

/* ── Stored user type ───────────────────────────────────────── */
interface StoredUser {
  id: string;
  name: string;
  email: string;
  userType: UserType;
  company?: string;
  passwordHash: string;
  salt: string;
}

const ADMIN_EMAIL = "admin.sairolotech@gmail.com";
const ADMIN_PASS  = "v9667146889V";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]               = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [lastLoginAt, setLastLoginAt] = useState<string | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Idle auto-logout ──────────────────────────────────────── */
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    updateLastActive();
    idleTimerRef.current = setTimeout(() => {
      // Check if really idle (in case another tab was active)
      const lastActive = getLastActive();
      if (Date.now() - lastActive >= IDLE_TIMEOUT) {
        logActivity("logout", "Auto-logout: 30 min idle");
        clearSession();
        setUser(null);
        setLastLoginAt(null);
        // Redirect to login
        window.location.href = "/login";
      }
    }, IDLE_TIMEOUT);
  }, []);

  useEffect(() => {
    const data = loadSession();
    if (data) {
      setUser(data.user);
      setLastLoginAt(data.lastLoginAt);
      setSessionExpiresAt(data.expiresAt);
    }
    setIsLoading(false);
  }, []);

  /* ── Attach activity listeners for idle detection ──────────── */
  useEffect(() => {
    if (!user) return;
    const events = ["mousedown", "keydown", "touchstart", "scroll", "click"];
    events.forEach(e => window.addEventListener(e, resetIdleTimer, { passive: true }));
    resetIdleTimer(); // start timer
    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [user, resetIdleTimer]);

  /* ── Login ─────────────────────────────────────────────────── */
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    try {
      const rl = checkRateLimit(email);
      if (rl.locked) {
        logActivity("login_failed", `Locked: ${email}`);
        setIsLoading(false);
        return { success: false, error: "Bahut zyada galat attempts. 15 minute baad try karein." };
      }

      if (email.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASS) {
        const adminUser: AuthUser = { id: "admin-001", name: "SAI Admin", email: ADMIN_EMAIL, userType: "admin" };
        saveSession(adminUser);
        setUser(adminUser);
        const s = loadSession();
        setLastLoginAt(s?.lastLoginAt || null);
        setSessionExpiresAt(s?.expiresAt || null);
        clearFailedAttempts(email);
        logActivity("login", `Admin login: ${email}`);
        setIsLoading(false);
        return { success: true };
      }

      try {
        const backend = await tryBackendLogin(email.trim(), password);
        if (backend) {
          saveSession(backend.user, undefined, backend.token);
          setUser(backend.user);
          const s = loadSession();
          setLastLoginAt(s?.lastLoginAt || null);
          setSessionExpiresAt(s?.expiresAt || null);
          clearFailedAttempts(email);
          logActivity("login", `Backend login: ${email}`);
          setIsLoading(false);
          return { success: true };
        }
      } catch {
        // fall back to local auth so existing installs continue to work
      }

      const raw = localStorage.getItem(USERS_KEY);
      const users: StoredUser[] = raw ? JSON.parse(raw) : [];
      const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

      if (!found) {
        recordFailedAttempt(email);
        logActivity("login_failed", `User not found: ${email}`);
        setIsLoading(false);
        return { success: false, error: "Email ya password galat hai." };
      }

      const hash = await hashPassword(password, found.salt);
      if (hash !== found.passwordHash) {
        recordFailedAttempt(email);
        logActivity("login_failed", `Wrong password: ${email}`);
        const remaining = checkRateLimit(email).remaining;
        setIsLoading(false);
        return {
          success: false,
          error: remaining <= 0
            ? "Account temporarily locked. 15 minute baad try karein."
            : `Password galat hai. ${remaining} attempts remaining.`,
        };
      }

      const authUser: AuthUser = { id: found.id, name: found.name, email: found.email, userType: found.userType, company: found.company };
      saveSession(authUser);
      setUser(authUser);
      const s = loadSession();
      setLastLoginAt(s?.lastLoginAt || null);
      setSessionExpiresAt(s?.expiresAt || null);
      clearFailedAttempts(email);
      logActivity("login", `User login: ${email}`);
      setIsLoading(false);
      return { success: true };
    } catch {
      setIsLoading(false);
      return { success: false, error: "Login mein problem aayi. Dobara try karein." };
    }
  };

  /* ── Register ───────────────────────────────────────────────── */
  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    try {
      if (password.length < 6) { setIsLoading(false); return { success: false, error: "Password kam se kam 6 characters ka hona chahiye." }; }
      const raw = localStorage.getItem(USERS_KEY);
      const users: StoredUser[] = raw ? JSON.parse(raw) : [];
      if (email.toLowerCase() === ADMIN_EMAIL || users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
        setIsLoading(false); return { success: false, error: "Yeh email already registered hai." };
      }

      try {
        const backend = await tryBackendRegister(name.trim(), email.trim(), password);
        if (backend) {
          saveSession(backend.user, undefined, backend.token);
          setUser(backend.user);
          const s = loadSession();
          setLastLoginAt(s?.lastLoginAt || null);
          setSessionExpiresAt(s?.expiresAt || null);
          logActivity("register", `Backend user: ${email}`);
          setIsLoading(false);
          return { success: true };
        }
      } catch {
        // fall back to local auth
      }

      const salt = generateSalt();
      const passwordHash = await hashPassword(password, salt);
      const newUser: StoredUser = { id: `user-${Date.now()}`, name, email, userType: "new_user", passwordHash, salt };
      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      const authUser: AuthUser = { id: newUser.id, name: newUser.name, email: newUser.email, userType: newUser.userType };
      saveSession(authUser);
      setUser(authUser);
      const s = loadSession();
      setLastLoginAt(s?.lastLoginAt || null);
      setSessionExpiresAt(s?.expiresAt || null);
      logActivity("register", `New user: ${email}`);
      setIsLoading(false);
      return { success: true };
    } catch {
      setIsLoading(false);
      return { success: false, error: "Registration mein problem aayi. Dobara try karein." };
    }
  };

  /* ── Logout ─────────────────────────────────────────────────── */
  const logout = () => {
    logActivity("logout", user?.email);
    clearSession();
    setUser(null);
    setLastLoginAt(null);
    setSessionExpiresAt(null);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  };

  /* ── Change Password ────────────────────────────────────────── */
  const changePassword = async (currentPw: string, newPw: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "Not logged in." };
    await new Promise((r) => setTimeout(r, 400));
    try {
      if (newPw.length < 8) return { success: false, error: "Naya password kam se kam 8 characters ka hona chahiye." };
      if (newPw === currentPw) return { success: false, error: "Naya password purane se alag hona chahiye." };

      try {
        const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
        const session: Session | null = raw ? JSON.parse(raw) : null;
        if (session?.authToken) {
          const res = await fetch("/api/auth/change-password", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.authToken}`,
            },
            body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
          });
          if (res.ok) {
            logActivity("password_changed", `Backend password changed: ${user.email}`);
            return { success: true };
          }
          const data = await res.json().catch(() => ({}));
          return { success: false, error: data?.error || "Password change mein problem aayi." };
        }
      } catch {
        // continue to local fallback for legacy users
      }

      // Admin password change
      if (user.email.toLowerCase() === ADMIN_EMAIL) {
        if (currentPw !== ADMIN_PASS) return { success: false, error: "Current password galat hai." };
        logActivity("password_changed", `Admin password changed`);
        return { success: true };
      }

      const raw = localStorage.getItem(USERS_KEY);
      const users: StoredUser[] = raw ? JSON.parse(raw) : [];
      const idx = users.findIndex((u) => u.id === user.id);
      if (idx < 0) return { success: false, error: "User not found." };

      const currentHash = await hashPassword(currentPw, users[idx].salt);
      if (currentHash !== users[idx].passwordHash) return { success: false, error: "Current password galat hai." };

      const newSalt = generateSalt();
      const newHash = await hashPassword(newPw, newSalt);
      users[idx].passwordHash = newHash;
      users[idx].salt = newSalt;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      logActivity("password_changed", `Password changed: ${user.email}`);
      return { success: true };
    } catch {
      return { success: false, error: "Password change mein problem aayi." };
    }
  };

  /* ── Set user type ──────────────────────────────────────────── */
  const setUserType = (userType: UserType) => {
    if (!user) return;
    const updated = { ...user, userType };
    let authToken: string | null = null;
    try {
      const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      authToken = raw ? (JSON.parse(raw).authToken || null) : null;
    } catch {
      authToken = null;
    }
    saveSession(updated, undefined, authToken);
    setUser(updated);
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const users: StoredUser[] = JSON.parse(raw);
      const idx = users.findIndex((u) => u.id === user.id);
      if (idx >= 0) { users[idx].userType = userType; localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
    }
  };

  /* ── Reset Password ─────────────────────────────────────────── */
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise((r) => setTimeout(r, 600));
    if (email.toLowerCase() === ADMIN_EMAIL) return { success: true };
    const raw = localStorage.getItem(USERS_KEY);
    const users: StoredUser[] = raw ? JSON.parse(raw) : [];
    if (!users.find((u) => u.email.toLowerCase() === email.toLowerCase()))
      return { success: false, error: "Yeh email registered nahi hai." };
    return { success: true };
  };

  /* ── Activity log ───────────────────────────────────────────── */
  const getActivityLog = () => getLog();
  const clearActivityLog = () => { localStorage.removeItem(ACTIVITY_KEY); };

  return (
    <AuthContext.Provider value={{
      user, isLoading, lastLoginAt, sessionExpiresAt,
      login, register, logout, setUserType, resetPassword,
      changePassword, getActivityLog, clearActivityLog,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
