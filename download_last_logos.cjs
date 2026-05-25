const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { finished } = require('stream/promises');

const logos = [
  { id: 'bqu', ext: 'svg', url: 'https://bqu.edu.az/storage/dcc950b1-0106-4fa5-a57a-d4ea3eb8221b.svg' },
  { id: 'bsu', ext: 'svg', url: 'https://slavicuniversityfiles.blob.core.windows.net/photos/logo.svg' },
  { id: 'oyu', ext: 'png', url: 'https://oyu.edu.az/template/img/icons/logo.png' },
  { id: 'bbu', ext: 'png', url: 'https://bbu.edu.az/images/logo_az.png' },
  { id: 'adpu', ext: 'png', url: 'https://upload.wikimedia.org/wikipedia/commons/2/25/Azerbaijan_State_Pedagogical_University_logo.jpg' }
];

const dir = path.join(__dirname, 'public', 'assets', 'logos');

async function downloadImage(url, dest) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
    }
  });
  
  if (!res.ok) throw new Error(`Unexpected status ${res.status}`);
  const fileStream = fs.createWriteStream(dest);
  await finished(Readable.fromWeb(res.body).pipe(fileStream));
}

async function run() {
  console.log('Downloading targeted logos...');
  for (const item of logos) {
    const dest = path.join(dir, `${item.id}.${item.ext}`);
    console.log(`Downloading ${item.id}.${item.ext} from ${item.url}...`);
    try {
      await downloadImage(item.url, dest);
      console.log(`✅ Saved ${item.id}.${item.ext} successfully. Size: ${fs.statSync(dest).size} bytes.`);
    } catch (err) {
      console.log(`❌ Failed to download ${item.id}:`, err.message);
    }
  }
  console.log('All downloads completed!');
}

run();
