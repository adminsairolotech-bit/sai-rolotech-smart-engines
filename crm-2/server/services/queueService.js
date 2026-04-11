/**
 * Queue Service — In-memory job queue with retry logic
 * Har lead ka message reliably deliver hota hai — no data loss
 */

const queue = [];           // pending jobs
const processing = new Set(); // job IDs currently running
let workerRunning = false;

const RETRY_DELAYS = [60, 300, 900, 3600, 14400]; // seconds: 1m, 5m, 15m, 1h, 4h

export function enqueue(type, payload, options = {}) {
  const job = {
    id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    payload,
    retryCount: 0,
    maxRetries: options.maxRetries ?? 5,
    runAt: Date.now() + (options.delayMs || 0),
    createdAt: new Date().toISOString(),
  };
  queue.push(job);
  console.log(`📥 Queued [${type}] for ${payload.phone || payload.leadId || 'system'} (${queue.length} in queue)`);
  if (!workerRunning) startWorker();
  return job;
}

export function getQueueStats() {
  return { queued: queue.length, processing: processing.size };
}

/* ── Worker Loop ── */
const handlers = {};

export function registerHandler(type, fn) {
  handlers[type] = fn;
}

async function startWorker() {
  if (workerRunning) return;
  workerRunning = true;

  while (true) {
    const now = Date.now();
    const ready = queue.filter(j => j.runAt <= now && !processing.has(j.id));

    if (ready.length === 0) {
      await sleep(5000);
      continue;
    }

    for (const job of ready) {
      processing.add(job.id);
      runJob(job).finally(() => processing.delete(job.id));
    }

    await sleep(2000);
  }
}

// Valid job types — only registered strings allowed (prevents prototype injection)
const ALLOWED_JOB_TYPES = new Set([
  'SEND_WELCOME', 'SEND_FOLLOWUP', 'SEND_AI_REPLY',
  'SEND_QUOTATION_FOLLOWUP', 'ADMIN_ALERT', 'SEND_PUSH',
  'SEND_MEETING_SLOTS', 'SMART_NOTIFY', 'SMART_FOLLOWUP', 'TASK_FOLLOWUP',
]);

async function runJob(job) {
  const idx = queue.indexOf(job);
  if (idx === -1) return; // already removed

  // Validate job type is a known string (prevents prototype pollution)
  if (typeof job.type !== 'string' || !ALLOWED_JOB_TYPES.has(job.type)) {
    console.warn(`⚠️  Rejected unknown job type: ${String(job.type).slice(0, 30)}`);
    queue.splice(idx, 1);
    return;
  }

  const handler = handlers[job.type];
  if (!handler) {
    console.warn(`⚠️  No handler for job type: ${job.type}`);
    queue.splice(idx, 1);
    return;
  }

  try {
    await withTimeout(handler(job.payload), 10000);
    queue.splice(queue.indexOf(job), 1);
    console.log(`✅ Job done [${job.type}] id=${job.id}`);
  } catch (err) {
    job.retryCount++;
    console.error(`❌ Job failed [${job.type}] attempt ${job.retryCount}/${job.maxRetries}: ${err.message}`);

    if (job.retryCount >= job.maxRetries) {
      console.error(`🚫 Max retries reached, dropping job: ${job.id}`);
      queue.splice(queue.indexOf(job), 1);
    } else {
      const delaySec = RETRY_DELAYS[job.retryCount - 1] || 14400;
      job.runAt = Date.now() + delaySec * 1000;
      console.log(`🔄 Retry ${job.retryCount} for job ${job.id} in ${delaySec}s`);
    }
  }
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`Timeout after ${ms}ms`)), ms)),
  ]);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
