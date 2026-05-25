const fs = require('fs');
const path = require('path');

const missing = [
  { id: 'adpu', shortName: 'ADPU', color: '#e67e22' },
  { id: 'bsu', shortName: 'BSU', color: '#2c3e50' },
  { id: 'bqu', shortName: 'BQU', color: '#e91e8c' },
  { id: 'oyu', shortName: 'OYU', color: '#c0392b' },
  { id: 'bbu', shortName: 'BBU', color: '#27ae60' }
];

const dir = path.join(__dirname, 'public', 'assets', 'logos');

missing.forEach(uni => {
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="grad_${uni.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${uni.color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${uni.color}ee;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow_${uni.id}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="${uni.color}" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="400" height="400" rx="100" fill="url(#grad_${uni.id})" filter="url(#shadow_${uni.id})" />
  <text x="50%" y="53%" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="110" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" letter-spacing="4">${uni.shortName}</text>
</svg>`;

  fs.writeFileSync(path.join(dir, `${uni.id}.svg`), svgContent);
  console.log(`Created SVG for ${uni.shortName}`);
});
