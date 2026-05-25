const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { finished } = require('stream/promises');

const universities = [
  { id: 'adpu', title: 'Azərbaycan Dövlət Pedaqoji Universiteti' },
  { id: 'bsu', title: 'Bakı Slavyan Universiteti' },
  { id: 'bqu', title: 'Bakı Qızlar Universiteti' },
  { id: 'dia', title: 'Dövlət İdarəçilik Akademiyası (Azərbaycan)' },
  { id: 'oyu', title: 'Odlar Yurdu Universiteti' },
  { id: 'bbu', title: 'Bakı Biznes Universiteti' }
];

const dir = path.join(__dirname, 'public', 'assets', 'logos');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

async function downloadImage(url, dest) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Referer': 'https://az.wikipedia.org/'
    }
  });
  
  if (!res.ok) throw new Error(`Unexpected response ${res.status} ${res.statusText}`);
  
  const fileStream = fs.createWriteStream(dest);
  await finished(Readable.fromWeb(res.body).pipe(fileStream));
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  for (const uni of universities) {
    console.log(`Fetching Wikipedia page for ${uni.title}...`);
    try {
      const pageUrl = `https://az.wikipedia.org/wiki/${encodeURIComponent(uni.title)}`;
      const pageRes = await fetch(pageUrl, { 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const html = await pageRes.text();
      
      const imgRegex = /<td[^>]*class="infobox-image"[^>]*>[\s\S]*?<img[^>]*src="\/\/([^"]+)"/i;
      const match = html.match(imgRegex);
      
      let imgUrl = null;
      if (match && match[1]) {
        imgUrl = `https://${match[1]}`;
        // If it's the commons logo, reject it
        if (imgUrl.includes('Commons-logo')) imgUrl = null;
      } 
      
      if (!imgUrl) {
        const logoRegex = /<table[^>]*class="infobox[^>]*>[\s\S]*?<img[^>]*src="\/\/([^"]+(logo|loqo|emblem|universiteti)[^"]*)"/i;
        const logoMatch = html.match(logoRegex);
        if (logoMatch && logoMatch[1]) {
          imgUrl = `https://${logoMatch[1]}`;
        }
      }
      
      if (imgUrl) {
        // Change thumb to full size if possible by removing /thumb/ and the trailing filename
        imgUrl = imgUrl.replace(/\/thumb\//, '/');
        const lastSlash = imgUrl.lastIndexOf('/');
        if (imgUrl.includes('.png/') || imgUrl.includes('.jpg/') || imgUrl.includes('.svg/')) {
           imgUrl = imgUrl.substring(0, lastSlash);
        }

        console.log(`Found image URL for ${uni.id}: ${imgUrl}`);
        const dest = path.join(dir, `${uni.id}.png`);
        await downloadImage(imgUrl, dest);
        console.log(`✅ Downloaded ${uni.id}`);
      } else {
        console.log(`❌ No infobox image found for ${uni.id} on Wikipedia`);
      }
    } catch (e) {
      console.log(`❌ Error for ${uni.id}:`, e.message);
    }
    await delay(5000); // 5 sec delay to absolutely avoid 429
  }
}

run();
