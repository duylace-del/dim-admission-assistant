const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'data', 'universities.ts');
let content = fs.readFileSync(filePath, 'utf-8');

const svgs = ['adpu', 'bsu', 'bqu', 'oyu', 'bbu'];

// Regex to match duckduckgo logos or any logo that isn't already local or ndu/sdu
const regex = /logo:\s*'https:\/\/icons\.duckduckgo\.com\/[^']+'/g;

// Also match the ones we failed on duckduckgo earlier but now we have local images for them
const uniregex = /id:\s*'([^']+)'[\s\S]*?logo:\s*'([^']+)'/g;

content = content.replace(uniregex, (match, id, oldLogoUrl) => {
  if (oldLogoUrl.includes('/assets/logos/') || id === 'sdu' || id === 'ndu') {
    return match; // keep as is
  }
  
  const ext = svgs.includes(id) ? 'svg' : 'png';
  const newLogo = `/assets/logos/${id}.${ext}`;
  
  return match.replace(`logo: '${oldLogoUrl}'`, `logo: '${newLogo}'`);
});

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Universities finalized.');
