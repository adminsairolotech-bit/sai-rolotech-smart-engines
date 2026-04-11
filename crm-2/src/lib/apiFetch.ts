import { toast } from "@/hooks/use-toast";

const API_BASE = "/api";

const LOADING_TIMEOUT_MS = 15000;
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 500;

function getAdminKey(): string {
  return (
    sessionStorage.getItem("sai_admin_token") ||
    localStorage.getItem("admin_api_key") ||
    import.meta.env.VITE_ADMIN_KEY ||
    ""
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ApiTimeoutError extends Error {
  constructor() {
    super("Request timed out");
    this.name = "ApiTimeoutError";
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  opts?: RequestInit & { showErrorToast?: boolean; retries?: number; timeout?: number }
): Promise<T> {
  const { showErrorToast = true, retries = MAX_RETRIES, timeout = LOADING_TIMEOUT_MS, ...fetchOpts } = opts || {};

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let lastError: unknown;

  try {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(`${API_BASE}${path}`, {
          ...fetchOpts,
          signal: controller.signal,
          headers: {
            "x-admin-token": getAdminKey(),
            ...(getAdminKey() ? { Authorization: `Bearer ${getAdminKey()}` } : {}),
            "Content-Type": "application/json",
            ...(fetchOpts?.headers || {}),
          },
        });

        if (res.ok) {
          return (await res.json()) as T;
        }

        if (res.status >= 500 && attempt < retries) {
          lastError = new Error(`Server error: ${res.status}`);
          await delay(INITIAL_DELAY_MS * Math.pow(2, attempt));
          continue;
        }

        let errorMessage = `API error: ${res.status}`;
        try {
          const body = await res.json();
          if (body?.error?.message) {
            errorMessage = body.error.message;
          } else if (body?.error && typeof body.error === "string") {
            errorMessage = body.error;
          }
        } catch {}

        throw new Error(errorMessage);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          throw new ApiTimeoutError();
        }

        lastError = error;

        const isNetworkError = error instanceof TypeError && error.message.includes("fetch");
        if (isNetworkError && attempt < retries) {
          await delay(INITIAL_DELAY_MS * Math.pow(2, attempt));
          continue;
        }

        if (attempt === retries) break;
      }
    }

    throw lastError;
  } catch (error) {
    if (showErrorToast) {
      const msg = error instanceof ApiTimeoutError
        ? "Request timed out. Please try again."
        : error instanceof Error
          ? error.message
          : "An unexpected error occurred";

      toast({ title: "Error", description: msg, variant: "destructive" });
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
