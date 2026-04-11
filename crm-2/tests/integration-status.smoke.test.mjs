import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';

async function getAvailablePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('Unable to resolve a free TCP port')));
        return;
      }
      const { port } = address;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(port);
      });
    });
    server.on('error', reject);
  });
}

async function waitForServer(port, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) {
        return;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Server on port ${port} did not become ready within ${timeoutMs}ms`);
}

async function startServer(port, extraEnv = {}) {
  const child = spawn(process.execPath, ['server/index.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      ...extraEnv,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
  child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

  try {
    await waitForServer(port);
  } catch (error) {
    child.kill('SIGTERM');
    throw new Error(`Server failed to start. stdout=${stdout} stderr=${stderr} cause=${error instanceof Error ? error.message : String(error)}`);
  }

  return {
    child,
    getLogs() {
      return { stdout, stderr };
    },
    async stop() {
      child.kill('SIGTERM');
      await new Promise((resolve) => child.once('exit', resolve));
    },
  };
}

test('integration status returns diagnostics payload with admin token config', async () => {
  const port = await getAvailablePort();
  const token = 'codex-test-token';
  const server = await startServer(port, {
    ADMIN_API_TOKEN: token,
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: '',
    GEMINI_API_KEY: '',
  });

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/integration-status`, {
      headers: { 'x-admin-token': token },
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.authConfigured, true);
    assert.equal(body.usingFallbackAccess, false);
    assert.equal(typeof body.statuses, 'object');
    assert.equal(body.statuses.adminToken.connected, true);
    assert.equal(body.statuses.db.connected, false);
  } finally {
    await server.stop();
  }
});

test('protected admin route denies missing token and allows valid token', async () => {
  const port = await getAvailablePort();
  const token = 'codex-test-token';
  const server = await startServer(port, {
    ADMIN_API_TOKEN: token,
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: '',
    GEMINI_API_KEY: '',
  });

  try {
    const denied = await fetch(`http://127.0.0.1:${port}/api/admin/gmail/status`);
    const deniedBody = await denied.json();
    assert.equal(denied.status, 401);
    assert.equal(deniedBody.success, false);

    const allowed = await fetch(`http://127.0.0.1:${port}/api/admin/gmail/status`, {
      headers: { 'x-admin-token': token },
    });
    const allowedBody = await allowed.json();
    assert.equal(allowed.status, 200);
    assert.equal(allowedBody.success, true);
    assert.equal(allowedBody.connected, false);
  } finally {
    await server.stop();
  }
});
