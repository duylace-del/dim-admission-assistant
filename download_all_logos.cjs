const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { finished } = require('stream/promises');

const universities = [
  { id: 'bdu', title: 'Bakı Dövlət Universiteti' },
  { id: 'adnsu', title: 'Azərbaycan Dövlət Neft və Sənaye Universiteti' },
  { id: 'atu', title: 'Azərbaycan Texniki Universiteti' },
  { id: 'unec', title: 'Azərbaycan Dövlət İqtisad Universiteti' },
  { id: 'adpu', title: 'Azərbaycan Dövlət Pedaqoji Universiteti' },
  { id: 'adu', title: 'Azərbaycan Dillər Universiteti' },
  { id: 'amiu', title: 'Azərbaycan Memarlıq və İnşaat Universiteti' },
  { id: 'bsu', title: 'Bakı Slavyan Universiteti' },
  { id: 'atmu', title: 'Azərbaycan Turizm və Menecment Universiteti' },
  { id: 'ada', title: 'ADA Universiteti' },
  { id: 'xezer', title: 'Xəzər Universiteti' },
  { id: 'sdu', title: 'Sumqayıt Dövlət Universiteti' },
  { id: 'gdu', title: 'Gəncə Dövlət Universiteti' },
  { id: 'ldu', title: 'Lənkəran Dövlət Universiteti' },
  { id: 'ndu', title: 'Naxçıvan Dövlət Universiteti' },
  { id: 'mdu', title: 'Mingəçevir Dövlət Universiteti' },
  { id: 'aau', title: 'Azərbaycan Texnologiya Universiteti' },
  { id: 'bmu', title: 'Bakı Mühəndislik Universiteti' },
  { id: 'atyul', title: 'Azərbaycan Tibb Universiteti' },
  { id: 'oia', title: 'Azərbaycan Dövlət Mədəniyyət və İncəsənət Universiteti' },
  { id: 'dia', title: 'Dövlət İdarəçilik Akademiyası (Azərbaycan)' },
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
  
  if (!res.ok) throw new Error(`Unexpected response ${res.statusText}`);
  
  const fileStream = fs.createWriteStream(dest);
  await finished(Readable.fromWeb(res.body).pipe(fileStream));
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  const results = {};
  for (const uni of universities) {
    if (fs.existsSync(path.join(dir, `${uni.id}.png`))) {
      results[uni.id] = `/assets/logos/${uni.id}.png`;
      continue;
    }
    
    const apiUrl = `https://az.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(uni.title)}&prop=pageimages&format=json&pithumbsize=400`;
    try {
      const response = await fetch(apiUrl, { 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
      });
      const data = await response.json();
      const pages = data.query.pages;
      const pageId = Object.keys(pages)[0];
      
      let imgUrl = null;
      if (pages[pageId] && pages[pageId].thumbnail) {
        imgUrl = pages[pageId].thumbnail.source;
      }
      
      if (imgUrl) {
        const dest = path.join(dir, `${uni.id}.png`);
        await downloadImage(imgUrl, dest);
        console.log(`✅ Downloaded ${uni.id} from Wikipedia`);
        results[uni.id] = `/assets/logos/${uni.id}.png`;
      } else {
        console.log(`❌ No image found for ${uni.id} on Wikipedia`);
      }
    } catch (e) {
      console.log(`❌ Error for ${uni.id}:`, e.message);
    }
    await delay(1000); // 1 sec delay
  }
  
  fs.writeFileSync('logo_results.json', JSON.stringify(results, null, 2));
  console.log('Done.');
}

run();
