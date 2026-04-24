export interface GeminiKeyStatus {
  keyPreview: string;
  active: boolean;
  failures: number;
  lastErrorAt?: string;
  lastSuccessAt?: string;
}

export class GeminiKeyRotator {
  private cursor = 0;
  private readonly state = new Map<
    string,
    { failures: number; blockedUntil?: number; lastErrorAt?: string; lastSuccessAt?: string }
  >();

  constructor(private readonly keys: string[]) {
    for (const key of keys) {
      this.state.set(key, { failures: 0 });
    }
  }

  getNextKey(): string | null {
    if (this.keys.length === 0) {
      return null;
    }

    for (let i = 0; i < this.keys.length; i += 1) {
      const key = this.keys[(this.cursor + i) % this.keys.length];
      const status = this.state.get(key);
      if (!status?.blockedUntil || status.blockedUntil <= Date.now()) {
        this.cursor = (this.cursor + i + 1) % this.keys.length;
        return key;
      }
    }

    return null;
  }

  reportSuccess(key: string): void {
    const entry = this.state.get(key);
    if (!entry) {
      return;
    }
    entry.failures = 0;
    entry.blockedUntil = undefined;
    entry.lastSuccessAt = new Date().toISOString();
  }

  reportError(key: string): void {
    const entry = this.state.get(key);
    if (!entry) {
      return;
    }
    entry.failures += 1;
    entry.lastErrorAt = new Date().toISOString();
    entry.blockedUntil = Date.now() + Math.min(entry.failures, 5) * 60_000;
  }

  isRateLimitError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return /429|quota|rate limit|resource exhausted/i.test(message);
  }

  getStatus(): GeminiKeyStatus[] {
    return this.keys.map((key) => {
      const entry = this.state.get(key) ?? { failures: 0 };
      return {
        keyPreview: `${key.slice(0, 6)}...${key.slice(-4)}`,
        active: !entry.blockedUntil || entry.blockedUntil <= Date.now(),
        failures: entry.failures,
        lastErrorAt: entry.lastErrorAt,
        lastSuccessAt: entry.lastSuccessAt,
      };
    });
  }
}

let singleton: GeminiKeyRotator | null = null;

export function initGeminiRotator(keys: string[]): GeminiKeyRotator {
  singleton = new GeminiKeyRotator(keys);
  return singleton;
}

export function getGeminiRotator(): GeminiKeyRotator | null {
  return singleton;
}
