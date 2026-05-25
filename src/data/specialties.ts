export type EducationLevel = 'bakalavr' | 'magistr' | 'rezidentura' | 'kollec_9' | 'kollec_11' | 'subbakalavr';
export type Group = 'I' | 'II' | 'III' | 'IV' | 'V';

export interface Specialty {
  id: string;
  name: string;
  universityId: string;
  universityName: string;
  universityShort: string;
  city: string;
  region: string;
  group: Group;
  level: EducationLevel;
  bal_odenis: number | null;
  bal_dovlet: number | null;
  plan: number;
  applicants?: number | null;
  language?: string;
  isSpecial?: boolean;
}

export const specialties: Specialty[] = [];

export function cleanCollegeName(name: string): string {
  if (!name) return name;
  let clean = name.trim();
  // Remove markdown links like [Biznes](https://biznes.az)
  clean = clean.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  // Standardize name discrepancies
  if (clean.includes('Azərbaycan Dövlət Pedaqoji Universiteti') || clean.includes('Azərbaycan Dövlət Pedaqoji Universitetinin')) {
    return 'Azərbaycan Dövlət Pedaqoji Universitetinin nəzdində Azərbaycan Dövlət Pedaqoji Kolleci';
  }
  if (clean.includes('Azərbaycan Dövlət Rəssamlıq Akademiyası') || clean.includes('Azərbaycan Dövlət Rəssamlıq Akademiyasının')) {
    return 'Azərbaycan Dövlət Rəssamlıq Akademiyasının nəzdində İncəsənət Kolleci';
  }
  if (clean.includes('Azərbaycan Milli Konservatoriyası nəzdində Musiqi Kolleci') || clean.includes('Azərbaycan Milli Konservatoriyasının nəzdində Musiqi Kolleci')) {
    return 'Azərbaycan Milli Konservatoriyasının nəzdində Musiqi Kolleci';
  }
  if (clean.includes('Azərbaycan Milli Konservatoriyası nəzdində Sumqayıt Musiqi Kolleci') || clean.includes('Azərbaycan Milli Konservatoriyasının nəzdində Sumqayıt Musiqi Kolleci')) {
    return 'Azərbaycan Milli Konservatoriyasının nəzdində Sumqayıt Musiqi Kolleci';
  }
  if (clean.includes('Bakı Biznes və Kooperasiya Kolleci') || clean.includes('Bakı Biznes və Kooperasiya Kolleci')) {
    return 'Bakı Biznes və Kooperasiya Kolleci';
  }
  return clean;
}

export function getCombinedSpecialties(): Specialty[] {
  const saved = localStorage.getItem('dim_admin_journals');
  let combined = [...specialties];
  
  if (saved) {
    try {
      const journals = JSON.parse(saved);
      const allJournalSpecs: Specialty[] = [
        ...(journals.bakalavr || []),
        ...(journals.magistr || []),
        ...(journals.rezidentura || []),
        ...(journals.kollec_9 || []),
        ...(journals.kollec_11 || []),
        ...(journals.subbakalavr || [])
      ].map((s: any) => {
        const cleanUniId = cleanCollegeName(s.universitetId);
        
        return {
          id: s.id || Math.random().toString(36).substr(2, 9),
          name: s.ixtisasAdi || s.name || '',
          universityId: cleanUniId,
          universityName: cleanUniId,
          universityShort: cleanUniId,
          city: cleanUniId.includes('Gəncə') ? 'Gəncə'
            : cleanUniId.includes('Naxçıvan') ? 'Naxçıvan'
            : cleanUniId.includes('Sumqayıt') ? 'Sumqayıt'
            : cleanUniId.includes('Lənkəran') ? 'Lənkəran'
            : cleanUniId.includes('Şəki') ? 'Şəki'
            : cleanUniId.includes('Qazax') ? 'Qazax'
            : cleanUniId.includes('Tovuz') ? 'Tovuz'
            : cleanUniId.includes('Quba') ? 'Quba'
            : cleanUniId.includes('Şamaxı') ? 'Şamaxı'
            : cleanUniId.includes('Zaqatala') ? 'Zaqatala'
            : cleanUniId.includes('Ağdam') ? 'Ağdam'
            : cleanUniId.includes('Ağdaş') ? 'Ağdaş'
            : cleanUniId.includes('Ağcabədi') ? 'Ağcabədi'
            : cleanUniId.includes('Bərdə') ? 'Bərdə'
            : cleanUniId.includes('Göyçay') ? 'Göyçay'
            : cleanUniId.includes('Sabirabad') ? 'Sabirabad'
            : cleanUniId.includes('Astara') ? 'Astara'
            : cleanUniId.includes('İsmayıllı') ? 'İsmayıllı'
            : cleanUniId.includes('Masallı') ? 'Masallı'
            : cleanUniId.includes('Mingəçevir') ? 'Mingəçevir'
            : cleanUniId.includes('Şirvan') ? 'Şirvan'
            : 'Bakı',
          region: cleanUniId.includes('Gəncə') ? 'Gəncə'
            : cleanUniId.includes('Naxçıvan') ? 'Naxçıvan'
            : cleanUniId.includes('Sumqayıt') ? 'Sumqayıt'
            : cleanUniId.includes('Lənkəran') ? 'Lənkəran'
            : cleanUniId.includes('Qarabağ') || cleanUniId.includes('Ağdam') || cleanUniId.includes('Şuşa') ? 'Qarabağ'
            : cleanUniId.includes('Xırdalan') || cleanUniId.includes('Abşeron') ? 'Abşeron'
            : cleanUniId.includes('Quba') || cleanUniId.includes('Qusar') || cleanUniId.includes('Xaçmaz') ? 'Quba-Xaçmaz'
            : cleanUniId.includes('Şəki') || cleanUniId.includes('Zaqatala') || cleanUniId.includes('Qəbələ') || cleanUniId.includes('Balakən') ? 'Şəki-Zaqatala'
            : cleanUniId.includes('Şirvan') || cleanUniId.includes('Sabirabad') || cleanUniId.includes('Salyan') ? 'Şirvan'
            : 'Bakı',
          group: s.qrup || s.group || 'V',
          level: s.level || 'bakalavr',
          bal_odenis: s.bal_odenis != null ? Number(s.bal_odenis) : null,
          bal_dovlet: s.bal_dovlet != null ? Number(s.bal_dovlet) : null,
          plan: s.planYeri ? Number(s.planYeri) : (s.plan ? Number(s.plan) : 0),
          isSpecial: s.isSpecial === 'true' || s.isSpecial === true
        };
      });
      
      combined = [...combined, ...allJournalSpecs];
    } catch (e) {
      console.error('Error parsing admin journals', e);
    }
  }
  
  return combined;
}
