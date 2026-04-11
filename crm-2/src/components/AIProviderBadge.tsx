import { useState, useEffect, useCallback } from "react";
import { Cpu } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";

interface ProviderStatus {
  name: string;
  available: boolean;
  configured: boolean;
}

interface AIStatusData {
  activeProvider: string | null;
  providers: ProviderStatus[];
}

const PROVIDER_LABELS: Record<string, string> = {
  gemini: "Gemini",
  groq: "Groq",
  huggingface: "HF",
};

const PROVIDER_COLORS: Record<string, string> = {
  gemini: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  groq: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  huggingface: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
};

export function AIProviderBadge() {
  const [status, setStatus] = useState<AIStatusData | null>(null);
  const [hasError, setHasError] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await apiFetch<AIStatusData>("/admin/ai-provider/status", {
        showErrorToast: false,
      });
      setStatus(data);
      setHasError(false);
    } catch {
      setStatus(null);
      setHasError(true);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (hasError) {
    return (
      <div
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 cursor-default"
        title="AI provider status unavailable"
      >
        <Cpu className="w-3 h-3" />
        <span className="hidden sm:inline">AI</span>
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      </div>
    );
  }

  if (!status) return null;

  const activeProvider = status.activeProvider;
  const configuredCount = status.providers.filter((p) => p.configured).length;

  if (configuredCount === 0) return null;

  const label = activeProvider
    ? PROVIDER_LABELS[activeProvider] || activeProvider
    : "AI";

  const colorClass = activeProvider
    ? PROVIDER_COLORS[activeProvider] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

  const availableCount = status.providers.filter((p) => p.available).length;
  const dotColor = availableCount > 0 ? "bg-emerald-500" : "bg-red-500";

  const tooltip = status.providers
    .filter((p) => p.configured)
    .map(
      (p) =>
        `${PROVIDER_LABELS[p.name] || p.name}: ${p.available ? "Ready" : "Unavailable"}`
    )
    .join(", ");

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium ${colorClass} cursor-default`}
      title={`Active: ${label} | ${tooltip}`}
    >
      <Cpu className="w-3 h-3" />
      <span className="hidden sm:inline">{label}</span>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
    </div>
  );
}
