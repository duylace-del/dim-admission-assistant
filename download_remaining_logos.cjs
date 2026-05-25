const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { finished } = require('stream/promises');

const universities = [
  { id: 'adpu', title: 'Azərbaycan Dövlət Pedaqoji Universiteti' },
  { id: 'bsu', title: 'Bakı Slavyan Universiteti' },
  { id: 'xezer', title: 'Xəzər Universiteti' },
  { id: 'gdu', title: 'Gəncə Dövlət Universiteti' },
  { id: 'mdu', title: 'Mingəçevir Dövlət Universiteti' },
  { id: 'aau', title: 'Azərbaycan Texnologiya Universiteti' },
  { id: 'bmu', title: 'Bakı Mühəndislik Universiteti' },
  { id: 'atyul', title: 'Azərbaycan Tibb Universiteti' },
  { id: 'oia', title: 'Azərbaycan Dövlət Mədəniyyət və İncəsənət Universiteti' },
  { id: 'dia', title: 'Azərbaycan Respublikası Prezidenti yanında Dövlət İdarəçilik Akademiyası' },
  { id: 'oyu', title: 'Odlar Yurdu Universiteti' },
  { id: 'bbu', title: 'Bakı Biznes Universiteti' },
  { id: 'bqu', title: 'Bakı Qızlar Universiteti' },
  { id: 'adau', title: 'Azərbaycan Dövlət Aqrar Universiteti' },
  { id: 'beau', title: 'Bakı Avrasiya Universiteti' },
  { id: 'qku', title: 'Qərbi Kaspi Universiteti' }
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
    if (fs.existsSync(path.join(dir, `${uni.id}.png`))) {
      console.log(`Skipping ${uni.id}, already downloaded.`);
      continue;
    }
    
    console.log(`Fetching Wikipedia page for ${uni.title}...`);
    try {
      const pageUrl = `https://az.wikipedia.org/wiki/${encodeURIComponent(uni.title)}`;
      const pageRes = await fetch(pageUrl, { 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const html = await pageRes.text();
      
      // Parse infobox image
      // usually looks like: <td class="infobox-image"><a ...><img alt="..." src="//upload.wikimedia.org/wikipedia/az/thumb/3/30/ADPU_loqosu.png/200px-ADPU_loqosu.png" ...></a></td>
      const imgRegex = /<td[^>]*class="infobox-image"[^>]*>[\s\S]*?<img[^>]*src="\/\/([^"]+)"/i;
      const match = html.match(imgRegex);
      
      let imgUrl = null;
      if (match && match[1]) {
        imgUrl = `https://${match[1]}`;
      } else {
        // Fallback: just find the first image that has 'logo' or 'loqosu' or 'emblem' in the URL inside the infobox
        const logoRegex = /<table[^>]*class="infobox[^>]*>[\s\S]*?<img[^>]*src="\/\/([^"]+(logo|loqo|emblem|universiteti)[^"]*)"/i;
        const logoMatch = html.match(logoRegex);
        if (logoMatch && logoMatch[1]) {
          imgUrl = `https://${logoMatch[1]}`;
        }
      }
      
      if (imgUrl) {
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
    await delay(1500); // 1.5 sec delay
  }
}

run();
