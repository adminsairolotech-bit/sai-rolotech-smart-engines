/**
 * SEMI_SESSION_HANDLER - Roll Forming Semi Agent
 * ===========================================
 * Session handler agent
 */

import type {
  SemiAgentConfig,
  SemiAgentResult,
  SemiAgentContext,
  Session,
} from '../../types/semi-agent-types';

export const CONFIG: SemiAgentConfig = {
  name: 'SEMI_SESSION_HANDLER',
  version: '1.0.0',
  timeout: 5000,
  retries: 1,
};

export interface SessionHandlerInput {
  action: 'create' | 'validate' | 'refresh' | 'delete';
  sessionId?: string;
  token?: string;
  userId?: string;
}

export interface SessionHandlerOutput {
  session?: Session;
  valid: boolean;
  expiresIn?: number;
}

// ============================================
// CORE FUNCTIONS
// ============================================

const sessions = new Map<string, Session>();

export async function handleSession(
  input: SessionHandlerInput,
  context: SemiAgentContext
): Promise<SemiAgentResult<SessionHandlerOutput>> {
  try {
    let output: SessionHandlerOutput;

    switch (input.action) {
      case 'create':
        output = await createSession(input.userId!);
        break;
      case 'validate':
        output = await validateSession(input.sessionId || input.token!);
        break;
      case 'refresh':
        output = await refreshSession(input.sessionId!);
        break;
      case 'delete':
        output = await deleteSession(input.sessionId!);
        break;
      default:
        throw new Error(`Unknown action: ${input.action}`);
    }

    return { success: true, data: output };
  } catch (error) {
    return {
      success: false,
      error: `Session handling failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function createSession(userId: string): Promise<SessionHandlerOutput> {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const token = generateToken();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  const session: Session = {
    id: sessionId,
    userId,
    token,
    expiresAt,
    createdAt: Date.now(),
  };

  sessions.set(sessionId, session);

  return { session, valid: true, expiresIn: expiresAt - Date.now() };
}

async function validateSession(sessionIdOrToken: string): Promise<SessionHandlerOutput> {
  let session: Session | undefined;

  for (const s of sessions.values()) {
    if (s.id === sessionIdOrToken || s.token === sessionIdOrToken) {
      session = s;
      break;
    }
  }

  if (!session) {
    return { valid: false };
  }

  const now = Date.now();
  if (session.expiresAt < now) {
    sessions.delete(session.id);
    return { valid: false };
  }

  return { session, valid: true, expiresIn: session.expiresAt - now };
}

async function refreshSession(sessionId: string): Promise<SessionHandlerOutput> {
  const session = sessions.get(sessionId);

  if (!session) {
    return { valid: false };
  }

  session.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  sessions.set(sessionId, session);

  return { session, valid: true, expiresIn: session.expiresAt - Date.now() };
}

async function deleteSession(sessionId: string): Promise<SessionHandlerOutput> {
  sessions.delete(sessionId);
  return { valid: false };
}

function generateToken(): string {
  return Array.from({ length: 32 }, () => Math.random().toString(36).charAt(2)).join('');
}

export const SemiSessionHandler = { config: CONFIG, handleSession };
export default SemiSessionHandler;
