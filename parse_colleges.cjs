const fs = require('fs');
const path = require('path');

const file2425 = path.join(
  'C:', 'Users', 'DUY', '.gemini', 'antigravity', 'brain',
  'bbf383a6-5a0f-4d82-b9a8-6e3f4f6375de', '.system_generated', 'steps', '43', 'content.md'
);
const file2526 = path.join(
  'C:', 'Users', 'DUY', '.gemini', 'antigravity', 'brain',
  'bbf383a6-5a0f-4d82-b9a8-6e3f4f6375de', '.system_generated', 'steps', '46', 'content.md'
);

const content2425 = fs.readFileSync(file2425, 'utf8');
const content2526 = fs.readFileSync(file2526, 'utf8');

// Parse 2025-2026 sections (they are beautifully structured with "## ")
function parseSections(text) {
  const lines = text.split('\n');
  const sections = [];
  let currentSection = null;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    if (line.startsWith('## ')) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: line.replace('## ', '').trim(),
        content: []
      };
    } else if (currentSection) {
      currentSection.content.push(line);
    }
  }
  if (currentSection) {
    sections.push(currentSection);
  }
  return sections;
}

const sections2526 = parseSections(content2526);

// Let's get the entire body of 2024-2025 text
const lines2425 = content2425.split('\n');
const startLineIdx = lines2425.findIndex(l => l.includes('tanış ola bilərsiz'));
const body2425 = lines2425.slice(startLineIdx + 1).join('\n');

// Clean text to avoid weird spacing
function cleanSpacing(text) {
  return text
    .replace(/[\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]/g, ' ')
    .replace(/\s+/g, ' ');
}

const cleanBody2425 = cleanSpacing(body2425);

// Normalization for search
function normalizeForSearch(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9əöğşçıüıi̇]/g, '')
    .trim();
}

// Delimiters or indicators in the 2024-2025 text that mark the start of each college
const customDelimiters = {
  "Azərbaycan Dövlət İqtisad Universitetinin nəzdində Azərbaycan Maliyyə-İqtisad Kolleci": "Bank işi 180.1 Maliyyə işi 197.8",
  "Bakı Dövlət Universitetinin nəzdində İqtisadiyyat və Humanitar Kolleci": "Ailə və ev təhsili 134.5 Məktəbəqədər təhsil 155.5",
  "Azərbaycan Dövlət İqtisad Universitetinin nəzdində Qida Sənayesi Kolleci": "Çörək və unlu qənnadı məmulatlarının texnologiyası 124.7",
  "Azərbaycan Dövlət İqtisad Universitetinin nəzdində Sosial-İqtisadi Kollec": "Kargüzarlıq və arxiv işi 142.6 Bank işi 168.8 Maliyyə işi 179.0",
  "Azərbaycan Dövlət Neft və Sənaye Universitetinin nəzdində Sənaye və Texnologiya Kolleci": "Kargüzarlıq və arxiv işi 141.7 Bələdiyyə işi 148.7",
  "Azərbaycan Dövlət Pedaqoji Universiteti nəzdində Azərbaycan Dövlət Pedaqoji Kolleci": "Ailə və ev təhsili 129.5 İnklüziv təhsil 134.0",
  "Azərbaycan Texniki Universitetinin nəzdində Bakı Dövlət Rabitə və Nəqliyyat Kolleci": "Marketinq (sahələr üzrə) 152.9 Mühasibat uçotu 166.9",
  "Azərbaycan Dövlət Mədəniyyət və İncəsənət Universitetinin nəzdində Humanitar Kollec": "İnklüziv təhsil 128.1 Məktəbəqədər təhsil 148.8 Kitabxana işi 140.8",
  "Azərbaycan Dövlət Rəssamlıq Akademiyası nəzdində İncəsənət Kolleci": "Dekorativ-tətbiqi sənət (xalça) 50 Dekorativ-tətbiqi sənət (keramika) 108.5",
  "Azərbaycan Milli Konservatoriyası nəzdində Musiqi Kolleci": "İnstrumental ifaçılıq (fortepiano, violin, viola",
  "Azərbaycan Texniki Universitetinin nəzdində Bakı Texniki Kolleci": "Marketinq (sahələr üzrə) 154.6 Mühasibat uçotu 159.5 Energetika",
  "Azərbaycan Dövlət Neft və Sənaye Universitetinin nəzdində Bakı Neft-Energetika Kolleci": "Mühasibat uçotu 158.1 Elektrik stansiyası",
  "Azərbaycan Memarlıq və İnşaat Universitetinin nəzdində İnşaat Kolleci": "Barpaçı 102.1 Alternativ enerji qurğu",
  "Naxçıvan Dövlət Texniki Kolleci": "Bank işi 184.5 Bələdiyyə işi 166.3",
  "Naxçıvan Musiqi Kolleci": "Aktyor sənəti 50 Aşıq sənəti 81.0",
  "Gəncə Dövlət Universitetinin nəzdində Regional Kollec": "Ailə və ev təhsili 130.1 Məktəbəqədər təhsil 147.4 Mühasibat uçotu 186.5",
  "Qazax Dövlət Sosial-İqtisadi Kolleci": "Kitabxana işi 107.4 Bank işi 116.9 Maliyyə işi 140.4",
  "Tovuz Dövlət Sosial-İqtisadi Kolleci": "Bank işi 129.6 Kommersiya işi 103.5 Mühasibat",
  "Sumqayıt Dövlət Universitetinin nəzdində Sumqayıt Dövlət Texniki Kolleci": "Məktəbəqədər təhsil 163.4 Maliyyə işi 171.3 Mühasibat uçotu 162.4",
  "Azərbaycan Milli Konservatoriyası nəzdində Sumqayıt Musiqi Kolleci": "İnstrumental ifaçılıq (fortepiano, violin, violonçel, ksilofon",
  "Quba Dövlət Sosial-İqtisadi Kolleci": "Kargüzarlıq və arxiv işi 116.3 Kitabxana işi 123.6",
  "Şamaxı Dövlət Regional Kolleci": "İnklüziv təhsil 88.8 Məktəbəqədər təhsil 121.5 Kitabxana",
  "Mingəçevir Turizm Kolleci": "Maliyyə işi 151.6 Mühasibat uçotu 144.8",
  "Şəki Dövlət Regional Kolleci": "Ailə və ev təhsili 101.0 Məktəbəqədər təhsil 110.0 Kargüzarlıq",
  "Zaqatala Dövlət İdarəetmə və Texnologiya Kolleci": "Mühasibat uçotu 138.8 Nəqliyyat vasitələrinin texniki istismarı 102.5",
  "Şuşa Humanitar Kolleci": "Ailə və ev təhsili 108.0 Məktəbəqədər təhsil 135.4",
  "Ağdam Dövlət Sosial-İqtisadi Kolleci": "Ailə və ev təhsili 95.2 Məktəbəqədər təhsil 113.4 Maliyyə",
  "Ağdam Musiqi Kolleci": "Aşıq sənəti 50 Instrumental ifaçılıq (fortepiano",
  "Ağdaş Dövlət Humanitar Kolleci": "Ailə və ev təhsili 93.7 Məktəbəqədər təhsil 122.1 Kitabxana",
  "Ağcabədi Pedaqoji Kolleci": "Ailə və ev təhsili 97.4 Məktəbəqədər təhsil 114.0 Kitabxana",
  "Şirvan Dövlət İqtisadiyyat və Humanitar Kolleci": "Ailə və ev təhsili 113.3 Məktəbəqədər təhsil 142.5 Kitabxana",
  "Bərdə Dövlət İdarəetmə və Texnologiya Kolleci": "Mühasibat uçotu 139.4 Nəqliyyat vasitələrinin texniki istismarı 108.0",
  "Sabirabad Dövlət Sosial-İqtisadi Kolleci": "Kargüzarlıq və arxiv işi 110.0 Kitabxana işi 117.8",
  "Göyçay Dövlət İdarəetmə və Texnologiya Kolleci": "Kargüzarlıq və arxiv işi 106.0 Bank işi 125.5",
  "Lənkəran Dövlət Universitetinin nəzdində Sosial və Aqrar-Texnoloji Kolleci": "Məktəbəqədər təhsil 144.3 Kitabxana işi 115.3",
  "Astara Pedaqoji Kolleci": "Ailə və ev təhsili 96.2 Məktəbəqədər təhsil 124.1 Maliyyə",
  "İsmayıllı Dövlət Humanitar və Texnologiya Kolleci": "Məktəbəqədər təhsil 126.1 Mühasibat uçotu 124.7",
  "Masallı Dövlət Regional Kolleci": "Məktəbəqədər təhsil 144.2 Kitabxana işi 117.2",
  "Bakı [Biznes](https://biznes.az) və Kooperasiya Kolleci": "Kargüzarlıq və arxiv işi 90.8 Bank işi 105.8 Bələdiyyə"
};

const collegePositions = [];

for (const sec of sections2526) {
  const title = sec.title;
  let bestIdx = -1;
  let bestMatchLen = 0;
  let matchedVar = '';

  const delim = customDelimiters[title];
  if (delim) {
    const idx = cleanBody2425.indexOf(delim);
    if (idx !== -1) {
      bestIdx = idx;
      bestMatchLen = delim.length;
      matchedVar = delim;
    }
  }

  if (bestIdx === -1) {
    const variations = [
      title,
      title.replace('Universitetinin nəzdində', ''),
      title.replace('Universiteti nəzdində', ''),
      title.replace('nəzdində', ''),
      title.replace('orta ixtisas təhsili pilləsi', ''),
    ];
    for (const v of variations) {
      const cleanV = cleanSpacing(v);
      const idx = cleanBody2425.indexOf(cleanV);
      if (idx !== -1) {
        if (cleanV.length > bestMatchLen) {
          bestIdx = idx;
          bestMatchLen = cleanV.length;
          matchedVar = cleanV;
        }
      }
    }
  }

  collegePositions.push({
    title,
    index: bestIdx,
    matchLength: bestMatchLen,
    matchedVar
  });
}

const matchedPositions = collegePositions
  .filter(p => p.index !== -1)
  .sort((a, b) => a.index - b.index);

const blocks2425 = {};

for (let i = 0; i < matchedPositions.length; i++) {
  const current = matchedPositions[i];
  const next = matchedPositions[i + 1];
  
  const start = current.index;
  const end = next ? next.index : cleanBody2425.length;
  
  blocks2425[current.title] = cleanBody2425.substring(start, end).trim();
}

// Tokenizers
function tokenize2526(text) {
  const cleanText = cleanSpacing(text);
  const regex = /(\*?\d{6})\s+([\s\S]+?)(?=\*?\d{6}|$)/g;
  const matches = [...cleanText.matchAll(regex)];
  
  return matches.map(m => {
    const rawCode = m[1];
    const rest = m[2].trim();
    
    const words = rest.split(/\s+/);
    const scoreStr = words.pop();
    const name = words.join(' ').replace(/^\*?\s*/, '').trim();
    const score = parseFloat(scoreStr);
    const code = rawCode.replace('*', '').trim();
    const isSpecial = rawCode.includes('*') || m[2].trim().startsWith('*');

    return {
      code,
      name,
      score,
      isSpecial
    };
  });
}

function tokenize2425(text) {
  const cleanText = cleanSpacing(text);
  const regex = /(\*?[A-Za-zƏəÖöĞğŞşÇçIıİiÜü\s()/*,-]+?)\s*(\d+(?:\.\d+)?)/g;
  const matches = [...cleanText.matchAll(regex)];
  
  return matches.map(m => {
    const rawName = m[1].trim();
    const isSpecial = rawName.startsWith('*');
    const name = rawName.replace(/^\*?\s*/, '').trim();
    const score = parseFloat(m[2]);
    return {
      name,
      score,
      isSpecial
    };
  });
}

const finalColleges = [];

for (const sec2526 of sections2526) {
  const title = sec2526.title;
  if (title === 'Oxşar xəbərlər') continue;
  
  const text2526 = sec2526.content.join(' ');
  const specs2526 = tokenize2526(text2526);
  
  const text2425 = blocks2425[title] || '';
  const specs2425 = text2425 ? tokenize2425(text2425) : [];

  const nameCounts = {};
  specs2526.forEach(s => {
    nameCounts[s.name] = (nameCounts[s.name] || 0) + 1;
  });

  const nameIndices = {};
  const mergedSpecs = [];

  for (let i = 0; i < specs2526.length; i++) {
    const s2526 = specs2526[i];
    const name = s2526.name;
    nameIndices[name] = (nameIndices[name] || 0) + 1;
    
    let matching2425 = null;
    let occurrence = 0;
    
    for (const s2425 of specs2425) {
      if (s2425.name === name || normalizeForSearch(s2425.name) === normalizeForSearch(name)) {
        occurrence++;
        if (occurrence === nameIndices[name]) {
          matching2425 = s2425;
          break;
        }
      }
    }

    if (!matching2425 && specs2425.length === specs2526.length) {
      matching2425 = specs2425[i];
    }

    if (!matching2425) {
      let occurrenceFuzzy = 0;
      for (const s2425 of specs2425) {
        if (s2425.name.includes(name) || name.includes(s2425.name)) {
          occurrenceFuzzy++;
          if (occurrenceFuzzy === nameIndices[name]) {
            matching2425 = s2425;
            break;
          }
        }
      }
    }

    const paymentType = (i >= specs2526.length / 2) ? 'ödənişli' : 'ödənişsiz';

    mergedSpecs.push({
      code: s2526.code,
      name: s2526.name,
      paymentType,
      bal2425: matching2425 ? matching2425.score : null,
      bal2526: s2526.score,
      isSpecial: s2526.isSpecial
    });
  }

  finalColleges.push({
    name: title,
    normalized: normalizeForSearch(title),
    specialties: mergedSpecs
  });
}

// Ensure the directory exists
const targetDir = path.join(__dirname, 'src', 'data');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Write directly to target source directory src/data/scraped_colleges_9.json
fs.writeFileSync(
  path.join(targetDir, 'scraped_colleges_9.json'),
  JSON.stringify(finalColleges, null, 2),
  'utf8'
);

console.log('Successfully wrote scraped 9-year college data to src/data/scraped_colleges_9.json!');
