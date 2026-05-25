import fs from 'fs';

// Load 9-year colleges
const colleges9 = JSON.parse(fs.readFileSync('./src/data/scraped_colleges_9.json', 'utf8'));
const unique9 = colleges9.map(c => c.name);

console.log("=== 9-Year Unique Colleges ===");
console.log(unique9);
console.log("Count:", unique9.length);

// 11-year colleges from AdminPanel
const adminPanelContent = fs.readFileSync('./src/pages/AdminPanel.tsx', 'utf8');
const seededKollec11Match = adminPanelContent.match(/const seededKollec11 = (\[[\s\S]*?\]);/);
if (seededKollec11Match) {
  // Replace string matches to parse safely via JSON-like evaluation
  const seededText = seededKollec11Match[1]
    .replace(/id:/g, '"id":')
    .replace(/ixtisasKodu:/g, '"ixtisasKodu":')
    .replace(/ixtisasAdi:/g, '"ixtisasAdi":')
    .replace(/universitetId:/g, '"universitetId":')
    .replace(/odenis:/g, '"odenis":')
    .replace(/bal2425:/g, '"bal2425":')
    .replace(/bal2526:/g, '"bal2526":')
    .replace(/planYeri:/g, '"planYeri":')
    .replace(/level:/g, '"level":')
    .replace(/isSpecial:/g, '"isSpecial":')
    .replace(/'/g, '"')
    .replace(/,(\s*[\}\]])/g, '$1'); // clean trailing commas
  
  const seeded11 = JSON.parse(seededText);
  const unique11 = [...new Set(seeded11.map(s => s.universitetId))];
  console.log("\n=== 11-Year Unique Colleges ===");
  console.log(unique11);
  console.log("Count:", unique11.length);
  
  const allUnique = [...new Set([...unique9, ...unique11])].sort();
  console.log("\n=== Combined All Unique Colleges ===");
  console.log(JSON.stringify(allUnique, null, 2));
  console.log("Combined Count:", allUnique.length);
}
