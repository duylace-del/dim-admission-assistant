const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { finished } = require('stream/promises');

const url = 'https://upload.wikimedia.org/wikipedia/az/7/7c/ADPU.jpeg';
const dest = path.join(__dirname, 'public', 'assets', 'logos', 'adpu.png');

async function download() {
  console.log(`Downloading ADPU logo from ${url}...`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const fileStream = fs.createWriteStream(dest);
    await finished(Readable.fromWeb(res.body).pipe(fileStream));
    console.log(`✅ ADPU logo saved successfully. Size: ${fs.statSync(dest).size} bytes.`);
  } catch (e) {
    console.error(`❌ Failed:`, e.message);
  }
}

download();
