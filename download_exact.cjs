const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { finished } = require('stream/promises');

const exactUrls = {
  'adpu.png': 'https://upload.wikimedia.org/wikipedia/az/3/30/ADPU_loqosu.png',
  'bsu.png': 'https://upload.wikimedia.org/wikipedia/az/4/4e/Bak%C4%B1_Slavyan_Universiteti_logo.png',
  'dia.png': 'https://upload.wikimedia.org/wikipedia/az/0/0b/D%C3%B6vl%C9%99t_%C4%B0dar%C9%99%C3%A7ilik_Akademiyas%C4%B1_loqo.png',
  'oyu.png': 'https://upload.wikimedia.org/wikipedia/az/3/31/Odlar_Yurdu_Universitetinin_loqosu.png',
  'bbu.png': 'https://upload.wikimedia.org/wikipedia/az/8/87/BBU_logo.png',
  'bqu.png': 'https://upload.wikimedia.org/wikipedia/az/2/23/Bak%C4%B1_Q%C4%B1zlar_Universiteti_loqotip.png'
};

const dir = path.join(__dirname, 'public', 'assets', 'logos');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

async function downloadImage(url, dest) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  
  if (!res.ok) throw new Error(`Unexpected response ${res.status}`);
  
  const fileStream = fs.createWriteStream(dest);
  await finished(Readable.fromWeb(res.body).pipe(fileStream));
}

async function run() {
  for (const [name, url] of Object.entries(exactUrls)) {
    const dest = path.join(dir, name);
    try {
      await downloadImage(url, dest);
      console.log(`✅ Downloaded ${name}`);
    } catch (e) {
      console.log(`❌ Error for ${name}:`, e.message);
    }
  }
}

run();
