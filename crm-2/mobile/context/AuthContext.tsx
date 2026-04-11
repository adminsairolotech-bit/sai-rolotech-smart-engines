import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiJson } from '@/lib/api';

interface User {
  id: string;
  name: string;
  role: string;
  email?: string;
}

interface Session {
  token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  recoverPassword: (identifier: string) => { success: boolean; message?: string; error?: string };
}

interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    name: string;
    email?: string | null;
    role: string;
  };
}

const AuthContext = createContext<AuthContextType | null>(null);
const SESSION_KEY = 'crm_mobile_session_v1';

function normalizeUser(user: LoginResponse['user']): User {
  return {
    id: String(user.id),
    name: String(user.name || 'User'),
    role: String(user.role || 'machine_user'),
    email: user.email ? String(user.email) : undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const saved = await SecureStore.getItemAsync(SESSION_KEY);
        if (saved) {
          const session = JSON.parse(saved) as Session;
          setUser(session.user);
          setToken(session.token);
        }
      } catch {
        await SecureStore.deleteItemAsync(SESSION_KEY);
      } finally {
        setLoading(false);
      }
    };

    void loadSession();
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      const data = await apiJson<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });

      if (!data?.success || !data?.token || !data?.user) {
        return { success: false, error: 'Login response incomplete tha. Dobara try karein.' };
      }

      const nextUser = normalizeUser(data.user);
      const session: Session = { token: data.token, user: nextUser };

      setUser(nextUser);
      setToken(data.token);
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login fail ho gaya.';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await SecureStore.deleteItemAsync(SESSION_KEY);
  };

  const recoverPassword = (identifier: string) => {
    if (!identifier.trim()) {
      return { success: false, error: 'User ID ya email likhna zaroori hai.' };
    }

    return {
      success: true,
      message:
        'Password reset ke liye support team se contact karein. In-app self-reset abhi rollout me nahi hai.',
    };
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, recoverPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
