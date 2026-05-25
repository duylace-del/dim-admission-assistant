const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { finished } = require('stream/promises');

const universities = [
  { id: 'adpu', title: 'Azərbaycan Dövlət Pedaqoji Universiteti loqo' },
  { id: 'bsu', title: 'Bakı Slavyan Universiteti loqo' },
  { id: 'xezer', title: 'Xəzər Universiteti loqo' },
  { id: 'gdu', title: 'Gəncə Dövlət Universiteti loqo' },
  { id: 'mdu', title: 'Mingəçevir Dövlət Universiteti loqo' },
  { id: 'aau', title: 'Azərbaycan Texnologiya Universiteti loqo' },
  { id: 'bmu', title: 'Bakı Mühəndislik Universiteti loqo' },
  { id: 'atyul', title: 'Azərbaycan Tibb Universiteti loqo' },
  { id: 'oia', title: 'Azərbaycan Dövlət Mədəniyyət və İncəsənət Universiteti loqo' },
  { id: 'dia', title: 'Dövlət İdarəçilik Akademiyası loqo' },
  { id: 'oyu', title: 'Odlar Yurdu Universiteti loqo' },
  { id: 'bbu', title: 'Bakı Biznes Universiteti loqo' },
  { id: 'bqu', title: 'Bakı Qızlar Universiteti loqo' },
  { id: 'adau', title: 'Azərbaycan Dövlət Aqrar Universiteti loqo' },
  { id: 'beau', title: 'Bakı Avrasiya Universiteti loqo' },
  { id: 'qku', title: 'Qərbi Kaspi Universiteti loqo' }
];

const dir = path.join(__dirname, 'public', 'assets', 'logos');

async function downloadImage(url, dest) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  if (!res.ok) throw new Error(`Status ${res.status}`);
  const fileStream = fs.createWriteStream(dest);
  await finished(Readable.fromWeb(res.body).pipe(fileStream));
}

async function run() {
  for (const uni of universities) {
    if (fs.existsSync(path.join(dir, `${uni.id}.png`)) || fs.existsSync(path.join(dir, `${uni.id}.jpg`))) {
      continue;
    }
    console.log(`Searching for ${uni.title}...`);
    try {
      // 1. Get DuckDuckGo HTML
      const searchRes = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(uni.title)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' }
      });
      const html = await searchRes.text();
      
      // Look for the first image that looks like a logo or is a wikimedia thumb
      // duckduckgo html has <img class="result__icon__img" src="//external-content.duckduckgo.com/iu/?u=..." />
      const imgMatch = html.match(/src="\/\/external-content\.duckduckgo\.com\/iu\/\?u=([^"]+)"/);
      
      if (imgMatch && imgMatch[1]) {
        let imgUrl = decodeURIComponent(imgMatch[1]);
        if (imgUrl.includes('f=')) imgUrl = imgUrl.split('&f=')[0]; // clean url
        console.log(`Found image: ${imgUrl}`);
        
        try {
          await downloadImage(imgUrl, path.join(dir, `${uni.id}.png`));
          console.log(`✅ Downloaded ${uni.id}`);
        } catch(e) {
          console.log(`❌ Failed download:`, e.message);
        }
      } else {
        console.log(`❌ No image found in HTML`);
      }
    } catch(e) {
      console.log(`❌ Error:`, e.message);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
}

run();
