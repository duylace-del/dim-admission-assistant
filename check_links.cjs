const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Extract URLs from universities.ts
const content = fs.readFileSync(path.join(__dirname, 'src/data/universities.ts'), 'utf-8');
const websiteRegex = /website:\s*'([^']+)'/g;
const nameRegex = /name:\s*'([^']+)'/g;

let match;
const urls = [];
const names = [];

while ((match = websiteRegex.exec(content)) !== null) {
  urls.push(match[1]);
}
while ((match = nameRegex.exec(content)) !== null) {
  names.push(match[1]);
}

async function checkUrl(url, name) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    // Some AZ sites block non-browser user agents
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      }
    });
    
    clearTimeout(timeout);
    
    if (res.ok || res.status === 403 || res.status === 401) {
      console.log(`✅ [${res.status}] ${url} (${name})`);
    } else {
      console.log(`❌ [${res.status}] ${url} (${name})`);
    }
  } catch (error) {
    console.log(`❌ [Error: ${error.message}] ${url} (${name})`);
  }
}

async function run() {
  console.log('Checking URLs...');
  // Check sequentially to not get blocked
  for (let i = 0; i < urls.length; i++) {
    await checkUrl(urls[i], names[i]);
  }
}

run();
