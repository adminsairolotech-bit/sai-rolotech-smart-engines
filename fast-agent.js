#!/usr/bin/env node
/**
 * SAI Rolotech FAST AGENT
 * Direct Gemini API - No Gateway
 */

const https = require('https');

const GEMINI_KEYS = [
  "AIzaSyCIoT8GOSCBgDJAVhsdCgGrIciFF8rFvwM",
  "AIzaSyBHOM5z1ilVBRI3O0GKYUpWeiafYGuXIFs",
  "AIzaSyBAwO893tS045H5fLZ_wj4oOLZfPLaHfDM",
  "AIzaSyASiS8WrJLXwi7IyHkEErEbQPLM5VC82ow",
  "AIzaSyDQ9dFgmCBxjxiR3H44FYbSnrsVXEoHtFY",
  "AIzaSyBSOvHwVvV090ewQhDXr4x0M_eoVvoE99I",
  "AIzaSyCmCtYXr65CkwszCzJ_y9N3R4UaHVQlCKE",
  "AIzaSyCkMS3Bk3SIC5EXfHAoyzAMcuazhWe7T9s"
];
let keyIndex = 0;

const SYSTEM = `You are SAI Rolotech FAST AGENT. Be concise. Expert in:
- Roll Forming (C-Channel, Z-Purlin)
- AutoCAD & LISP Scripting
- Video Editing
- Industrial Automation
- Python/JavaScript/TypeScript
Use Hindi/English when helpful.`;

function callGemini(text) {
  return new Promise((resolve) => {
    const apiKey = GEMINI_KEYS[keyIndex % GEMINI_KEYS.length];
    keyIndex++;

    const data = JSON.stringify({
      contents: [{ parts: [{ text: `${SYSTEM}\n\nUser: ${text}` }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 4096 }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };

    const req = https.request(options, (res) => {
      let result = '';
      res.on('data', (chunk) => result += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(result);
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          resolve(text || 'No response');
        } catch (e) {
          resolve('Error: ' + e.message);
        }
      });
    });

    req.on('error', (e) => resolve('Network error: ' + e.message));
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log(`
╔═════════════════════════════════════════╗
║  SAI ROLO TECH - FAST AGENT            ║
║  Direct Gemini API - No Gateway       ║
║  Type 'exit' to quit                   ║
╚═════════════════════════════════════════╝
`);

  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((r) => rl.question(q, r));

  while (true) {
    const input = await ask('\n➜ ');
    if (!input.trim()) continue;
    if (input.toLowerCase() === 'exit') break;

    process.stdout.write('\n⏳ Thinking...\n');
    const response = await callGemini(input);
    console.log('\n' + response + '\n');
  }
  console.log('\n👋 Goodbye!');
  rl.close();
}

main().catch(console.error);
