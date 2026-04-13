#!/usr/bin/env node
/**
 * SAI Rolotech - Auto Tester
 * Automatically tests browser/app after code changes
 */

const https = require('https');
const http = require('http');

const GEMINI_KEYS = [
  "AIzaSyCIoT8GOSCBgDJAVhsdCgGrIciFF8rFvwM",
  "AIzaSyBHOM5z1ilVBRI3O0GKYUpWeiafYGuXIFs"
];

const TESTS = [
  { name: "Dashboard", url: "http://localhost:3333/", expect: "html" },
  { name: "OpenClaw", url: "http://localhost:18789/", expect: "html" },
  { name: "n8n", url: "http://localhost:5678/", expect: "html" },
  { name: "Pinokio", url: "http://localhost:42000/", expect: "html" }
];

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: data.slice(0, 200) }));
    });
    req.on('error', (e) => reject(e));
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function testGemini(text) {
  return new Promise((resolve) => {
    const apiKey = GEMINI_KEYS[0];
    const data = JSON.stringify({
      contents: [{ parts: [{ text: text }] }],
      generationConfig: { maxOutputTokens: 50 }
    });

    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let result = '';
      res.on('data', (c) => result += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(result);
          resolve({ status: res.statusCode, text: json.candidates?.[0]?.content?.parts?.[0]?.text });
        } catch (e) {
          resolve({ status: res.statusCode, error: e.message });
        }
      });
    });
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('\n🔍 SAI ROLO TECH - AUTO TESTER\n');
  console.log('═'.repeat(50));

  // Test Services
  console.log('\n📡 Testing Services:\n');
  for (const test of TESTS) {
    try {
      const result = await httpGet(test.url);
      const icon = result.status === 200 ? '✅' : '❌';
      console.log(`  ${icon} ${test.name}: ${result.status === 200 ? 'UP' : 'DOWN'} (${result.status})`);
    } catch (e) {
      console.log(`  ❌ ${test.name}: ERROR - ${e.message}`);
    }
  }

  // Test Gemini API
  console.log('\n🤖 Testing Gemini API:\n');
  const geminiStart = Date.now();
  try {
    const result = await testGemini("Say 'Working!' in one word");
    const time = Date.now() - geminiStart;
    const icon = result.text ? '✅' : '❌';
    console.log(`  ${icon} Gemini: ${result.text || result.error} (${time}ms)`);
  } catch (e) {
    console.log(`  ❌ Gemini: ERROR - ${e.message}`);
  }

  console.log('\n' + '═'.repeat(50));
  console.log('\n✅ All tests complete!\n');

  // Browser reminder
  console.log('🌐 Browser mein bhi check karo:');
  console.log('   http://localhost:3333');
  console.log('   http://localhost:18789');
  console.log('');
}

runTests().catch(console.error);
