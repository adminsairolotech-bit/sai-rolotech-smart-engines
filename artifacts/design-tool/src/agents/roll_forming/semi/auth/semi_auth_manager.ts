/**
 * SEMI_AUTH_MANAGER - Roll Forming Semi Agent
 * ===========================================
 * Authentication manager agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
  User,
  AuthResult,
  UserRole,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_AUTH_MANAGER',
  version: '1.0.0',
  timeout: 10000,
  retries: 2,
};

export interface AuthInput {
  action: 'login' | 'logout' | 'register' | 'update';
  email?: string;
  password?: string;
  name?: string;
  role?: UserRole;
  userId?: string;
}

export interface AuthOutput {
  result: AuthResult;
  permissions: string[];
}

// ============================================
// CORE FUNCTIONS
// ============================================

export async function authenticate(
  input: AuthInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<AuthOutput>> {
  try {
    let result: AuthResult;
    const permissions = getPermissionsForRole(input.role || 'viewer');

    switch (input.action) {
      case 'login':
        result = await handleLogin(input.email!, input.password!);
        break;
      case 'logout':
        result = { success: true };
        break;
      case 'register':
        result = await handleRegister(input.email!, input.password!, input.name!, input.role!);
        break;
      case 'update':
        result = await handleUpdate(input.userId!, input);
        break;
      default:
        throw new Error(`Unknown action: ${input.action}`);
    }

    return {
      success: result.success,
      data: { result, permissions },
    };
  } catch (error) {
    return {
      success: false,
      error: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function handleLogin(email: string, password: string): Promise<AuthResult> {
  if (!email || !password) {
    return { success: false, error: 'Email and password required' };
  }

  const user: User = {
    id: `user_${Date.now()}`,
    email,
    name: email.split('@')[0],
    role: 'engineer',
    createdAt: Date.now(),
    lastLogin: Date.now(),
  };

  const session = {
    id: `session_${Date.now()}`,
    userId: user.id,
    token: generateToken(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    createdAt: Date.now(),
  };

  return { success: true, user, session, token: session.token };
}

async function handleRegister(email: string, password: string, name: string, role: UserRole): Promise<AuthResult> {
  if (!email || !password) {
    return { success: false, error: 'Email and password required' };
  }

  const user: User = {
    id: `user_${Date.now()}`,
    email,
    name,
    role,
    createdAt: Date.now(),
  };

  return { success: true, user };
}

async function handleUpdate(userId: string, input: AuthInput): Promise<AuthResult> {
  const user: User = {
    id: userId,
    email: input.email || 'updated@example.com',
    name: input.name || 'Updated User',
    role: input.role || 'viewer',
    createdAt: Date.now(),
  };

  return { success: true, user };
}

function generateToken(): string {
  return Array.from({ length: 32 }, () => Math.random().toString(36).charAt(2)).join('');
}

function getPermissionsForRole(role: UserRole): string[] {
  const rolePermissions: Record<UserRole, string[]> = {
    admin: ['read', 'write', 'delete', 'export', 'manage_users', 'system_settings'],
    engineer: ['read', 'write', 'export', 'run_simulation'],
    operator: ['read', 'export'],
    viewer: ['read'],
  };

  return rolePermissions[role] || rolePermissions.viewer;
}

export const SemiAuthManager = { config: CONFIG, authenticate };
export default SemiAuthManager;
