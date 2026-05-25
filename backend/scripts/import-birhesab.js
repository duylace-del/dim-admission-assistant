#!/usr/bin/env node
/**
 * Fetches specialty data from birhesab.az JS chunks and uploads to our backend.
 */
const https = require('https');
const http = require('http');

const BACKEND = 'http://localhost:3001';
const ADMIN_PASSWORD = 'Armagedon2026';

// birhesab.az chunk file info
const GROUPS = [
  { path: 'qebul-ballari-1ci-qrup', chunk: 'page-379ba05d7395a01a.js', level: 'bakalavr', groupCode: 'I' },
  { path: 'qebul-ballari-2ci-qrup', chunk: 'page-993c3917eed0b2f2.js', level: 'bakalavr', groupCode: 'II' },
  { path: 'qebul-ballari-3cu-qrup', chunk: 'page-0862f0d10165db5d.js', level: 'bakalavr', groupCode: 'III' },
  { path: 'qebul-ballari-4cu-qrup', chunk: 'page-de6be52694aff1c5.js', level: 'bakalavr', groupCode: 'IV' },
  { path: 'qebul-ballari-5ci-qrup', chunk: 'page-fc126102a92b2fa8.js', level: 'bakalavr', groupCode: 'V' },
  { path: 'magistr-kecid-ballari',  chunk: 'page-2f050c3ddbc2076a.js', level: 'magistr',  groupCode: 'I' },
  { path: 'qebul-ballari-11illik-kollec', chunk: 'page-9b142157b903e4f8.js', level: 'kollec_11', groupCode: 'I', hasCode: true },
  { path: 'qebul-ballari-9illik-kollec', chunk: 'page-4d9ab6d6fe452ee3.js', level: 'kollec_9',  groupCode: 'I' },
];

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
      }
    };
    client.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function postJson(path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const opts = {
      hostname: 'localhost',
      port: 3001,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': `Bearer ${token}`,
      }
    };
    const req = http.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch(e) { resolve(d); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function extractArray(text, startPattern) {
  const start = text.search(startPattern);
  if (start < 0) return null;
  let depth = 0, end = -1;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '[' || text[i] === '{') depth++;
    else if (text[i] === ']' || text[i] === '}') {
      depth--;
      if (depth === 0) { end = i + 1; break; }
    }
  }
  if (end < 0) return null;
  // Use Function constructor to safely eval JS object literals
  return new Function(`return ${text.substring(start, end)}`)();
}

function makeId(level, groupCode, uniName, specialtyName, stream, code) {
  const uniSlug = uniName.replace(/\s+/g, '').toLowerCase();
  const nameSlug = specialtyName.replace(/ /g, '+').toLowerCase();
  const streamSlug = stream === 'Q' ? 'q' : 'e';
  // Use code when available (kollec data has codes)
  if (code) return `${level}-${code}-${uniSlug}`;
  return `${level}-${groupCode}-${uniSlug}-${nameSlug}-${streamSlug}`;
}

function convertItems(items, level, groupCode) {
  const seen = new Map(); // id → index in rows, to merge duplicates
  const rows = [];
  for (const item of items) {
    const id = makeId(level, groupCode, item.university, item.specialty, item.stream || 'Ə', item.code || '');
    const row = {
      id,
      name: item.specialty,
      universityName: item.university,
      group: groupCode,
      level,
      language: 'Azərbaycan dili',
      plan: 30,
      bal_odenis: item.score != null ? item.score : null,
      bal_dovlet: item.stateScore != null ? item.stateScore : null,
    };
    if (seen.has(id)) {
      // Merge: fill in missing scores
      const existing = rows[seen.get(id)];
      if (row.bal_odenis !== null && existing.bal_odenis === null) existing.bal_odenis = row.bal_odenis;
      if (row.bal_dovlet !== null && existing.bal_dovlet === null) existing.bal_dovlet = row.bal_dovlet;
    } else {
      seen.set(id, rows.length);
      rows.push(row);
    }
  }
  return rows;
}

async function main() {
  // Login to get token
  console.log('Logging into admin...');
  const loginResp = await new Promise((resolve, reject) => {
    const payload = JSON.stringify({ password: ADMIN_PASSWORD });
    const opts = {
      hostname: 'localhost', port: 3001, path: '/api/admin/login', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    };
    const req = http.request(opts, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(payload); req.end();
  });

  if (!loginResp.success) { console.error('Login failed:', loginResp); process.exit(1); }
  const token = loginResp.token;
  console.log('Login OK, token obtained.\n');

  let totalInserted = 0;

  for (const group of GROUPS) {
    const url = `https://birhesab.az/_next/static/chunks/app/%5Blang%5D/hesablayici/${group.path}/${group.chunk}`;
    console.log(`Fetching ${group.path}...`);

    let text;
    try {
      text = await fetchUrl(url);
    } catch(e) {
      console.error(`  ERROR fetching: ${e.message}`);
      continue;
    }

    // Try both patterns
    let items = extractArray(text, /\[{university:/) || extractArray(text, /\[{code:/);
    if (!items) {
      console.log(`  No data array found in chunk (size=${text.length})`);
      continue;
    }
    console.log(`  Extracted ${items.length} raw items`);

    const rows = convertItems(items, group.level, group.groupCode);
    console.log(`  Converted to ${rows.length} backend rows`);

    // Upload in chunks of 500
    const CHUNK_SIZE = 500;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const batch = rows.slice(i, i + CHUNK_SIZE);
      const result = await postJson('/api/admin/upload', {
        level: group.level,
        specialties: batch,
      }, token);
      if (result.success) {
        totalInserted += result.inserted || batch.length;
        process.stdout.write('.');
      } else {
        console.error(`\n  Upload error: ${JSON.stringify(result)}`);
      }
    }
    console.log(`\n  ✓ Done: ${group.path} (${rows.length} rows)\n`);
  }

  console.log(`\n✅ All done! Total inserted/updated: ${totalInserted}`);
}

main().catch(err => { console.error('Fatal error:', err); process.exit(1); });
