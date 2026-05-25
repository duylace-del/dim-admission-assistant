const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { finished } = require('stream/promises');

const logos = {
  'adpu.png':'https://adpu.edu.az/templates/adpu/images/logo-az.png',
  'bsu.png':'https://bsu.edu.az/img/logo.png', // Corrected BSU
  'gdu.png':'https://gdu.edu.az/wp-content/uploads/2018/07/GSU-LOGO-2018.png',
  'mdu.png':'https://mdu.edu.az/wp-content/uploads/2021/11/logo.png',
  'aau.png':'https://upload.wikimedia.org/wikipedia/az/d/d1/Az%C9%99rbaycan_Texnologiya_Universitetinin_loqosu.png',
  'bmu.png':'https://upload.wikimedia.org/wikipedia/en/c/cc/Baku_Engineering_University_-_logo.png',
  'atyul.png':'https://amu.edu.az/images/logo_az.png',
  'oia.png': 'https://admiu.edu.az/images/logo.png',
  'bqu.png': 'https://bqu.edu.az/images/logo.png',
  'adau.png': 'https://adau.edu.az/assets/images/logo.png',
  'beau.png': 'https://baau.edu.az/images/logo.png',
  'dia.png': 'https://upload.wikimedia.org/wikipedia/az/0/0b/D%C3%B6vl%C9%99t_%C4%B0dar%C9%99%C3%A7ilik_Akademiyas%C4%B1_loqo.png', // Direct from wiki
  'oyu.png': 'https://upload.wikimedia.org/wikipedia/az/thumb/3/31/Odlar_Yurdu_Universitetinin_loqosu.png/300px-Odlar_Yurdu_Universitetinin_loqosu.png',
  'bbu.png': 'https://upload.wikimedia.org/wikipedia/az/thumb/8/87/BBU_logo.png/300px-BBU_logo.png'
};

const dir = path.join(__dirname, 'public', 'assets', 'logos');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

async function downloadImage(url, dest) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
      }
    });
    
    if (!res.ok) {
       console.log(`Failed ${dest}: ${res.status}`);
       return;
    }
    
    const fileStream = fs.createWriteStream(dest);
    await finished(Readable.fromWeb(res.body).pipe(fileStream));
    console.log(`✅ Saved ${path.basename(dest)}`);
  } catch (e) {
    console.log(`❌ Error for ${url}:`, e.message);
  }
}

async function run() {
  for (const [name, url] of Object.entries(logos)) {
    const dest = path.join(dir, name);
    console.log(`Downloading ${name} from ${url}...`);
    await downloadImage(url, dest);
    // Be polite with a small delay
    await new Promise(r => setTimeout(r, 1000));
  }
}

run();
