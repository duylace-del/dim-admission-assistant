const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { finished } = require('stream/promises');

const universities = [
  { id: 'unec', title: 'Azərbaycan Dövlət İqtisad Universiteti' },
  { id: 'adpu', title: 'Azərbaycan Dövlət Pedaqoji Universiteti' },
  { id: 'amiu', title: 'Azərbaycan Memarlıq və İnşaat Universiteti' },
  { id: 'atmu', title: 'Azərbaycan Turizm və Menecment Universiteti' },
  { id: 'ldu', title: 'Lənkəran Dövlət Universiteti' },
  { id: 'mdu', title: 'Mingəçevir Dövlət Universiteti' },
  { id: 'aau', title: 'Azərbaycan Texnologiya Universiteti' },
  { id: 'atyul', title: 'Azərbaycan Tibb Universiteti' },
  { id: 'oia', title: 'Azərbaycan Dövlət Mədəniyyət və İncəsənət Universiteti' },
  { id: 'oyu', title: 'Odlar Yurdu Universiteti' },
  { id: 'bbu', title: 'Bakı Biznes Universiteti' },
  { id: 'bqu', title: 'Bakı Qızlar Universiteti' },
  { id: 'adau', title: 'Azərbaycan Dövlət Aqrar Universiteti' },
  { id: 'qku', title: 'Qərbi Kaspi Universiteti' }
];

const dir = path.join(__dirname, 'public', 'assets', 'logos');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

async function downloadImage(url, dest) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const fileStream = fs.createWriteStream(dest);
  await finished(Readable.fromWeb(res.body).pipe(fileStream));
}

async function run() {
  console.log('Starting exact Wikipedia infobox image scraping...');
  
  for (const uni of universities) {
    console.log(`Scraping Wikipedia page for "${uni.title}"...`);
    try {
      const pageUrl = `https://az.wikipedia.org/wiki/${encodeURIComponent(uni.title.replace(/ /g, '_'))}`;
      const res = await fetch(pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      if (!res.ok) {
        console.log(`❌ Failed to fetch page for ${uni.id}: HTTP ${res.status}`);
        continue;
      }
      
      const html = await res.text();
      
      // We look for images in upload.wikimedia.org/wikipedia/
      // Usually, logos are in the infobox, so we prioritize the first 1-2 images in the page that match
      const imgRegex = /upload\.wikimedia\.org\/wikipedia\/(az|commons)\/[^\x22'\s>]+/gi;
      let match;
      let foundUrl = null;
      
      while ((match = imgRegex.exec(html)) !== null) {
        let cleanUrl = 'https://' + match[0];
        // Clean trailing backslashes or formatting artifacts
        cleanUrl = cleanUrl.replace(/\\/g, '').replace(/,/g, '');
        
        // Skip common icons / flags / generic wikimedia images
        const urlLower = cleanUrl.toLowerCase();
        if (
          urlLower.includes('flag_of') || 
          urlLower.includes('coat_of_arms') || 
          urlLower.includes('commons-logo') || 
          urlLower.includes('ambox_') ||
          urlLower.includes('original-t') || // Skip Bakı Slavyan's if checking other pages
          urlLower.includes('wikipedia-logo')
        ) {
          continue;
        }
        
        foundUrl = cleanUrl;
        break; // Take the first valid matching image
      }
      
      if (foundUrl) {
        // If it's a thumbnail (has /thumb/ and trailing /250px-...), let's convert to full size!
        let fullUrl = foundUrl;
        if (foundUrl.includes('/thumb/')) {
          fullUrl = foundUrl.replace('/thumb/', '/');
          const lastSlash = fullUrl.lastIndexOf('/');
          if (fullUrl.includes('.png/') || fullUrl.includes('.jpg/') || fullUrl.includes('.svg/')) {
            fullUrl = fullUrl.substring(0, lastSlash);
          }
        }
        
        console.log(`Found logo URL for ${uni.id}: ${fullUrl}`);
        const dest = path.join(dir, `${uni.id}.png`);
        await downloadImage(fullUrl, dest);
        console.log(`✅ Saved ${uni.id}.png (${fs.statSync(dest).size} bytes)`);
      } else {
        console.log(`❌ No suitable logo image found on Wikipedia for ${uni.id}`);
        
        // Fallback: direct site paths if available
        if (uni.id === 'adpu') {
          await downloadImage('https://adpu.edu.az/templates/adpu/images/logo-az.png', path.join(dir, `${uni.id}.png`));
          console.log(`✅ Saved ${uni.id}.png via fallback site`);
        } else if (uni.id === 'gdu') {
          await downloadImage('https://gdu.edu.az/wp-content/uploads/2018/07/GSU-LOGO-2018.png', path.join(dir, `${uni.id}.png`));
          console.log(`✅ Saved ${uni.id}.png via fallback site`);
        } else if (uni.id === 'mdu') {
          await downloadImage('https://mdu.edu.az/wp-content/uploads/2021/11/logo.png', path.join(dir, `${uni.id}.png`));
          console.log(`✅ Saved ${uni.id}.png via fallback site`);
        }
      }
    } catch (e) {
      console.log(`❌ Error for ${uni.id}:`, e.message);
    }
    
    // 1s delay to be nice
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('Wikipedia infobox scraping completed.');
}

run();
