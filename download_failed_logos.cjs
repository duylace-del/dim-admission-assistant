const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { finished } = require('stream/promises');

// The ones that failed or need high quality live logos
const universities = [
  { id: 'unec', title: 'Azərbaycan Dövlət İqtisad Universiteti loqo' },
  { id: 'adpu', title: 'Azərbaycan Dövlət Pedaqoji Universiteti logo' },
  { id: 'amiu', title: 'Azərbaycan Memarlıq və İnşaat Universiteti logo' },
  { id: 'atmu', title: 'Azərbaycan Turizm və Menecment Universiteti logo' },
  { id: 'ldu', title: 'Lənkəran Dövlət Universiteti logo' },
  { id: 'mdu', title: 'Mingəçevir Dövlət Universiteti logo' },
  { id: 'aau', title: 'Azərbaycan Texnologiya Universiteti logo' },
  { id: 'atyul', title: 'Azərbaycan Tibb Universiteti logo' },
  { id: 'oia', title: 'Azərbaycan Dövlət Mədəniyyət və İncəsənət Universiteti logo' },
  { id: 'oyu', title: 'Odlar Yurdu Universiteti logo' },
  { id: 'bbu', title: 'Bakı Biznes Universiteti logo' },
  { id: 'bqu', title: 'Bakı Qızlar Universiteti logo' },
  { id: 'adau', title: 'Azərbaycan Dövlət Aqrar Universiteti logo' },
  { id: 'qku', title: 'Qərbi Kaspi Universiteti logo' }
];

const dir = path.join(__dirname, 'public', 'assets', 'logos');

async function downloadImage(url, dest) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
    }
  });
  if (!res.ok) throw new Error(`Status ${res.status}`);
  const fileStream = fs.createWriteStream(dest);
  await finished(Readable.fromWeb(res.body).pipe(fileStream));
}

async function run() {
  console.log('Downloading remaining logos via DDG search engine...');
  for (const uni of universities) {
    console.log(`Searching for ${uni.title}...`);
    try {
      const searchRes = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(uni.title + " png")}`, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
        }
      });
      const html = await searchRes.text();
      
      const imgMatch = html.match(/src="\/\/external-content\.duckduckgo\.com\/iu\/\?u=([^"]+)"/);
      
      if (imgMatch && imgMatch[1]) {
        let imgUrl = decodeURIComponent(imgMatch[1]);
        if (imgUrl.includes('f=')) imgUrl = imgUrl.split('&f=')[0]; // clean URL
        console.log(`Found image: ${imgUrl}`);
        
        try {
          await downloadImage(imgUrl, path.join(dir, `${uni.id}.png`));
          console.log(`✅ Successfully saved ${uni.id}.png (${fs.statSync(path.join(dir, `${uni.id}.png`)).size} bytes)`);
        } catch(e) {
          console.log(`❌ Failed download from ${imgUrl}:`, e.message);
          // Try a second match if possible
          const secondMatch = html.match(/src="\/\/external-content\.duckduckgo\.com\/iu\/\?u=([^"]+)"/g);
          if (secondMatch && secondMatch[1]) {
             let imgUrl2 = decodeURIComponent(secondMatch[1].match(/u=([^"]+)/)[1]);
             console.log(`Trying fallback image: ${imgUrl2}`);
             await downloadImage(imgUrl2, path.join(dir, `${uni.id}.png`));
             console.log(`✅ Successfully saved ${uni.id}.png via fallback`);
          }
        }
      } else {
        console.log(`❌ No image found in DDG HTML`);
      }
    } catch(e) {
      console.log(`❌ Error searching for ${uni.id}:`, e.message);
    }
    // 2s delay to prevent block
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log('Finished downloading remaining logos.');
}

run();
