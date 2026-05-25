const fs = require('fs');
const path = require('path');

const localLogos = ['ada', 'adnsu', 'adu', 'amiu', 'atmu', 'atu', 'bdu', 'ldu', 'unec'];
const externalLogos = {
  'sdu': 'https://sdu.edu.az/assets/images/logo.png',
  'ndu': 'https://ndu.edu.az/assets/images/ndulogo.png'
};

const filePath = path.join(__dirname, 'src', 'data', 'universities.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Regex to find each university object
const uniRegex = /(id:\s*'([^']+)'[\s\S]*?emoji:\s*'[^']+')/g;

content = content.replace(uniRegex, (match, body, id) => {
  // If logo is already in the object, don't duplicate (though we know we removed them except ndu and sdu)
  if (body.includes('\n    logo:')) {
     return body;
  }

  let logoUrl = '';
  if (localLogos.includes(id)) {
    logoUrl = `/assets/logos/${id}.png`;
  } else if (externalLogos[id]) {
    logoUrl = externalLogos[id];
  } else {
    // Extract website to use duckduckgo
    const webMatch = match.match(/website:\s*'https?:\/\/([^/']+)/);
    if (webMatch && webMatch[1]) {
      let domain = webMatch[1].replace(/^www\./, '');
      logoUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
    }
  }

  if (logoUrl) {
    return `${body},\n    logo: '${logoUrl}'`;
  }
  return body;
});

// Remove existing logo lines for sdu and ndu so they aren't duplicated
content = content.replace(/emoji: '[^']+',\n    logo: '[^']+',\n    logo:/g, "emoji: 'X',\n    logo:"); // Just a safe guard

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Universities updated!');
