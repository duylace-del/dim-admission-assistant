#!/usr/bin/env node
/**
 * Exports all specialties from the backend to an Excel file.
 * Usage: node export-specialties.js
 * Output: dim_specialties_export_YYYY-MM-DD.xlsx on the Desktop
 */
const http = require('http');
const path = require('path');
const os = require('os');

// Try to require xlsx — install if missing: npm install xlsx
let XLSX;
try {
  XLSX = require('xlsx');
} catch (e) {
  console.error('xlsx not installed. Run: npm install xlsx');
  process.exit(1);
}

const BACKEND = 'http://localhost:3001';
const ADMIN_PASSWORD = 'Armagedon2026';

const LEVELS = ['bakalavr', 'magistr', 'rezidentura', 'kollec_9', 'kollec_11', 'subbakalavr'];

const levelLabels = {
  bakalavr: 'Bakalavriat',
  magistr: 'Magistratura',
  rezidentura: 'Rezidentura',
  kollec_9: 'Kollec (9-illik)',
  kollec_11: 'Kollec (11-illik)',
  subbakalavr: 'Subbakalavr',
};

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

async function login() {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ password: ADMIN_PASSWORD });
    const opts = {
      hostname: 'localhost', port: 3001, path: '/api/admin/login', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    };
    const req = http.request(opts, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({}); } });
    });
    req.on('error', reject);
    req.write(payload); req.end();
  });
}

async function main() {
  console.log('Logging in to backend...');
  const loginResp = await login();
  if (!loginResp.success) {
    console.error('Login failed:', loginResp);
    process.exit(1);
  }
  console.log('Login OK.\n');

  const wb = XLSX.utils.book_new();
  let totalRows = 0;

  for (const level of LEVELS) {
    process.stdout.write(`Fetching ${level}...`);
    let page = 0;
    let allSpecs = [];

    // Fetch all (backend may paginate at 1000, so loop)
    while (true) {
      const json = await fetchUrl(
        `${BACKEND}/api/specialties?level=${level}&limit=2000&offset=${page * 2000}`
      );
      const specs = json.data || [];
      if (specs.length === 0) break;
      allSpecs = allSpecs.concat(specs);
      if (specs.length < 2000) break;
      page++;
    }

    console.log(` ${allSpecs.length} ixtisas`);
    totalRows += allSpecs.length;

    if (allSpecs.length === 0) continue;

    const rows = allSpecs.map((s, i) => ({
      'Sıra': i + 1,
      'İxtisas Adı': s.name || '',
      'Universitet/Kollec': s.university_name || s.universityName || '',
      'Qısa Ad': s.university_short || s.universityShort || '',
      'Şəhər': s.city || '',
      'Region': s.region || '',
      'Qrup': s.group_code || s.group || '',
      'Səviyyə': levelLabels[level] || level,
      'Dil': s.language || 'Azərbaycan dili',
      'Ödənişli Keçid Balı': s.bal_odenis ?? '',
      'Dövlət Yeri Balı': s.bal_dovlet ?? '',
      'Plan Yeri': s.plan_places || s.plan || '',
      'Müraciətçi': s.applicants || '',
      'Xüsusi Qabiliyyət': s.is_special || s.isSpecial ? 'Bəli' : 'Xeyr',
      'ID': s.id || '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Column widths
    ws['!cols'] = [
      { wch: 6 }, { wch: 50 }, { wch: 55 }, { wch: 20 }, { wch: 14 },
      { wch: 16 }, { wch: 8 }, { wch: 16 }, { wch: 20 },
      { wch: 20 }, { wch: 18 }, { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 45 },
    ];

    // Sheet name max 31 chars
    const sheetName = levelLabels[level].substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  // Summary sheet
  const summaryRows = LEVELS.map(l => ({
    'Səviyyə': levelLabels[l] || l,
    'İxtisas Sayı': 'bax ayrıca vərəqə',
  }));
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Xülasə');

  // Output file
  const today = new Date().toISOString().slice(0, 10);
  const outputPath = path.join(os.homedir(), 'Desktop', `dim_specialties_${today}.xlsx`);

  XLSX.writeFile(wb, outputPath);

  console.log(`\n✅ Export tamamlandı!`);
  console.log(`📁 Fayl: ${outputPath}`);
  console.log(`📊 Ümumi: ${totalRows} ixtisas`);
}

main().catch(err => { console.error('Xəta:', err); process.exit(1); });
