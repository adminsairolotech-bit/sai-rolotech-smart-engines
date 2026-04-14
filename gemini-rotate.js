#!/usr/bin/env node
/**
 * SAI ROLO TECH - Gemini Key Rotator
 * Version: 1.0
 * Purpose: Auto-rotate Gemini API keys when quota exceeded or rate limited
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Working keys (tested and verified 2026-04-14)
const WORKING_KEYS = [
  'AIzaSyBK_go4g-7n1ZQRRJDSGctNdA3wEOuJ19g', // ✅ Working
  'AIzaSyBvBTpVYS-Gqz_8UmyA0WbpPxNJY6Jkrss', // ✅ Working
  'AIzaSyDbs-S8KhoPRin-zXJcaLjLL3B6gWAzLG8', // ✅ Working
  'AIzaSyDd1jFhcEgB651oPyI-DyxqV7012qKwpXE', // ✅ Working
  'AIzaSyC7hCqTDqTlkxBUI1eTSx4WVguBVjulkb8', // ✅ Working
];

// Keys with quota issues (will retry after cooldown)
const QUOTA_EXCEEDED_KEYS = new Set();

// Cooldown time in milliseconds (5 minutes)
const COOLDOWN_MS = 5 * 60 * 1000;

// Current key index
let currentKeyIndex = 0;

// Rate limit tracking
const rateLimits = {};

function getCurrentKey() {
  // Find a key that's not in cooldown
  const startIndex = currentKeyIndex;
  do {
    if (!QUOTA_EXCEEDED_KEYS.has(WORKING_KEYS[currentKeyIndex])) {
      return WORKING_KEYS[currentKeyIndex];
    }
    currentKeyIndex = (currentKeyIndex + 1) % WORKING_KEYS.length;
  } while (currentKeyIndex !== startIndex);

  // All keys in cooldown, wait and try again
  return null;
}

function rotateKey() {
  currentKeyIndex = (currentKeyIndex + 1) % WORKING_KEYS.length;
  console.log(`[Rotator] Key rotated to index ${currentKeyIndex}: ${WORKING_KEYS[currentKeyIndex].substring(0, 20)}...`);
}

function markKeyQuotaExceeded(key) {
  QUOTA_EXCEEDED_KEYS.add(key);
  console.log(`[Rotator] Key marked as quota exceeded: ${key.substring(0, 20)}...`);

  // Schedule removal from cooldown after cooldown period
  setTimeout(() => {
    QUOTA_EXCEEDED_KEYS.delete(key);
    console.log(`[Rotator] Key restored from cooldown: ${key.substring(0, 20)}...`);
  }, COOLDOWN_MS);

  rotateKey();
}

async function testKey(key) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      contents: [{ parts: [{ text: 'test' }] }]
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ success: true, error: null });
        } else {
          try {
            const error = JSON.parse(body);
            resolve({ success: false, error: error.error });
          } catch {
            resolve({ success: false, error: { code: res.statusCode } });
          }
        }
      });
    });

    req.on('error', (e) => {
      resolve({ success: false, error: { message: e.message } });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: { message: 'timeout' } });
    });

    req.write(data);
    req.end();
  });
}

async function callGemini(prompt, options = {}) {
  const key = getCurrentKey();

  if (!key) {
    throw new Error('All API keys are in cooldown. Please wait and try again.');
  }

  const testResult = await testKey(key);

  if (!testResult.success) {
    const errorCode = testResult.error?.code;

    if (errorCode === 429 || errorCode === 'RESOURCE_EXHAUSTED') {
      markKeyQuotaExceeded(key);
      // Try with next key
      return callGemini(prompt, options);
    }

    if (errorCode === 503 || errorCode === 'UNAVAILABLE') {
      // Server busy, retry with exponential backoff
      await new Promise(r => setTimeout(r, 1000));
      return callGemini(prompt, options);
    }

    throw new Error(`API Error: ${testResult.error?.message || errorCode}`);
  }

  const data = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: options.temperature || 0.7,
      maxOutputTokens: options.maxTokens || 2048,
    }
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      },
      timeout: 30000
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(body);
            const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
            resolve(text || 'No response generated');
          } catch (e) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          try {
            const error = JSON.parse(body);
            if (error.error?.code === 429) {
              markKeyQuotaExceeded(key);
              resolve(callGemini(prompt, options));
            } else {
              reject(new Error(error.error?.message || `HTTP ${res.statusCode}`));
            }
          } catch {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(data);
    req.end();
  });
}

// Export for use as module
module.exports = { callGemini, getCurrentKey, testKey };

// CLI test
if (require.main === module) {
  (async () => {
    console.log('Testing Gemini Auto-Rotation System...\n');
    console.log(`Available keys: ${WORKING_KEYS.length}`);
    console.log(`Current key: ${getCurrentKey()?.substring(0, 20)}...\n`);

    try {
      console.log('Sending test request...');
      const start = Date.now();
      const response = await callGemini('Say "SAI RoloTech API is working!" in one sentence.');
      console.log(`\n✅ SUCCESS (${Date.now() - start}ms)`);
      console.log(`Response: ${response}`);
    } catch (error) {
      console.log(`\n❌ ERROR: ${error.message}`);
    }
  })();
}
