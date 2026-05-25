const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { finished } = require('stream/promises');

const logos = {
  bdu: 'https://upload.wikimedia.org/wikipedia/az/d/df/Bak%C4%B1_D%C3%B6vl%C9%99t_Universitetinin_loqosu.png',
  adnsu: 'https://iconape.com/wp-content/files/gz/192527/png/192527.png',
  atu: 'https://upload.wikimedia.org/wikipedia/commons/3/39/AzTU-logo-vertical.png',
  unec: 'https://upload.wikimedia.org/wikipedia/az/d/d4/UNEC_1.png',
  adpu: 'https://adpu.edu.az/templates/adpu/images/logo-az.png',
  adu: 'https://upload.wikimedia.org/wikipedia/az/5/5b/ADU-nun_loqosu.png',
  amiu: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Az%C9%99rbaycan_Memarl%C4%B1q_v%C9%99_%C4%B0n%C5%9Faat_Universiteti.png',
  bsu: 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Logo_original-t.png',
  atmu: 'https://upload.wikimedia.org/wikipedia/az/9/91/ATMU_loqosu.png',
  ada: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Adalogonew.png',
  xezer: 'https://khazar.org/uploads/khazar_in_brief/logo.png',
  sdu: 'https://sdu.edu.az/assets/images/logo.png',
  gdu: 'https://gdu.edu.az/wp-content/uploads/2018/07/GSU-LOGO-2018.png',
  ldu: 'https://upload.wikimedia.org/wikipedia/az/2/22/L%C9%99nk%C9%99ran_D%C3%B6vl%C9%99t_Universitetinin_loqosu.png',
  ndu: 'https://ndu.edu.az/assets/images/ndulogo.png',
  mdu: 'https://mdu.edu.az/wp-content/uploads/2021/11/logo.png',
  aau: 'https://upload.wikimedia.org/wikipedia/az/d/d1/Az%C9%99rbaycan_Texnologiya_Universitetinin_loqosu.png',
  bmu: 'https://upload.wikimedia.org/wikipedia/commons/7/76/Baku_Engineering_University_-_logo.png',
  atyul: 'https://amu.edu.az/images/logo_amu.png',
  oia: 'https://admiu.edu.az/images/logo.png',
  dia: 'https://upload.wikimedia.org/wikipedia/az/0/03/D%C4%B0A.jpg',
  oyu: 'https://upload.wikimedia.org/wikipedia/az/3/31/Odlar_Yurdu_Universitetinin_loqosu.png',
  bbu: 'https://upload.wikimedia.org/wikipedia/az/8/87/BBU_logo.png',
  bqu: 'https://bqu.edu.az/images/logo.png',
  adau: 'https://adau.edu.az/assets/images/logo.png',
  beau: 'https://baau.edu.az/images/logo.png',
  qku: 'https://upload.wikimedia.org/wikipedia/commons/b/b2/WCU_Logo_New_White.png'
};

const dir = path.join(__dirname, 'public', 'assets', 'logos');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

async function downloadImage(url, name) {
  const dest = path.join(dir, `${name}.png`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
      }
    });
    
    if (!res.ok) {
      console.log(`❌ Failed ${name}: HTTP ${res.status}`);
      return false;
    }
    
    const fileStream = fs.createWriteStream(dest);
    await finished(Readable.fromWeb(res.body).pipe(fileStream));
    console.log(`✅ Downloaded and saved ${name}.png (${fs.statSync(dest).size} bytes)`);
    return true;
  } catch (e) {
    console.log(`❌ Error for ${name}:`, e.message);
    return false;
  }
}

async function run() {
  console.log('Starting downloading all correct logos...');
  for (const [name, url] of Object.entries(logos)) {
    console.log(`Fetching logo for ${name}...`);
    await downloadImage(url, name);
    // 500ms delay to be polite
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('Finished downloading all logos.');
}

run();
