import Constants from 'expo-constants';

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

const expoExtra = Constants.expoConfig?.extra ?? {};
const configuredBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  (typeof expoExtra.apiBaseUrl === 'string' ? expoExtra.apiBaseUrl : '') ||
  '';

export const API_BASE_URL = configuredBaseUrl ? trimTrailingSlash(configuredBaseUrl) : '';

export function buildApiUrl(path: string) {
  if (!API_BASE_URL) return null;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = buildApiUrl(path);
  if (!url) {
    throw new Error('API base URL is not configured for the mobile app.');
  }

  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}
