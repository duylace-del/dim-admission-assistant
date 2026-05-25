import fs from 'fs';
import path from 'path';

const IS_VERCEL = !!process.env.VERCEL;
const SOURCE_FILE = IS_VERCEL
  ? path.join(process.cwd(), 'backend/dim-data.json')
  : path.join(__dirname, '../../dim-data.json');
const TMP_FILE = '/tmp/dim-data.json';
const DB_FILE = IS_VERCEL ? TMP_FILE : SOURCE_FILE;

export interface SpecialtyRow {
  id: string;
  name: string;
  university_name: string;
  university_short: string;
  city: string;
  region: string;
  group_code: string;
  level: string;
  bal_odenis: number | null;
  bal_dovlet: number | null;
  plan_places: number;
  applicants?: number | null;
  is_special: boolean;
  language: string;
}

export interface UniversityRow {
  id: string;
  name: string;
  shortName: string;
  city: string;
  region: string;
  website: string;
  about: string;
  color: string;
  emoji: string;
  logo?: string;
  established: number;
  studentCount?: string;
  type: 'dövlət' | 'özəl';
}

export interface CollegeRow {
  id: string;
  name: string;
  shortName: string;
  city: string;
  website: string;
  established: string | number;
  studentCount?: string;
  logo?: string;
  emoji: string;
  color: string;
  type: 'dövlət' | 'özəl';
  about: string;
}

export interface UserRow {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface SubscriberRow {
  id: string;
  email: string;
  lang: string;
  createdAt: string;
}

// ── Calculator Config ────────────────────────────────────────────
export interface CalcSubjectConfig {
  key: string;
  label: string;
  coefficient: number;
  maxQ: number;
  maxKod: number;
  maxYazili: number;
  color: string;
}

export interface CalcTypeConfig {
  value: string;
  label: string;
  desc: string;
  category: 'attestat' | 'blok' | 'magistr' | 'rezidentura' | 'kollec' | 'subbakalavr';
  maxScore: number;
  subjects: CalcSubjectConfig[];
}

interface DBData {
  specialties: SpecialtyRow[];
  universities: UniversityRow[];
  colleges: CollegeRow[];
  users: UserRow[];
  subscribers: SubscriberRow[];
  calculatorConfig?: CalcTypeConfig[];
}

// ── read / write ──────────────────────────────────────────────
export function readDB(): DBData {
  try {
    // On Vercel: copy source file to /tmp on first read
    if (IS_VERCEL && !fs.existsSync(TMP_FILE) && fs.existsSync(SOURCE_FILE)) {
      fs.copyFileSync(SOURCE_FILE, TMP_FILE);
    }
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    if (!data.universities) data.universities = [];
    if (!data.colleges) data.colleges = [];
    if (!data.specialties) data.specialties = [];
    if (!data.users) data.users = [];
    if (!data.subscribers) data.subscribers = [];
    return data;
  } catch {
    return { specialties: [], universities: [], colleges: [], users: [], subscribers: [] };
  }
}

export function writeDB(data: DBData): void {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ── specialties ───────────────────────────────────────────────
export function querySpecialties(params: {
  level?: string;
  group?: string;
  minBal?: number;
  maxBal?: number;
  region?: string;
  payment?: string;
  universityName?: string;
}): SpecialtyRow[] {
  const { specialties } = readDB();

  return specialties
    .filter(s => {
      if (params.level && s.level !== params.level) return false;
      if (params.group && params.group !== 'all' && s.group_code !== params.group) return false;
      if (params.region) {
        const r = params.region.toLowerCase();
        if (s.region.toLowerCase() !== r && s.city.toLowerCase() !== r) return false;
      }
      if (params.universityName && s.university_name !== params.universityName) return false;
      // Use bal_dovlet (state score) as the reference for range filtering
      const ref = s.bal_dovlet ?? s.bal_odenis ?? 0;
      if (ref !== 0) {
        if (params.minBal !== undefined && ref < params.minBal) return false;
        if (params.maxBal !== undefined && ref > params.maxBal) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const bA = b.bal_dovlet ?? b.bal_odenis ?? 0;
      const bB = a.bal_dovlet ?? a.bal_odenis ?? 0;
      return bA - bB;
    });
}

export function countByLevel(): Record<string, number> {
  const { specialties } = readDB();
  const counts: Record<string, number> = {};
  for (const s of specialties) {
    counts[s.level] = (counts[s.level] || 0) + 1;
  }
  return counts;
}

export function upsertSpecialties(rows: SpecialtyRow[]): number {
  const data = readDB();
  const map = new Map(data.specialties.map(s => [s.id, s]));
  for (const row of rows) map.set(row.id, row);
  data.specialties = Array.from(map.values());
  writeDB(data);
  return rows.length;
}

export function deleteById(id: string): void {
  const data = readDB();
  data.specialties = data.specialties.filter(s => s.id !== id);
  writeDB(data);
}

export function deleteByLevel(level: string): number {
  const data = readDB();
  const before = data.specialties.length;
  data.specialties = data.specialties.filter(s => s.level !== level);
  writeDB(data);
  return before - data.specialties.length;
}

// ── universities ──────────────────────────────────────────────
export function getUniversities(): UniversityRow[] {
  return readDB().universities;
}

export function upsertUniversity(row: UniversityRow): void {
  const data = readDB();
  const map = new Map(data.universities.map(u => [u.id, u]));
  map.set(row.id, row);
  data.universities = Array.from(map.values());
  writeDB(data);
}

export function deleteUniversityById(id: string): void {
  const data = readDB();
  data.universities = data.universities.filter(u => u.id !== id);
  writeDB(data);
}

// ── colleges ──────────────────────────────────────────────────
export function getColleges(): CollegeRow[] {
  return readDB().colleges;
}

export function upsertCollege(row: CollegeRow): void {
  const data = readDB();
  const map = new Map(data.colleges.map(c => [c.id, c]));
  map.set(row.id, row);
  data.colleges = Array.from(map.values());
  writeDB(data);
}

export function deleteCollegeById(id: string): void {
  const data = readDB();
  data.colleges = data.colleges.filter(c => c.id !== id);
  writeDB(data);
}

// ── users ─────────────────────────────────────────────────────
export function getUsers(): UserRow[] {
  return readDB().users;
}

export function getUserByEmail(email: string): UserRow | undefined {
  return readDB().users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function getUserById(id: string): UserRow | undefined {
  return readDB().users.find(u => u.id === id);
}

export function createUser(user: UserRow): void {
  const data = readDB();
  data.users.push(user);
  writeDB(data);
}

export function deleteUser(id: string): void {
  const data = readDB();
  data.users = data.users.filter(u => u.id !== id);
  writeDB(data);
}

export function updateUserPassword(id: string, passwordHash: string): boolean {
  const data = readDB();
  const user = data.users.find(u => u.id === id);
  if (!user) return false;
  user.passwordHash = passwordHash;
  writeDB(data);
  return true;
}

// ── Calculator Config ────────────────────────────────────────────
export function getCalcConfig(): CalcTypeConfig[] {
  const data = readDB();
  return data.calculatorConfig || DEFAULT_CALC_CONFIG;
}

export function saveCalcConfig(config: CalcTypeConfig[]): void {
  const data = readDB();
  data.calculatorConfig = config;
  writeDB(data);
}

// ── subscribers ────────────────────────────────────────────────
export function getSubscribers(): SubscriberRow[] {
  return readDB().subscribers;
}

export function addSubscriber(sub: SubscriberRow): boolean {
  const data = readDB();
  const exists = data.subscribers.some(s => s.email.toLowerCase() === sub.email.toLowerCase());
  if (exists) return false;
  data.subscribers.push(sub);
  writeDB(data);
  return true;
}

export function deleteSubscriber(id: string): void {
  const data = readDB();
  data.subscribers = data.subscribers.filter(s => s.id !== id);
  writeDB(data);
}

// ── Default Calculator Config ─────────────────────────────────
export const DEFAULT_CALC_CONFIG: CalcTypeConfig[] = [
  {
    value: 'attestat9', label: '9-cu sinif Attestat', category: 'attestat', maxScore: 300,
    desc: 'Buraxılış imtahanı (I mərhələ, 9-illik)',
    subjects: [
      { key: 'azDili', label: 'Azərbaycan dili', coefficient: 1, maxQ: 30, maxKod: 0, maxYazili: 3, color: 'blue' },
      { key: 'riyaz', label: 'Riyaziyyat', coefficient: 1, maxQ: 25, maxKod: 8, maxYazili: 4, color: 'purple' },
    ],
  },
  {
    value: 'attestat11', label: '11-ci sinif Attestat', category: 'attestat', maxScore: 300,
    desc: 'Buraxılış imtahanı (I mərhələ, max 300 bal)',
    subjects: [
      { key: 'azDili', label: 'Azərbaycan dili', coefficient: 1, maxQ: 30, maxKod: 0, maxYazili: 3, color: 'blue' },
      { key: 'riyaz', label: 'Riyaziyyat', coefficient: 1, maxQ: 25, maxKod: 8, maxYazili: 4, color: 'purple' },
      { key: 'xariciDil', label: 'Xarici dil', coefficient: 1, maxQ: 30, maxKod: 0, maxYazili: 3, color: 'green' },
    ],
  },
  {
    value: 'blok1rk', label: 'I Qrup Blok — RK (Riyaziyyat+Kimya)', category: 'blok', maxScore: 400,
    desc: 'Riyaziyyat×1.5, Fizika×1.5, Kimya×1',
    subjects: [
      { key: 'riyaz', label: 'Riyaziyyat', coefficient: 1.5, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'blue' },
      { key: 'fizika', label: 'Fizika', coefficient: 1.5, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'purple' },
      { key: 'kimya', label: 'Kimya', coefficient: 1, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'green' },
    ],
  },
  {
    value: 'blok1ri', label: 'I Qrup Blok — Ri (Riyaziyyat+İnformatika)', category: 'blok', maxScore: 400,
    desc: 'Riyaziyyat×1.5, Fizika×1.5, İnformatika×1',
    subjects: [
      { key: 'riyaz', label: 'Riyaziyyat', coefficient: 1.5, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'blue' },
      { key: 'fizika', label: 'Fizika', coefficient: 1.5, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'purple' },
      { key: 'informatika', label: 'İnformatika', coefficient: 1, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'cyan' },
    ],
  },
  {
    value: 'blok2', label: 'II Qrup Blok', category: 'blok', maxScore: 400,
    desc: 'Riyaziyyat×1.5, Coğrafiya×1.5, Tarix×1',
    subjects: [
      { key: 'riyaz', label: 'Riyaziyyat', coefficient: 1.5, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'blue' },
      { key: 'cografiya', label: 'Coğrafiya', coefficient: 1.5, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'green' },
      { key: 'tarix', label: 'Tarix', coefficient: 1, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'amber' },
    ],
  },
  {
    value: 'blok3dt', label: 'III Qrup Blok — DT', category: 'blok', maxScore: 400,
    desc: 'Az.dili×1.5, Tarix×1.5, Ədəbiyyat×1',
    subjects: [
      { key: 'azDili', label: 'Azərbaycan dili', coefficient: 1.5, maxQ: 22, maxKod: 0, maxYazili: 3, color: 'blue' },
      { key: 'tarix', label: 'Tarix', coefficient: 1.5, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'amber' },
      { key: 'edebiyyat', label: 'Ədəbiyyat', coefficient: 1, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'purple' },
    ],
  },
  {
    value: 'blok3tc', label: 'III Qrup Blok — TC', category: 'blok', maxScore: 400,
    desc: 'Az.dili×1.5, Tarix×1.5, Coğrafiya×1',
    subjects: [
      { key: 'azDili', label: 'Azərbaycan dili', coefficient: 1.5, maxQ: 22, maxKod: 0, maxYazili: 3, color: 'blue' },
      { key: 'tarix', label: 'Tarix', coefficient: 1.5, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'amber' },
      { key: 'cografiya', label: 'Coğrafiya', coefficient: 1, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'green' },
    ],
  },
  {
    value: 'blok4', label: 'IV Qrup Blok', category: 'blok', maxScore: 400,
    desc: 'Biologiya×1.5, Kimya×1.5, Fizika×1',
    subjects: [
      { key: 'bio', label: 'Biologiya', coefficient: 1.5, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'green' },
      { key: 'kimya', label: 'Kimya', coefficient: 1.5, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'purple' },
      { key: 'fizika', label: 'Fizika', coefficient: 1, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'blue' },
    ],
  },
  {
    value: 'magistr', label: 'Magistratura', category: 'magistr', maxScore: 100,
    desc: 'Məntiq(50)+İnformatika(25)+Xarici dil(20)+Esse(5) = max 100 bal',
    subjects: [
      { key: 'mentiq', label: 'Məntiqi təfəkkür', coefficient: 1, maxQ: 45, maxKod: 0, maxYazili: 5, color: 'blue' },
      { key: 'informatika', label: 'İnformatika', coefficient: 1, maxQ: 20, maxKod: 0, maxYazili: 5, color: 'purple' },
      { key: 'xariciDil', label: 'Xarici dil', coefficient: 1, maxQ: 18, maxKod: 0, maxYazili: 2, color: 'green' },
    ],
  },
  {
    value: 'rezidentura', label: 'Rezidentura', category: 'rezidentura', maxScore: 200,
    desc: 'I mərhələ (Baza, max 100) + II mərhələ (İxtisas, max 100)',
    subjects: [
      { key: 'baza', label: 'I Mərhələ (Baza fənnləri)', coefficient: 1, maxQ: 100, maxKod: 0, maxYazili: 0, color: 'blue' },
      { key: 'ixtisas', label: 'II Mərhələ (İxtisas fənnləri)', coefficient: 1, maxQ: 100, maxKod: 0, maxYazili: 0, color: 'purple' },
    ],
  },
  {
    value: 'kollec', label: 'Kollec (11-illik baza)', category: 'kollec', maxScore: 30,
    desc: 'Az.dili imtahanı, max 30 sual',
    subjects: [
      { key: 'azDili', label: 'Azərbaycan dili', coefficient: 1, maxQ: 27, maxKod: 0, maxYazili: 3, color: 'blue' },
    ],
  },
  {
    value: 'subbakalavr', label: 'Subbakalavr', category: 'subbakalavr', maxScore: 300,
    desc: 'Buraxılış imtahanı nəticəsi ilə',
    subjects: [
      { key: 'azDili', label: 'Azərbaycan dili', coefficient: 1, maxQ: 30, maxKod: 0, maxYazili: 3, color: 'blue' },
      { key: 'riyaz', label: 'Riyaziyyat', coefficient: 1, maxQ: 25, maxKod: 8, maxYazili: 4, color: 'purple' },
    ],
  },
];

// ── seed ──────────────────────────────────────────────────────
export function initDB(): void {
  if (!fs.existsSync(DB_FILE)) {
    writeDB({ specialties: [], universities: [], colleges: [], users: [], subscribers: [] });
  }
  const data = readDB();
  if (data.specialties.length === 0) {
    upsertSpecialties(SAMPLE_DATA);
    console.log(`✅ ${SAMPLE_DATA.length} nümunə ixtisas əlavə edildi`);
  }
  if (data.universities.length === 0) {
    const d = readDB();
    d.universities = SEED_UNIVERSITIES;
    writeDB(d);
    console.log(`✅ ${SEED_UNIVERSITIES.length} universitet əlavə edildi`);
  }
  if (data.colleges.length === 0) {
    const d = readDB();
    d.colleges = SEED_COLLEGES;
    writeDB(d);
    console.log(`✅ ${SEED_COLLEGES.length} kollec əlavə edildi`);
  }
}

// ── sample data ───────────────────────────────────────────────
const SAMPLE_DATA: SpecialtyRow[] = [
  // ── BAKALAVRIAT I QRUP ──
  { id:'bak-I-050641-bdu',   name:'Kompüter mühəndisliyi',                 university_name:'Bakı Dövlət Universiteti',                                                    university_short:'BDU',         city:'Bakı', region:'bakı', group_code:'I',   level:'bakalavr',    bal_odenis:355,  bal_dovlet:552,  plan_places:50,  is_special:false, language:'Azərbaycan dili' },
  { id:'bak-I-050649-adnsu', name:'İnformasiya texnologiyaları',           university_name:'Azərbaycan Dövlət Neft və Sənaye Universiteti',                              university_short:'ADNSU',       city:'Bakı', region:'bakı', group_code:'I',   level:'bakalavr',    bal_odenis:null, bal_dovlet:523,  plan_places:40,  is_special:false, language:'Azərbaycan dili' },
  // ── BAKALAVRIAT II QRUP ──
  { id:'bak-II-060201-unec', name:'İqtisadiyyat',                          university_name:'Azərbaycan Dövlət İqtisad Universiteti',                                     university_short:'UNEC',        city:'Bakı', region:'bakı', group_code:'II',  level:'bakalavr',    bal_odenis:null, bal_dovlet:492,  plan_places:60,  is_special:false, language:'Azərbaycan dili' },
  { id:'bak-II-060209-unec', name:'Maliyyə',                               university_name:'Azərbaycan Dövlət İqtisad Universiteti',                                     university_short:'UNEC',        city:'Bakı', region:'bakı', group_code:'II',  level:'bakalavr',    bal_odenis:335,  bal_dovlet:472,  plan_places:50,  is_special:false, language:'Azərbaycan dili' },
  // ── BAKALAVRIAT III QRUP ──
  { id:'bak-III-040201-bdu', name:'Hüquqşünaslıq',                        university_name:'Bakı Dövlət Universiteti',                                                    university_short:'BDU',         city:'Bakı', region:'bakı', group_code:'III', level:'bakalavr',    bal_odenis:null, bal_dovlet:533,  plan_places:80,  is_special:false, language:'Azərbaycan dili' },
  { id:'bak-III-040209-bdu', name:'Tarix',                                university_name:'Bakı Dövlət Universiteti',                                                    university_short:'BDU',         city:'Bakı', region:'bakı', group_code:'III', level:'bakalavr',    bal_odenis:null, bal_dovlet:401,  plan_places:40,  is_special:false, language:'Azərbaycan dili' },
  { id:'bak-III-010209-adpu',name:'Az.dili və ədəbiyyatı müəllimliyi',    university_name:'Azərbaycan Dövlət Pedaqoji Universiteti',                                    university_short:'ADPU',        city:'Bakı', region:'bakı', group_code:'III', level:'bakalavr',    bal_odenis:null, bal_dovlet:382,  plan_places:45,  is_special:false, language:'Azərbaycan dili' },
  // ── BAKALAVRIAT IV QRUP ──
  { id:'bak-IV-060901-atu',  name:'Tibb (müalicə işi)',                   university_name:'Azərbaycan Tibb Universiteti',                                               university_short:'ATU',         city:'Bakı', region:'bakı', group_code:'IV',  level:'bakalavr',    bal_odenis:null, bal_dovlet:592,  plan_places:120, is_special:false, language:'Azərbaycan dili' },
  { id:'bak-IV-060909-atu',  name:'Əczaçılıq',                            university_name:'Azərbaycan Tibb Universiteti',                                               university_short:'ATU',         city:'Bakı', region:'bakı', group_code:'IV',  level:'bakalavr',    bal_odenis:null, bal_dovlet:542,  plan_places:60,  is_special:false, language:'Azərbaycan dili' },
  { id:'bak-IV-060917-atu',  name:'Stomatologiya',                        university_name:'Azərbaycan Tibb Universiteti',                                               university_short:'ATU',         city:'Bakı', region:'bakı', group_code:'IV',  level:'bakalavr',    bal_odenis:null, bal_dovlet:572,  plan_places:50,  is_special:false, language:'Azərbaycan dili' },
  // ── BAKALAVRIAT V QRUP ──
  { id:'bak-V-010301-adra',  name:'Rəssamlıq müəllimliyi',                university_name:'Azərbaycan Dövlət Rəssamlıq Akademiyası',                                   university_short:'AzDRA',       city:'Bakı', region:'bakı', group_code:'V',   level:'bakalavr',    bal_odenis:null, bal_dovlet:290,  plan_places:25,  is_special:true,  language:'Azərbaycan dili' },
  { id:'bak-V-010309-adpu',  name:'Musiqi müəllimliyi',                   university_name:'Azərbaycan Dövlət Pedaqoji Universiteti',                                    university_short:'ADPU',        city:'Bakı', region:'bakı', group_code:'V',   level:'bakalavr',    bal_odenis:null, bal_dovlet:268,  plan_places:30,  is_special:true,  language:'Azərbaycan dili' },
  { id:'bak-V-070201-adbta', name:'Bədən tərbiyəsi müəllimliyi',          university_name:'Azərbaycan Dövlət Bədən Tərbiyəsi və İdman Akademiyası',                   university_short:'ADBTA',       city:'Bakı', region:'bakı', group_code:'V',   level:'bakalavr',    bal_odenis:null, bal_dovlet:248,  plan_places:40,  is_special:false, language:'Azərbaycan dili' },
  // ── MAGİSTRATURA ──
  { id:'mag-040201-bdu',     name:'Hüquqşünaslıq',                        university_name:'Bakı Dövlət Universiteti',                                                    university_short:'BDU',         city:'Bakı', region:'bakı', group_code:'I',   level:'magistr',     bal_odenis:60,   bal_dovlet:74,   plan_places:30,  is_special:false, language:'Azərbaycan dili' },
  { id:'mag-060201-unec',    name:'İqtisadiyyat',                          university_name:'Azərbaycan Dövlət İqtisad Universiteti',                                     university_short:'UNEC',        city:'Bakı', region:'bakı', group_code:'I',   level:'magistr',     bal_odenis:null, bal_dovlet:67,   plan_places:25,  is_special:false, language:'Azərbaycan dili' },
  { id:'mag-040209-bdu',     name:'Tarix',                                university_name:'Bakı Dövlət Universiteti',                                                    university_short:'BDU',         city:'Bakı', region:'bakı', group_code:'I',   level:'magistr',     bal_odenis:58,   bal_dovlet:null, plan_places:20,  is_special:false, language:'Azərbaycan dili' },
  // ── REZİDENTURA ──
  { id:'rez-060951-atu',     name:'Cərrahiyyə',                           university_name:'Azərbaycan Tibb Universiteti',                                               university_short:'ATU',         city:'Bakı', region:'bakı', group_code:'I',   level:'rezidentura', bal_odenis:null, bal_dovlet:148,  plan_places:30,  is_special:false, language:'Azərbaycan dili' },
  { id:'rez-060952-atu',     name:'Terapiya (daxili xəstəliklər)',        university_name:'Azərbaycan Tibb Universiteti',                                               university_short:'ATU',         city:'Bakı', region:'bakı', group_code:'I',   level:'rezidentura', bal_odenis:null, bal_dovlet:134,  plan_places:40,  is_special:false, language:'Azərbaycan dili' },
  { id:'rez-060953-atu',     name:'Pediatriya',                           university_name:'Azərbaycan Tibb Universiteti',                                               university_short:'ATU',         city:'Bakı', region:'bakı', group_code:'I',   level:'rezidentura', bal_odenis:null, bal_dovlet:141,  plan_places:25,  is_special:false, language:'Azərbaycan dili' },
  // ── KOLLEC 9-İLLİK ──
  { id:'k9-576101-bdu-iek',  name:'Mühasibat uçotu',                      university_name:'Bakı Dövlət Universitetinin nəzdində İqtisadiyyat və Humanitar Kolleci',     university_short:'BDU İEK',     city:'Bakı', region:'bakı', group_code:'I',   level:'kollec_9',    bal_odenis:null, bal_dovlet:125,  plan_places:30,  is_special:false, language:'Azərbaycan dili' },
  { id:'k9-576102-adnsu',    name:'Kompüter şəbəkələri',                  university_name:'ADNSU nəzdində Sənaye və Texnologiya Kolleci',                               university_short:'ADNSU STK',   city:'Bakı', region:'bakı', group_code:'I',   level:'kollec_9',    bal_odenis:null, bal_dovlet:150,  plan_places:30,  is_special:false, language:'Azərbaycan dili' },
  { id:'k9-576103-adpu',     name:'Hüquqşünaslıq',                        university_name:'ADPU nəzdində Azərbaycan Dövlət Pedaqoji Kolleci',                          university_short:'ADPU PK',     city:'Bakı', region:'bakı', group_code:'I',   level:'kollec_9',    bal_odenis:null, bal_dovlet:119,  plan_places:30,  is_special:false, language:'Azərbaycan dili' },
  // ── KOLLEC 11-İLLİK ──
  { id:'k11-576394-bdu-iek', name:'Bank işi',                             university_name:'Bakı Dövlət Universitetinin nəzdində İqtisadiyyat və Humanitar Kolleci',     university_short:'BDU İEK',     city:'Bakı', region:'bakı', group_code:'I',   level:'kollec_11',   bal_odenis:null, bal_dovlet:179,  plan_places:30,  is_special:false, language:'Azərbaycan dili' },
  { id:'k11-577852-adnsu',   name:'Mühasibat uçotu',                      university_name:'ADNSU nəzdində Sənaye və Texnologiya Kolleci',                               university_short:'ADNSU STK',   city:'Bakı', region:'bakı', group_code:'I',   level:'kollec_11',   bal_odenis:null, bal_dovlet:193,  plan_places:30,  is_special:false, language:'Azərbaycan dili' },
  { id:'k11-577869-adnsu',   name:'Kompüter sistemlərinin proqram təminatı', university_name:'ADNSU nəzdində Sənaye və Texnologiya Kolleci',                           university_short:'ADNSU STK',   city:'Bakı', region:'bakı', group_code:'I',   level:'kollec_11',   bal_odenis:null, bal_dovlet:228,  plan_places:30,  is_special:false, language:'Azərbaycan dili' },
  // ── SUBBAKALAVR ──
  { id:'sub-060301-aku',     name:'Ticarət işinin təşkili',               university_name:'Azərbaycan Kooperasiya Universiteti',                                        university_short:'AKU',         city:'Bakı', region:'bakı', group_code:'I',   level:'subbakalavr', bal_odenis:null, bal_dovlet:88,   plan_places:30,  is_special:false, language:'Azərbaycan dili' },
  { id:'sub-060201-aku',     name:'İqtisadiyyat',                          university_name:'Azərbaycan Kooperasiya Universiteti',                                        university_short:'AKU',         city:'Bakı', region:'bakı', group_code:'I',   level:'subbakalavr', bal_odenis:null, bal_dovlet:81,   plan_places:25,  is_special:false, language:'Azərbaycan dili' },
  { id:'sub-040201-aku',     name:'Hüquqşünaslıq',                        university_name:'Azərbaycan Kooperasiya Universiteti',                                        university_short:'AKU',         city:'Bakı', region:'bakı', group_code:'I',   level:'subbakalavr', bal_odenis:null, bal_dovlet:93,   plan_places:20,  is_special:false, language:'Azərbaycan dili' },
];

const SEED_UNIVERSITIES: UniversityRow[] = [
  { id:'bdu',   name:'Bakı Dövlət Universiteti',                                               shortName:'BDU',      city:'Bakı',       region:'bakı',      website:'https://bsu.edu.az',    logo:'https://logo.clearbit.com/bsu.edu.az',    color:'#1e3a5f', emoji:'🎓', established:1919, studentCount:'25.000+', type:'dövlət', about:'Azərbaycanın ən nüfuzlu və köklü ali təhsil müəssisəsi. 1919-cu ildə əsası qoyulmuş, Azərbaycanın ilk milli universiteti. Elm, texnologiya, humanitar və sosial elm sahələrini əhatə edir.' },
  { id:'adnsu', name:'Azərbaycan Dövlət Neft və Sənaye Universiteti',                          shortName:'ADNSU',    city:'Bakı',       region:'bakı',      website:'https://asoiu.edu.az',  logo:'https://logo.clearbit.com/asoiu.edu.az',  color:'#c0392b', emoji:'⚙️', established:1920, studentCount:'15.000+', type:'dövlət', about:'Neft-qaz, mühəndislik və texnologiya sahəsinin aparıcı universiteti. 1920-ci ildə yaradılmış, Azərbaycan energetikasının inkişafında əsas rol oynayan mütəxəssislər yetişdirən mərkəz.' },
  { id:'atu',   name:'Azərbaycan Texniki Universiteti',                                        shortName:'AzTU',     city:'Bakı',       region:'bakı',      website:'https://aztu.edu.az',   logo:'https://logo.clearbit.com/aztu.edu.az',   color:'#8e44ad', emoji:'🔧', established:1950, studentCount:'12.000+', type:'dövlət', about:'Texniki elmlər sahəsində aparıcı universitetlərdən biri. Kompüter elmləri, elektrik mühəndisliyi, mexanika kimi sahələrdə peşəkar kadrlər hazırlayır.' },
  { id:'unec',  name:'Azərbaycan Dövlət İqtisad Universiteti',                                shortName:'UNEC',     city:'Bakı',       region:'bakı',      website:'https://unec.edu.az',   logo:'https://logo.clearbit.com/unec.edu.az',   color:'#27ae60', emoji:'💼', established:1930, studentCount:'20.000+', type:'dövlət', about:'İqtisadiyyat, maliyyə, mühasibat, menecment sahəsinin lider tədris mərkəzi. Azərbaycan biznes dünyasının əsas kadr yetişdirən universiteti.' },
  { id:'adpu',  name:'Azərbaycan Dövlət Pedaqoji Universiteti',                               shortName:'ADPU',     city:'Bakı',       region:'bakı',      website:'https://adpu.edu.az',   logo:'https://logo.clearbit.com/adpu.edu.az',   color:'#e67e22', emoji:'📚', established:1921, studentCount:'18.000+', type:'dövlət', about:'Azərbaycanın pedaqoji kadrlar hazırlayan əsas universiteti. Müəllim hazırlığı, psixologiya, pedaqogika sahələrini əhatə edir.' },
  { id:'adu',   name:'Azərbaycan Dillər Universiteti',                                        shortName:'ADU',      city:'Bakı',       region:'bakı',      website:'https://adu.edu.az',    logo:'https://logo.clearbit.com/adu.edu.az',    color:'#16a085', emoji:'🌐', established:1937, studentCount:'8.000+',  type:'dövlət', about:'Xarici dillər, tərcümə, filologiya sahəsinin aparıcı universiteti. İngilis, fransız, alman, ərəb, çin dilləri üzrə yüksəkixtisaslı mütəxəssislər hazırlayır.' },
  { id:'amiu',  name:'Azərbaycan Memarlıq və İnşaat Universiteti',                            shortName:'AMİU',     city:'Bakı',       region:'bakı',      website:'https://azmiu.edu.az',  logo:'https://logo.clearbit.com/azmiu.edu.az',  color:'#d35400', emoji:'🏛️', established:1975, studentCount:'7.000+',  type:'dövlət', about:'Memarlıq, inşaat mühəndisliyi, dizayn sahələrinin aparıcı universiteti. Azərbaycanın tikinti sektoruna peşəkar mütəxəssislər hazırlayır.' },
  { id:'bsu',   name:'Bakı Slavyan Universiteti',                                             shortName:'BSU',      city:'Bakı',       region:'bakı',      website:'https://bsu-uni.edu.az',logo:'https://logo.clearbit.com/bsu-uni.edu.az',color:'#2c3e50', emoji:'📖', established:2000, studentCount:'5.000+',  type:'dövlət', about:'Rus dili, slavyan dilləri, filologiya sahəsinin əsas universiteti. Çoxdilli humanitar təhsil sahəsində tanınmış mərkəz.' },
  { id:'atmu',  name:'Azərbaycan Turizm və Menecment Universiteti',                           shortName:'ATMU',     city:'Bakı',       region:'bakı',      website:'https://atmu.edu.az',   logo:'https://logo.clearbit.com/atmu.edu.az',   color:'#1abc9c', emoji:'✈️', established:2009, studentCount:'3.000+',  type:'dövlət', about:'Turizm, menecment, xidmət sahəsi üzrə ixtisaslaşmış universitet. Azərbaycan turizm sektoruna peşəkar kadrlar yetişdirir.' },
  { id:'ada',   name:'ADA Universiteti',                                                      shortName:'ADA',      city:'Bakı',       region:'bakı',      website:'https://ada.edu.az',    logo:'https://logo.clearbit.com/ada.edu.az',    color:'#2980b9', emoji:'🌟', established:2006, studentCount:'3.000+',  type:'özəl',   about:'Azərbaycanda ən prestijli beynəlxalq standartlı universitet. İngilis dilində tam tədris, beynəlxalq münasibətlər, biznes, İT sahələrini əhatə edir.' },
  { id:'xezer', name:'Xəzər Universiteti',                                                    shortName:'XU',       city:'Bakı',       region:'bakı',      website:'https://khazar.org',    logo:'https://logo.clearbit.com/khazar.org',    color:'#9b59b6', emoji:'⚡', established:1991, studentCount:'4.000+',  type:'özəl',   about:'Azərbaycanın ilk özəl universiteti. Hüquq, iqtisadiyyat, mühəndislik, incəsənət sahələrini əhatə edir. Beynəlxalq proqramları ilə tanınır.' },
  { id:'sdu',   name:'Sumqayıt Dövlət Universiteti',                                          shortName:'SDU',      city:'Sumqayıt',   region:'sumqayıt',  website:'https://sdu.edu.az',    logo:'https://logo.clearbit.com/sdu.edu.az',    color:'#e74c3c', emoji:'🏭', established:1961, studentCount:'6.000+',  type:'dövlət', about:'Sumqayıt sənaye şəhərinin əsas ali təhsil mərkəzi. Kimya, mühəndislik, pedaqogika sahələrini əhatə edir.' },
  { id:'gdu',   name:'Gəncə Dövlət Universiteti',                                             shortName:'GDU',      city:'Gəncə',      region:'gəncə',     website:'https://gdu.edu.az',    logo:'https://logo.clearbit.com/gdu.edu.az',    color:'#f39c12', emoji:'🌆', established:1938, studentCount:'8.000+',  type:'dövlət', about:'Azərbaycanın ikinci böyük şəhəri Gəncənin əsas ali məktəbi. Humanitar, texniki, pedaqoji sahələri əhatə edir.' },
  { id:'ldu',   name:'Lənkəran Dövlət Universiteti',                                          shortName:'LDU',      city:'Lənkəran',   region:'lənkəran',  website:'https://lsu.edu.az',    logo:'https://logo.clearbit.com/lsu.edu.az',    color:'#27ae60', emoji:'🌿', established:1991, studentCount:'4.000+',  type:'dövlət', about:'Lənkəran regionunun əsas ali məktəbi. Humanitar, iqtisadi, pedaqoji sahələri əhatə edir.' },
  { id:'ndu',   name:'Naxçıvan Dövlət Universiteti',                                          shortName:'NDU',      city:'Naxçıvan',   region:'naxçıvan',  website:'https://ndu.edu.az',    logo:'https://logo.clearbit.com/ndu.edu.az',    color:'#16a085', emoji:'🏔️', established:1967, studentCount:'5.000+',  type:'dövlət', about:'Naxçıvan Muxtar Respublikasının əsas ali məktəbi. Geniş ixtisas spektri ilə regionun təhsil ehtiyaclarını ödəyir.' },
  { id:'mdu',   name:'Mingəçevir Dövlət Universiteti',                                        shortName:'MDU',      city:'Mingəçevir', region:'mingəçevir', website:'https://mdu.edu.az',    logo:'https://logo.clearbit.com/mdu.edu.az',    color:'#2c3e50', emoji:'⚡', established:2000, studentCount:'3.000+',  type:'dövlət', about:'Mingəçevir şəhərinin ali tədris müəssisəsi. Energetika, texniki, iqtisadi sahələri əhatə edir.' },
  { id:'aau',   name:'Azərbaycan Texnologiya Universiteti',                                   shortName:'ATU-Gəncə',city:'Gəncə',      region:'gəncə',     website:'https://atu.edu.az',    logo:'https://logo.clearbit.com/atu.edu.az',    color:'#8e44ad', emoji:'🔬', established:1959, studentCount:'5.000+',  type:'dövlət', about:'Texnologiya, kimya, yeyinti sənayesi, mühəndislik sahələrini əhatə edən ixtisaslaşmış universitet.' },
  { id:'bmu',   name:'Bakı Mühəndislik Universiteti',                                         shortName:'BMU',      city:'Xırdalan',   region:'abşeron',   website:'https://beu.edu.az',    logo:'https://logo.clearbit.com/beu.edu.az',    color:'#2980b9', emoji:'🤖', established:2014, studentCount:'4.000+',  type:'dövlət', about:'Müasir mühəndislik, texnologiya, rəqəmsal innovasiya sahəsinin aparıcı universiteti. Yüksək standartlı tədris mühiti.' },
  { id:'atyul', name:'Azərbaycan Tibb Universiteti',                                          shortName:'ATU',      city:'Bakı',       region:'bakı',      website:'https://amu.edu.az',    logo:'https://logo.clearbit.com/amu.edu.az',    color:'#e74c3c', emoji:'🏥', established:1930, studentCount:'10.000+', type:'dövlət', about:'Azərbaycanın həkimlər, stomatoloqlar, əczaçılar yetişdirən əsas tibb universiteti. Yüksək rəqabətli qəbul balları ilə tanınır.' },
  { id:'oia',   name:'Azərbaycan Dövlət Mədəniyyət və İncəsənət Universiteti',               shortName:'ADMİU',    city:'Bakı',       region:'bakı',      website:'https://admiu.edu.az',  logo:'https://logo.clearbit.com/admiu.edu.az',  color:'#f39c12', emoji:'🎭', established:1945, studentCount:'3.000+',  type:'dövlət', about:'Musiqi, incəsənət, mədəniyyət sahəsi üzrə ixtisaslaşmış universitet. Azərbaycanın mədəni həyatına töhfə verən mütəxəssislər yetişdirir.' },
  { id:'dia',   name:'Azərbaycan Respublikası Prezidenti yanında Dövlət İdarəçilik Akademiyası', shortName:'DİA', city:'Bakı',       region:'bakı',      website:'https://dia.edu.az',    logo:'https://logo.clearbit.com/dia.edu.az',    color:'#1e3a5f', emoji:'🏛️', established:1999, studentCount:'2.000+',  type:'dövlət', about:'Dövlət idarəçiliyi, hüquq, siyasi elm sahəsinin elit tədris mərkəzi. Azərbaycan dövlət qulluğunun aparıcı kadrlarını yetişdirir.' },
  { id:'oyu',   name:'"Odlar Yurdu" Universiteti',                                            shortName:'OYU',      city:'Bakı',       region:'bakı',      website:'https://oyu.edu.az',    logo:'https://logo.clearbit.com/oyu.edu.az',    color:'#c0392b', emoji:'🔥', established:1995, studentCount:'4.000+',  type:'özəl',   about:'Kompüter elmləri, informasiya texnologiyaları, hüquq, iqtisadiyyat sahələrini əhatə edən özəl universitet.' },
  { id:'bbu',   name:'Bakı Biznes Universiteti',                                              shortName:'BBU',      city:'Bakı',       region:'bakı',      website:'https://bbu.edu.az',    logo:'https://logo.clearbit.com/bbu.edu.az',    color:'#27ae60', emoji:'💡', established:1999, studentCount:'3.000+',  type:'özəl',   about:'Biznes, iqtisadiyyat, hüquq, İT sahələri üzrə ixtisaslaşmış özəl universitet.' },
  { id:'bqu',   name:'Bakı Qızlar Universiteti',                                              shortName:'BQU',      city:'Bakı',       region:'bakı',      website:'https://bqu.edu.az',    logo:'https://logo.clearbit.com/bqu.edu.az',    color:'#e91e8c', emoji:'🌸', established:2000, studentCount:'2.000+',  type:'dövlət', about:'Azərbaycanda qızlar üçün ixtisaslaşmış ali məktəb. Humanitar, pedaqoji, iqtisadi sahələri əhatə edir.' },
  { id:'adau',  name:'Azərbaycan Dövlət Aqrar Universiteti',                                  shortName:'ADAU',     city:'Gəncə',      region:'gəncə',     website:'https://adau.edu.az',   logo:'https://logo.clearbit.com/adau.edu.az',   color:'#2ecc71', emoji:'🌾', established:1929, studentCount:'5.000+',  type:'dövlət', about:'Aqronomiya, baytarlıq, aqromühəndislik sahəsinin aparıcı universiteti. Azərbaycan kənd təsərrüfatının inkişafına töhfə verir.' },
  { id:'beau',  name:'Bakı Avrasiya Universiteti',                                            shortName:'BAAU',     city:'Bakı',       region:'bakı',      website:'https://baau.edu.az',   logo:'https://logo.clearbit.com/baau.edu.az',   color:'#3498db', emoji:'🌍', established:1993, studentCount:'3.000+',  type:'özəl',   about:'İqtisadiyyat, hüquq, informasiya texnologiyaları sahəsini əhatə edən özəl universitet.' },
  { id:'qku',   name:'Qərbi Kaspi Universiteti',                                              shortName:'QKU',      city:'Bakı',       region:'bakı',      website:'https://wcu.edu.az',    logo:'https://logo.clearbit.com/wcu.edu.az',    color:'#1abc9c', emoji:'🌊', established:2000, studentCount:'2.500+',  type:'özəl',   about:'Müasir tədris metodları ilə hüquq, iqtisadiyyat, mühəndislik sahələrini əhatə edir.' },
];

const SEED_COLLEGES: CollegeRow[] = [
  { id:'col-1',  name:'Azərbaycan Dövlət İqtisad Universitetinin nəzdində Azərbaycan Maliyyə-İqtisad Kolleci',            shortName:'AMİK',      city:'Bakı',       website:'https://unec.edu.az/afec/',         logo:'', emoji:'🏫', color:'#10b981', type:'dövlət', established:1920, about:'Azərbaycanın ən köklü və aparıcı maliyyə-iqtisad təhsili verən orta ixtisas müəssisəsi.' },
  { id:'col-2',  name:'Bakı Dövlət Universitetinin nəzdində İqtisadiyyat və Humanitar Kolleci',                            shortName:'BDU-İHK',   city:'Bakı',       website:'http://ihk.bsu.edu.az',             logo:'', emoji:'🏫', color:'#10b981', type:'dövlət', established:1968, about:'Humanitar və iqtisadi sahədə peşəkar subbakalavrlar hazırlayan müəssisə.' },
  { id:'col-3',  name:'Azərbaycan Dövlət İqtisad Universitetinin nəzdində Qida Sənayesi Kolleci',                         shortName:'ADU-QSK',   city:'Bakı',       website:'https://unec.edu.az',               logo:'', emoji:'🏫', color:'#10b981', type:'dövlət', established:1960, about:'Qida sənayesi və otel xidməti sahələri üzrə ixtisaslaşmış kollec.' },
  { id:'col-4',  name:'Azərbaycan Dövlət Neft və Sənaye Universitetinin nəzdində Sənaye və Texnologiya Kolleci',          shortName:'ADNSU-STK', city:'Bakı',       website:'https://asoiu.edu.az',              logo:'', emoji:'🏫', color:'#10b981', type:'dövlət', established:1953, about:'Texnoloji, mühəndislik və rəqəmsal sahələr üzrə peşəkar subbakalavrlar yetişdirir.' },
  { id:'col-5',  name:'Azərbaycan Dövlət Pedaqoji Universitetinin nəzdində Azərbaycan Dövlət Pedaqoji Kolleci',           shortName:'ADPK',      city:'Bakı',       website:'https://adpk.adpu.edu.az',          logo:'', emoji:'🏫', color:'#10b981', type:'dövlət', established:1920, about:'Azərbaycanın pedaqoji və ibtidai sinif müəllimliyi üzrə ən nüfuzlu kolleci.' },
  { id:'col-6',  name:'Azərbaycan Texniki Universitetinin nəzdində Bakı Dövlət Rabitə və Nəqliyyat Kolleci',              shortName:'ATU-BDRNK', city:'Bakı',       website:'https://bdrnk.aztu.edu.az',         logo:'', emoji:'🏫', color:'#10b981', type:'dövlət', established:1925, about:'Rabitə, informasiya texnologiyaları və nəqliyyat sahəsinin aparıcı kolleci.' },
  { id:'col-7',  name:'Bakı Xoreoqrafiya Akademiyasının nəzdində orta ixtisas təhsil müəssisəsi',                        shortName:'BXA-OİTM',  city:'Bakı',       website:'https://bxa.edu.az',                logo:'', emoji:'💃', color:'#8e44ad', type:'dövlət', established:1933, about:'Milli rəqs və xoreoqrafiya üzrə peşəkar sənət adamları yetişdirir.' },
  { id:'col-8',  name:'Azərbaycan Dövlət Mədəniyyət və İncəsənət Universitetinin nəzdində Humanitar Kollec',             shortName:'ADMİU-HK',  city:'Bakı',       website:'https://admiu.edu.az',              logo:'', emoji:'🎭', color:'#f39c12', type:'dövlət', established:1970, about:'Mədəniyyət, muzey işi və tətbiqi incəsənət ixtisasları təklif edən müəssisə.' },
  { id:'col-9',  name:'Azərbaycan Dövlət Rəssamlıq Akademiyasının nəzdində İncəsənət Kolleci',                           shortName:'ADRA-İK',   city:'Bakı',       website:'https://adra.edu.az',               logo:'', emoji:'🎨', color:'#27ae60', type:'dövlət', established:1920, about:'Heykəltəraşlıq, rəngkarlıq, dizayn və incəsənət sahəsinin təməl müəssisəsi.' },
  { id:'col-10', name:'Azərbaycan Milli Konservatoriyasının nəzdində Musiqi Kolleci',                                     shortName:'AMK-MK',    city:'Bakı',       website:'http://amk.edu.az',                 logo:'', emoji:'🎵', color:'#2980b9', type:'dövlət', established:1895, about:'Azərbaycanın ən qədim və şanlı musiqi təhsili ocaqlarından biri (Asəf Zeynallı adına).' },
  { id:'col-11', name:'Azərbaycan Milli Konservatoriyasının nəzdində Sumqayıt Musiqi Kolleci',                            shortName:'AMK-SMK',   city:'Sumqayıt',   website:'http://amk.edu.az',                 logo:'', emoji:'🎹', color:'#c0392b', type:'dövlət', established:1960, about:'Sumqayıt şəhərində musiqi və estrada sənəti üzrə peşəkar təhsil müəssisəsi.' },
  { id:'col-12', name:'Bakı Biznes və Kooperasiya Kolleci',                                                               shortName:'BBKK',      city:'Bakı',       website:'https://bbkk.edu.az',               logo:'', emoji:'🏫', color:'#16a085', type:'özəl',   established:1938, about:'Kooperasiya, maliyyə, mühasibat sahəsində böyük ənənəyə malik özəl müəssisə.' },
  { id:'col-13', name:'Azərbaycan Dövlət Aqrar Universitetinin nəzdində Göyçay Dövlət İdarəetmə və Texnologiya Kolleci', shortName:'ADAU-GDİTK',city:'Göyçay',     website:'https://gditk.adau.edu.az',         logo:'', emoji:'🌾', color:'#2ecc71', type:'dövlət', established:1950, about:'Kənd təsərrüfatı, idarəetmə və texnoloji sahələrdə kadrlar yetişdirən regional kollec.' },
  { id:'col-14', name:'Azərbaycan Texnologiya Universitetinin nəzdində Gəncə Texniki Kolleci',                            shortName:'ATU-GTK',   city:'Gəncə',      website:'https://gtk.utca.edu.az',           logo:'', emoji:'⚙️', color:'#d35400', type:'dövlət', established:1960, about:'Gəncə regionunun sənaye və mühəndislik sahəsində peşəkar subbakalavrlar yetişdirən təhsil müəssisəsi.' },
  { id:'col-15', name:'Azərbaycan Texniki Universitetinin nəzdində Bakı Texniki Kolleci',                                 shortName:'ATU-BTK',   city:'Bakı',       website:'https://btc.aztu.edu.az',           logo:'', emoji:'🏫', color:'#10b981', type:'dövlət', established:1920, about:'Sənaye, energetika, informasiya texnologiyaları üzrə peşəkar subbakalavrlar hazırlayan müəssisə.' },
  { id:'col-16', name:'Azərbaycan Dövlət Neft və Sənaye Universitetinin nəzdində Bakı Neft-Energetika Kolleci',          shortName:'ADNSU-BNEK',city:'Bakı',       website:'https://asoiu.edu.az',              logo:'', emoji:'⚡', color:'#e67e22', type:'dövlət', established:1940, about:'Neft sənayesi, energetika və avtomatika sahəsində ixtisaslaşmış kollec.' },
  { id:'col-17', name:'Azərbaycan Memarlıq və İnşaat Universitetinin nəzdində İnşaat Kolleci',                            shortName:'AMİU-İK',   city:'Bakı',       website:'https://azmiu.edu.az',              logo:'', emoji:'🏗️', color:'#34495e', type:'dövlət', established:1930, about:'Memarlıq, inşaat, geodeziya sahələri üzrə ixtisaslı subbakalavr hazırlayan müəssisə.' },
  { id:'col-18', name:'Naxçıvan Dövlət Texniki Kolleci',                                                                 shortName:'NDTK',      city:'Naxçıvan',   website:'https://ndu.edu.az',                logo:'', emoji:'🔧', color:'#7f8c8d', type:'dövlət', established:1970, about:'Naxçıvan MR-da texniki, mühəndislik və İKT sahəsində peşəkar kadrlar yetişdirir.' },
  { id:'col-19', name:'Naxçıvan Musiqi Kolleci',                                                                         shortName:'NMK',       city:'Naxçıvan',   website:'https://ndu.edu.az',                logo:'', emoji:'🎻', color:'#9b59b6', type:'dövlət', established:1975, about:'Naxçıvan regionunda musiqi və xalq sənətləri üzrə zəngin tədris verən müəssisə.' },
  { id:'col-20', name:'Qazax Dövlət Sosial-İqtisadi Kolleci',                                                            shortName:'QDSİK',     city:'Qazax',      website:'https://bsu.edu.az',                logo:'', emoji:'📚', color:'#16a085', type:'dövlət', established:1959, about:'Qazax regionunda humanitar, pedaqoji və iqtisadiyyat sahəsində subbakalavr hazırlığı.' },
  { id:'col-21', name:'Tovuz Dövlət Sosial-İqtisadi Kolleci',                                                            shortName:'TDSİK',     city:'Tovuz',      website:'https://bsu.edu.az',                logo:'', emoji:'📖', color:'#27ae60', type:'dövlət', established:2002, about:'Qərb bölgəsində sosial və iqtisadi sahədə subbakalavrlar yetişdirən təhsil müəssisəsi.' },
  { id:'col-22', name:'Sumqayıt Dövlət Universitetinin nəzdində Sumqayıt Dövlət Texniki Kolleci',                        shortName:'SDU-SDTK',  city:'Sumqayıt',   website:'https://sdu.edu.az',                logo:'', emoji:'⚙️', color:'#2980b9', type:'dövlət', established:1962, about:'Kimya sənayesi, metallurgiya və texnoloji sahələrdə Sumqayıt bölgəsinin aparıcı kolleci.' },
  { id:'col-23', name:'Quba Dövlət Sosial-İqtisadi Kolleci',                                                             shortName:'QDSİK',     city:'Quba',       website:'https://sdu.edu.az',                logo:'', emoji:'🍎', color:'#c0392b', type:'dövlət', established:1999, about:'Şimal bölgəsində iqtisadiyyat, turizm və humanitar sahələrdə kadr hazırlığı aparan müəssisə.' },
  { id:'col-24', name:'Şamaxı Dövlət Regional Kolleci',                                                                  shortName:'ŞDRK',      city:'Şamaxı',     website:'https://adpu.edu.az',               logo:'', emoji:'🍇', color:'#8e44ad', type:'dövlət', established:2002, about:'Şamaxı və Dağlıq Şirvan bölgəsində pedaqoji və iqtisadi sahədə kadrlar yetişdirir.' },
  { id:'col-25', name:'Mingəçevir Turizm Kolleci',                                                                       shortName:'MTK',       city:'Mingəçevir', website:'https://mtk.edu.az',                logo:'', emoji:'🌊', color:'#3498db', type:'dövlət', established:2006, about:'Azərbaycanın turizm, otelçilik və xidmət sahələrində ən populyar regional kolleclərindən biri.' },
  { id:'col-26', name:'Şəki Dövlət Regional Kolleci',                                                                    shortName:'ŞDRK-Şəki', city:'Şəki',       website:'https://adpu.edu.az',               logo:'', emoji:'🍯', color:'#f39c12', type:'dövlət', established:1999, about:'Şəki-Zaqatala regionunun humanitar, pedaqoji və texnoloji sahələrdə əsas subbakalavr mərkəzi.' },
  { id:'col-27', name:'Zaqatala Dövlət İdarəetmə və Texnologiya Kolleci',                                                shortName:'ZDİTK',     city:'Zaqatala',   website:'https://unec.edu.az',               logo:'', emoji:'🌰', color:'#d35400', type:'dövlət', established:2002, about:'Regional idarəetmə, iqtisadiyyat və aqrar texnologiyalar sahəsində kadr hazırlığı.' },
  { id:'col-28', name:'Şuşa Humanitar Kolleci',                                                                          shortName:'ŞHK',       city:'Bakı',       website:'https://admiu.edu.az',              logo:'', emoji:'🏰', color:'#16a085', type:'dövlət', established:1930, about:'Qarabağın zəngin humanitar və mədəniyyət ənənələrini qoruyan və yaşadan tarixi kollec.' },
  { id:'col-29', name:'Ağdam Dövlət Sosial-İqtisadi Kolleci',                                                            shortName:'ADSİK',     city:'Ağdam',      website:'https://asoiu.edu.az',              logo:'', emoji:'🏛️', color:'#27ae60', type:'dövlət', established:1952, about:'Sosial, iqtisadi və kənd təsərrüfatı sahələri üzrə ixtisaslı subbakalavrlar yetişdirir.' },
  { id:'col-30', name:'Ağdam Musiqi Kolleci',                                                                            shortName:'AMK-Ağdam', city:'Ağdam',      website:'http://amk.edu.az',                 logo:'', emoji:'🎵', color:'#2980b9', type:'dövlət', established:1960, about:'Qarabağ muğam və musiqi məktəbinin zəngin ənənələrini yaşadan kollec.' },
  { id:'col-31', name:'Ağdaş Dövlət Humanitar Kolleci',                                                                  shortName:'ADHK',      city:'Ağdaş',      website:'https://adpu.edu.az',               logo:'', emoji:'🌳', color:'#2ecc71', type:'dövlət', established:1926, about:'İbtidai sinif, məktəbəqədər təlim-tərbiyə üzrə böyük tarixə malik pedaqoji müəssisə.' },
  { id:'col-32', name:'Ağcabədi Pedaqoji Kolleci',                                                                       shortName:'APK',       city:'Ağcabədi',   website:'https://adpu.edu.az',               logo:'', emoji:'✏️', color:'#1abc9c', type:'dövlət', established:1999, about:'Mil-Qarabağ bölgəsində pedaqoji, humanitar və dil-ədəbiyyat sahəsində kadr hazırlığı.' },
  { id:'col-33', name:'Şirvan Dövlət İqtisadiyyat və Humanitar Kolleci',                                                 shortName:'ŞDİHK',     city:'Şirvan',     website:'https://unec.edu.az',               logo:'', emoji:'🔥', color:'#e74c3c', type:'dövlət', established:2002, about:'Şirvan bölgəsində maliyyə, iqtisadiyyat və humanitar fənlər üzrə peşəkar subbakalavr hazırlığı.' },
  { id:'col-34', name:'Bərdə Dövlət İdarəetmə və Texnologiya Kolleci',                                                   shortName:'BDİTK',     city:'Bərdə',      website:'https://asoiu.edu.az',              logo:'', emoji:'🛡️', color:'#f39c12', type:'dövlət', established:2002, about:'Bərdə regionunda idarəetmə, mühasibat və texniki sahələrdə peşəkar təhsil müəssisəsi.' },
  { id:'col-35', name:'Sabirabad Dövlət Sosial-İqtisadi Kolleci',                                                        shortName:'SDSİK',     city:'Sabirabad',  website:'https://unec.edu.az',               logo:'', emoji:'🍉', color:'#2ecc71', type:'dövlət', established:1999, about:'Sabirabad və Saatlı regionunda mühasibat və regional idarəetmə üzrə subbakalavr hazırlığı.' },
  { id:'col-36', name:'Astara Pedaqoji Kolleci',                                                                         shortName:'APK-Astara',city:'Astara',     website:'https://adpu.edu.az',               logo:'', emoji:'🌊', color:'#3498db', type:'dövlət', established:2002, about:'Cənub bölgəsində məktəbəqədər təlim və ibtidai təhsil üzrə peşəkar pedaqoji müəssisə.' },
  { id:'col-37', name:'İsmayıllı Dövlət Humanitar və Texnologiya Kolleci',                                               shortName:'İDHTK',     city:'İsmayıllı',  website:'https://unec.edu.az',               logo:'', emoji:'🏔️', color:'#9b59b6', type:'dövlət', established:2003, about:'Turizm, informasiya texnologiyaları və xidmət sahələri üzrə ixtisaslaşmış kollec.' },
  { id:'col-38', name:'Masallı Dövlət Regional Kolleci',                                                                 shortName:'MDRK',      city:'Masallı',    website:'https://adpu.edu.az',               logo:'', emoji:'🍵', color:'#16a085', type:'dövlət', established:2016, about:'Cənub bölgəsinin sürətlə inkişaf edən regional, çoxsahəli tədris verən kolleci.' },
];
