import { useState, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Specialty, Group, EducationLevel } from '../data/specialties';
import { fetchSpecialties } from '../lib/api';
import { BookOpen, MapPin, CreditCard, ChevronRight, ChevronLeft, AlertCircle, Star, CheckCircle, Trophy, GripVertical, Download, Loader2, Heart, BarChart2, TrendingDown } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useComparison } from '../context/ComparisonContext';
import { exportToExcel } from '../utils/export';
import { useLang } from '../context/LanguageContext';

type PaymentFilter = 'hər ikisi' | 'pulsuz' | 'ödənişli';
type RegionFilter = 'hər yerdə' | 'bakı' | 'gəncə' | 'sumqayıt' | 'lənkəran' | 'naxçıvan' | 'abşeron' | 'qarabağ';
type LevelFilter = EducationLevel;
type SubgroupFilter = 'all' | 'RK' | 'RI' | 'DT' | 'TC';

const regionLabels: Record<RegionFilter, string> = {
  'hər yerdə': 'Fərqi yoxdur (bütün regionlar)',
  bakı: 'Yalnız Bakı',
  gəncə: 'Gəncə',
  sumqayıt: 'Sumqayıt',
  lənkəran: 'Lənkəran',
  naxçıvan: 'Naxçıvan',
  abşeron: 'Abşeron (Xırdalan)',
  qarabağ: 'Qarabağ',
};

const groupOptions: Group[] = ['I', 'II', 'III', 'IV', 'V'];
const levelOptions: LevelFilter[] = ['bakalavr', 'magistr', 'rezidentura', 'kollec_9', 'kollec_11', 'subbakalavr'];
const levelLabels: Record<LevelFilter, string> = {
  bakalavr: '🎓 Bakalavriat',
  magistr: '📚 Magistratura',
  rezidentura: '⚕️ Rezidentura',
  kollec_9: '🏫 9 illik Kollec',
  kollec_11: '🏫 11 illik Kollec',
  subbakalavr: '📜 Subbakalavr',
};

function getStatus(userBal: number, spec: Specialty, _payFilter: PaymentFilter): { label: string; color: string; badge: string; priority: number } {
  const dovletBal = spec.bal_dovlet ?? 0;
  const odenisBal = spec.bal_odenis ?? 0;

  // Check dövlət yeri (free state-funded spot) first
  if (dovletBal > 0) {
    const diff = userBal - dovletBal;
    if (diff >= 10) return { label: '✅ Dövlət Yeri - Düşür', color: 'text-green-400', badge: 'bg-green-500/20 text-green-400 border border-green-500/30', priority: 1 };
    if (diff >= -5) return { label: '⚡ Dövlət Yeri - Yaxın', color: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30', priority: 2 };
    // Not enough for state but check paid
    if (odenisBal > 0) {
      const diffO = userBal - odenisBal;
      if (diffO >= 0) return { label: '💰 Ödənişli - Düşür', color: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-400 border border-orange-500/30', priority: 3 };
      if (diffO >= -20) return { label: '💡 Ödənişli - Yaxın', color: 'text-cyan-400', badge: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30', priority: 4 };
    }
    if (diff >= -35) return { label: '🔥 Əldə Edilə bilər', color: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-400 border border-orange-500/30', priority: 5 };
    return { label: '❌ Çatmır', color: 'text-red-400', badge: 'bg-red-500/20 text-red-400 border border-red-500/30', priority: 10 };
  }

  // Only paid score available
  if (odenisBal > 0) {
    const diffO = userBal - odenisBal;
    if (diffO >= 0) return { label: '💰 Ödənişli - Düşür', color: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-400 border border-orange-500/30', priority: 3 };
    if (diffO >= -20) return { label: '💡 Ödənişli - Yaxın', color: 'text-cyan-400', badge: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30', priority: 4 };
    return { label: '❌ Çatmır', color: 'text-red-400', badge: 'bg-red-500/20 text-red-400 border border-red-500/30', priority: 10 };
  }

  return { label: '❓ Məlumat yoxdur', color: 'text-blue-300', badge: 'bg-blue-500/20 text-blue-300 border border-blue-500/30', priority: 6 };
}

export default function SpecialtyWizard() {
  const { t } = useLang();
  const [searchParams] = useSearchParams();
  const isLowScore = searchParams.get('lowscore') === '1';

  const [step, setStep] = useState(1);
  const [level, setLevel] = useState<LevelFilter>(isLowScore ? 'kollec_9' : 'bakalavr');
  const [attestat, setAttestat] = useState('');
  const [blok1, setBlok1] = useState('');
  const [blok2, setBlok2] = useState('');
  const [group, setGroup] = useState<Group>('I');
  const [payFilter, setPayFilter] = useState<PaymentFilter>('hər ikisi');
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('hər yerdə');
  const [subgroup, setSubgroup] = useState<SubgroupFilter>('all');
  const [lowBlock, setLowBlock] = useState(false);
  const [results, setResults] = useState<Specialty[]>([]);
  const [selectedList, setSelectedList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);
  const { toggleFavorite, isFavorite } = useFavorites();
  const { toggleComparison, isInComparison, setShowModal: setShowComparison } = useComparison();

  const downloadPDF = () => {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      
      const c = (str: string) => {
        if (!str) return '';
        return str
          .replace(/ə/g, 'e').replace(/Ə/g, 'E')
          .replace(/ı/g, 'i').replace(/I/g, 'I')
          .replace(/ö/g, 'o').replace(/Ö/g, 'O')
          .replace(/ü/g, 'u').replace(/Ü/g, 'U')
          .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
          .replace(/ç/g, 'c').replace(/Ç/g, 'C')
          .replace(/ş/g, 's').replace(/Ş/g, 'S');
      };

      doc.setFillColor(30, 58, 95);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(c('DIM IXTISAS SECIMI SIHIRBAZI - SECIM SIYAHISI'), 15, 18);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(c('dim-admission-assistant.gov.az - Sizin Ugurlu Geleceyiniz'), 15, 28);
      
      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
      doc.text(dateStr, 175, 28);
      
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(c('Talebe Melumatlari:'), 15, 52);
      
      doc.setFont('helvetica', 'normal');
      doc.text(c(`Umumi Baliniz: ${totalBal}`), 15, 60);
      doc.text(c(`Tehsil Pillesi: ${levelLabels[level].replace(/[^\w\s-]/g, '').trim()}`), 15, 67);
      if (level === 'bakalavr') {
        doc.text(c(`Ixtisas Qrupu: ${group} Qrup`), 15, 74);
      }
      
      doc.setFillColor(240, 244, 248);
      doc.rect(15, 85, 180, 8, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 58, 95);
      
      doc.text(c('Sira'), 17, 90);
      doc.text(c('Ixtisas Adi'), 35, 90);
      doc.text(c('Uni'), 120, 90);
      doc.text(c('Odenis Bali'), 145, 90);
      doc.text(c('Dovlet Yeri'), 173, 90);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(15, 93, 195, 93);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      
      let y = 99;

      selectedList.forEach((id, index) => {
        const spec = results.find(s => s.id === id);
        if (!spec) return;
        
        if (y > 275) {
          doc.addPage();
          
          doc.setFillColor(240, 244, 248);
          doc.rect(15, 15, 180, 8, 'F');
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(30, 58, 95);
          
          doc.text(c('Sira'), 17, 20);
          doc.text(c('Ixtisas Adi'), 35, 20);
          doc.text(c('Uni'), 120, 20);
          doc.text(c('Odenis Bali'), 145, 20);
          doc.text(c('Dovlet Yeri'), 173, 20);
          
          doc.line(15, 23, 195, 23);
          
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(60, 60, 60);
          y = 29;
        }
        
        doc.text(String(index + 1), 17, y);

        let specName = spec.name;
        if (specName.length > 46) {
          specName = specName.substring(0, 44) + '...';
        }
        doc.text(c(specName), 35, y);

        doc.text(c(spec.universityShort), 120, y);
        doc.text(String(spec.bal_odenis ?? '—'), 145, y);
        doc.text(String(spec.bal_dovlet ?? '—'), 173, y);
        
        doc.setDrawColor(240, 240, 240);
        doc.line(15, y + 2, 195, y + 2);
        
        y += 8;
      });
      
      if (y > 255) {
        doc.addPage();
        y = 25;
      } else {
        y += 5;
      }
      
      doc.setFillColor(255, 248, 220);
      doc.rect(15, y, 180, 18, 'F');
      doc.setDrawColor(218, 165, 32);
      doc.rect(15, y, 180, 18, 'D');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(139, 69, 19);
      doc.text(c('QEYD:'), 18, y + 5);
      
      doc.setFont('helvetica', 'normal');
      doc.text(c('Bu siyahini e-kabinet.dim.gov.az portalinda ixtisas secimi merhelesinde eyni ardicilliqla daxil edin.'), 18, y + 10);
      doc.text(c('DIM-in resmi sehifesinde ixtisas kodlarinizi ve odenis novlerini tekrar yoxlamaq tovsiye olunur.'), 18, y + 14);
      
      doc.save(`dim_ixtisas_secimi_${dateStr}.pdf`);
    });
  };

  const [errors, setErrors] = useState({ attestat: '', blok1: '', blok2: '', total: '' });

  // rezidentura uses blok1 = I mərhələ (max 100), blok2 = II mərhələ (max 100)
  const totalBal = (() => {
    const a = Number(attestat) || 0;
    const b1 = Number(blok1) || 0;
    const b2 = Number(blok2) || 0;
    if (level === 'magistr') return a;
    if (level === 'kollec_9' || level === 'kollec_11' || level === 'subbakalavr') return a;
    if (level === 'rezidentura') return b1 + b2;
    return a + Math.max(b1, b2);
  })();

  const validateAndNext = () => {
    const errs = { attestat: '', blok1: '', blok2: '', total: '' };
    let valid = true;

    if (level === 'bakalavr') {
      const a = Number(attestat);
      const b1 = Number(blok1);
      void Number(blok2); // b2 checked inline below

      if (!attestat || isNaN(a) || a < 0 || a > 300) {
        errs.attestat = 'Attestat balı 0-300 arasında olmalıdır!';
        valid = false;
      }
      if (!blok1 || isNaN(b1) || b1 < 0 || b1 > 400) {
        errs.blok1 = 'Blok I cəhd balı 0-400 arasında olmalıdır!';
        valid = false;
      }
      if (blok2 && (isNaN(Number(blok2)) || Number(blok2) < 0 || Number(blok2) > 400)) {
        errs.blok2 = 'Blok II cəhd balı 0-400 arasında olmalıdır!';
        valid = false;
      }
      const total = a + Math.max(b1, blok2 ? Number(blok2) : 0);
      if (valid && total > 700) {
        errs.total = `Ümumi bal (${total}) 700-dən çox ola bilməz!`;
        valid = false;
      }
    } else if (level === 'magistr') {
      const a = Number(attestat);
      if (!attestat || isNaN(a) || a < 0 || a > 100) {
        errs.attestat = 'Magistratura balı 0-100 arasında olmalıdır!';
        valid = false;
      }
    } else if (level === 'rezidentura') {
      const r1 = Number(blok1);
      const r2 = Number(blok2);
      if (!blok1 || isNaN(r1) || r1 < 0 || r1 > 100) {
        errs.blok1 = 'I mərhələ balı 0-100 arasında olmalıdır!';
        valid = false;
      } else if (r1 < 40) {
        errs.blok1 = 'I mərhələdən keçid balı minimum 40-dır!';
        valid = false;
      }
      if (!blok2 || isNaN(r2) || r2 < 0 || r2 > 100) {
        errs.blok2 = 'II mərhələ balı 0-100 arasında olmalıdır!';
        valid = false;
      } else if (r2 < 50) {
        errs.blok2 = 'II mərhələdən keçid balı minimum 50-dir!';
        valid = false;
      }
    } else if (level === 'kollec_9') {
      const a = Number(attestat);
      if (!attestat || isNaN(a) || a < 0 || a > 200) {
        errs.attestat = 'Buraxılış imtahanı balı 0-200 arasında olmalıdır!';
        valid = false;
      }
    } else if (level === 'kollec_11') {
      const a = Number(attestat);
      if (!attestat || isNaN(a) || a < 0 || a > 300) {
        errs.attestat = 'Buraxılış imtahanı balı 0-300 arasında olmalıdır!';
        valid = false;
      }
    } else {
      const a = Number(attestat);
      if (!attestat || isNaN(a) || a < 0 || a > 100) {
        errs.attestat = 'Bal 0-100 arasında olmalıdır!';
        valid = false;
      }
    }

    setErrors(errs);
    if (valid) setStep(3);
  };

  const filterAndRankSpecialties = async () => {
    setLoading(true);
    setFetchError('');
    try {
      // In lowscore mode, widen the search range significantly
      const minBalOffset = isLowScore ? -999 : -200;
      const maxBalOffset = isLowScore ? 999 : 40;
      const data = await fetchSpecialties({
        level,
        group: level === 'bakalavr' ? group : undefined,
        minBal: totalBal + minBalOffset,
        maxBal: totalBal + maxBalOffset,
        region: regionFilter !== 'hər yerdə' ? regionFilter : undefined,
        payment: payFilter !== 'hər ikisi' ? payFilter : undefined,
      });

      let sorted = [...data].sort((a, b) => {
        const statusA = getStatus(totalBal, a, payFilter);
        const statusB = getStatus(totalBal, b, payFilter);
        const refA = a.bal_dovlet ?? a.bal_odenis ?? 0;
        const refB = b.bal_dovlet ?? b.bal_odenis ?? 0;
        if (statusA.priority !== statusB.priority) return statusA.priority - statusB.priority;
        return Math.abs(totalBal - refA) - Math.abs(totalBal - refB);
      });

      // Low block filter: if block < 100, restrict to specialties where ödənişli cutoff <= attestat + 100 + 20 buffer
      if (lowBlock && level === 'bakalavr') {
        const effectiveCap = (Number(attestat) || 0) + 100 + 20;
        sorted = sorted.filter(s => {
          const refBal = s.bal_odenis ?? s.bal_dovlet ?? 0;
          return refBal === 0 || refBal <= effectiveCap;
        });
      }

      setResults(sorted);
      setSelectedList([]);
      setStep(4);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err: any) {
      setFetchError(err.message || 'Məlumat yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedList(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      const newList = [...prev, id];
      return newList.sort((a, b) => {
        const specA = results.find(s => s.id === a);
        const specB = results.find(s => s.id === b);
        const balA = specA?.bal_dovlet ?? specA?.bal_odenis ?? 0;
        const balB = specB?.bal_dovlet ?? specB?.bal_odenis ?? 0;
        return balB - balA;
      });
    });
  };

  const handleReorder = (newOrder: string[]) => {
    setSelectedList(newOrder);
  };

  void (level === 'bakalavr' ? 700 : 100); // maxBal reference for future use

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 relative">
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-blob bg-blob-3" />

      <div className="max-w-5xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          {isLowScore ? (
            <>
              <div className="inline-flex items-center gap-2 bg-rose-600/20 border border-rose-500/30 px-4 py-2 rounded-full text-sm font-medium text-rose-300 mb-4">
                <TrendingDown size={16} />
                100-dən Aşağı Bal — Xüsusi Rejim
              </div>
              <h1 className="text-4xl font-black text-white mb-3">100-dən Aşağı Bal Seçimi</h1>
              <p className="text-gray-400 mb-4">Aşağı bal alanlar üçün münasib kollec, subbakalavr və özəl ixtisaslar</p>
              <div className="glass rounded-2xl p-4 border border-rose-500/20 bg-rose-500/5 max-w-2xl mx-auto text-sm text-gray-300">
                <div className="flex items-start gap-3 text-left">
                  <span className="text-2xl shrink-0">💡</span>
                  <div>
                    <p className="font-semibold text-rose-300 mb-1">100-dən aşağı bal alanlar üçün imkanlar:</p>
                    <ul className="space-y-1 text-gray-400 text-xs">
                      <li>• <strong className="text-white">9-illik Kollec</strong> — buraxılış imtahanı max 200 bal (bu əsasən 9-cu sinif buraxılış imtahanıdır)</li>
                      <li>• <strong className="text-white">11-illik Kollec</strong> — buraxılış imtahanı max 300 bal (11-ci sinif baza)</li>
                      <li>• <strong className="text-white">Subbakalavr</strong> — xüsusi müsabiqə, max 100 bal</li>
                      <li>• <strong className="text-white">Özəl universitetlər</strong> — bəzilərinin keçid balı 100-dən aşağıdır</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 px-4 py-2 rounded-full text-sm font-medium text-blue-300 mb-4">
                <BookOpen size={16} />
                DİM İxtisas Seçim Sihirbazı 2025-2026
              </div>
              <h1 className="text-4xl font-black text-white mb-3">{t('nav_specialty')}</h1>
              <p className="text-gray-400">Balınızı daxil edin, filtrlər seçin — uyğun ixtisaslar avtomatik sıralansın</p>
            </>
          )}
        </motion.div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`step-indicator text-sm font-bold ${
                step === s ? 'step-active text-white' :
                step > s ? 'step-done' : 'step-pending'
              }`}>
                {step > s ? '✓' : s}
              </div>
              {s < 4 && (
                <div className={`w-8 h-0.5 ${step > s ? 'bg-green-500' : 'bg-white/10'} transition-colors`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Level Selection */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
            >
              <div className={`glass rounded-2xl p-8 border mb-6 ${isLowScore ? 'border-rose-500/20' : 'border-white/8'}`}>
                <h2 className="text-2xl font-bold text-white mb-2">{t('wiz_step1')}</h2>
                <p className="text-gray-400 mb-6">
                  {isLowScore ? 'Aşağı bal üçün münasib təhsil pilləsini seçin' : t('wiz_step1_sub')}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {(isLowScore ? (['kollec_9', 'kollec_11', 'subbakalavr'] as LevelFilter[]) : levelOptions).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLevel(l)}
                      className={`p-5 rounded-2xl border text-left transition-all hover-lift ${
                        level === l
                          ? isLowScore
                            ? 'bg-rose-600/20 border-rose-500/60 text-rose-300'
                            : 'bg-blue-600/20 border-blue-500/60 text-blue-300'
                          : 'glass border-white/10 text-gray-300 hover:border-white/20'
                      }`}
                    >
                      <div className="text-3xl mb-2">{levelLabels[l].split(' ')[0]}</div>
                      <div className="font-bold text-lg">{levelLabels[l].slice(2)}</div>
                      {l === 'bakalavr' && <div className="text-xs text-gray-400 mt-1">Attestat (max 300) + Blok (max 400) = max 700</div>}
                      {l === 'magistr' && <div className="text-xs text-gray-400 mt-1">İmtahan: Məntiq+İnformatika+Xarici dil+Esse = max 100</div>}
                      {l === 'rezidentura' && <div className="text-xs text-gray-400 mt-1">I Mərhələ (≥40) + II Mərhələ (≥50)</div>}
                      {l === 'kollec_9' && <div className="text-xs text-gray-400 mt-1">9-illik baza: buraxılış imtahanı, max 200 bal</div>}
                      {l === 'kollec_11' && <div className="text-xs text-gray-400 mt-1">11-illik baza: buraxılış imtahanı, max 300 bal</div>}
                      {l === 'subbakalavr' && <div className="text-xs text-gray-400 mt-1">Buraxılış + Subbakalavrlar üçün xüsusi müsabiqə</div>}
                      {isLowScore && level === l && (
                        <div className="text-xs text-rose-400 mt-2 font-medium">✓ Seçildi</div>
                      )}
                    </button>
                  ))}
                </div>
                {isLowScore && (
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
                    💡 <strong>Məsləhət:</strong> Əgər DİM blok imtahanı balınız varsa, {' '}
                    <button onClick={() => window.location.href = '/ixtilas-secimi'} className="text-blue-400 underline">
                      adi rejimə keçin
                    </button> və bakalavr/magistr seçin.
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(2)}
                  className={`flex items-center gap-2 text-white font-bold px-8 py-4 rounded-2xl ${isLowScore ? 'bg-gradient-to-r from-rose-600 to-pink-600' : 'bg-gradient-to-r from-blue-600 to-purple-600'}`}
                >
                  {t('wiz_next')} <ChevronRight size={18} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Score Input */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
            >
              <div className="glass rounded-2xl p-8 border border-white/8 mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">{t('wiz_step2')}</h2>
                <p className="text-gray-400 mb-6">{t('wiz_step2_sub')}</p>

                <div className="space-y-5">
                  {/* Score inputs — varies by level */}
                  {level !== 'rezidentura' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-2">
                        {level === 'bakalavr'   ? '📄 I Mərhələ Balı — Az.dili + Riyaziyyat + Xarici dil (max 300)' :
                         level === 'kollec_9'   ? '📊 Buraxılış İmtahanı Balı (max 200)' :
                         level === 'kollec_11'  ? '📊 Buraxılış İmtahanı Balı (max 300)' :
                         level === 'magistr'    ? '📊 İmtahan Balı — Məntiq + İnformatika + Xarici dil + Esse (max 100)' :
                                                  '📊 Buraxılış / İmtahan Balı (max 100)'}
                      </label>
                      <input
                        type="number"
                        value={attestat}
                        onChange={e => { setAttestat(e.target.value); setErrors(p => ({ ...p, attestat: '' })); }}
                        placeholder={
                          level === 'bakalavr' || level === 'kollec_11' ? '0 — 300' :
                          level === 'kollec_9' ? '0 — 200' : '0 — 100'
                        }
                        className={`dim-input text-lg font-bold ${errors.attestat ? 'error' : attestat && !errors.attestat ? 'success' : ''}`}
                      />
                      {errors.attestat && (
                        <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                          <AlertCircle size={12} /> {errors.attestat}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Bakalavr blok fields */}
                  {level === 'bakalavr' && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-200 mb-2">
                          🎯 II Mərhələ — Blok İmtahanı I Cəhd (max 400)
                        </label>
                        <input
                          type="number"
                          value={blok1}
                          onChange={e => { setBlok1(e.target.value); setErrors(p => ({ ...p, blok1: '' })); }}
                          placeholder="0 — 400"
                          className={`dim-input text-lg font-bold ${errors.blok1 ? 'error' : blok1 && !errors.blok1 ? 'success' : ''}`}
                        />
                        {errors.blok1 && (
                          <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.blok1}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-200 mb-2">
                          🎯 II Mərhələ — Blok İmtahanı II Cəhd (max 400, ixtiyari)
                          <span className="text-xs text-gray-400 ml-2">Yüksək olan nəticə seçiləcək</span>
                        </label>
                        <input
                          type="number"
                          value={blok2}
                          onChange={e => { setBlok2(e.target.value); setErrors(p => ({ ...p, blok2: '' })); }}
                          placeholder="Doldurmaq məcburi deyil"
                          className={`dim-input text-lg font-bold ${errors.blok2 ? 'error' : ''}`}
                        />
                        {errors.blok2 && (
                          <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.blok2}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {/* Rezidentura — 2 separate stage fields */}
                  {level === 'rezidentura' && (
                    <>
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 mb-2">
                        ⚕️ Rezidenturaya qəbul üçün I mərhələdə <strong>minimum 40 bal</strong>, II mərhələdə <strong>minimum 50 bal</strong> toplamalısınız. Ümumi maksimum: <strong>200 bal</strong>.
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-200 mb-2">
                          🩺 I Mərhələ Balı — 100 qapalı sual (min 40, max 100)
                        </label>
                        <input
                          type="number"
                          value={blok1}
                          onChange={e => { setBlok1(e.target.value); setErrors(p => ({ ...p, blok1: '' })); }}
                          placeholder="40 — 100"
                          className={`dim-input text-lg font-bold ${errors.blok1 ? 'error' : blok1 && !errors.blok1 ? 'success' : ''}`}
                        />
                        {errors.blok1 && (
                          <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.blok1}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-200 mb-2">
                          🩺 II Mərhələ Balı — 100 qapalı sual (min 50, max 100)
                        </label>
                        <input
                          type="number"
                          value={blok2}
                          onChange={e => { setBlok2(e.target.value); setErrors(p => ({ ...p, blok2: '' })); }}
                          placeholder="50 — 100"
                          className={`dim-input text-lg font-bold ${errors.blok2 ? 'error' : blok2 && !errors.blok2 ? 'success' : ''}`}
                        />
                        {errors.blok2 && (
                          <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.blok2}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {/* Total display */}
                  {level === 'bakalavr' && (attestat || blok1) && (
                    <div className="glass rounded-xl p-4 border border-blue-500/20 bg-blue-500/5">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-300">
                          I Mərhələ: <strong className="text-white">{attestat || 0}</strong> + II Mərhələ:{' '}
                          <strong className="text-white">{Math.max(Number(blok1) || 0, Number(blok2) || 0)}</strong> =
                        </div>
                        <div className="text-2xl font-black gradient-text">{totalBal}</div>
                      </div>
                      {errors.total && (
                        <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                          <AlertCircle size={12} /> {errors.total}
                        </p>
                      )}
                    </div>
                  )}
                  {level === 'rezidentura' && (blok1 || blok2) && (
                    <div className="glass rounded-xl p-4 border border-red-500/20 bg-red-500/5">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-300">
                          I Mərhələ: <strong className="text-white">{blok1 || 0}</strong> + II Mərhələ:{' '}
                          <strong className="text-white">{blok2 || 0}</strong> =
                        </div>
                        <div className="text-2xl font-black gradient-text">{totalBal}</div>
                      </div>
                    </div>
                  )}

                  {/* Group selection for bakalavr */}
                  {level === 'bakalavr' && (
                    <div className="space-y-4">
                      {/* Group selection */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-200 mb-3">{t('wiz_group_label')}</label>
                        <div className="flex flex-wrap gap-2">
                          {groupOptions.map(g => (
                            <button
                              key={g}
                              onClick={() => { setGroup(g); setSubgroup('all'); }}
                              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                group === g
                                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                  : 'glass border border-white/10 text-gray-300 hover:border-white/20'
                              }`}
                            >
                              {g} Qrup
                            </button>
                          ))}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {group === 'I' && 'Riyaziyyat, Fizika, Kimya/İnformatika (mühəndislik, IT, texniki)'}
                          {group === 'II' && 'Riyaziyyat, Coğrafiya, Tarix (iqtisadiyyat, biznes, turizm)'}
                          {group === 'III' && 'Az.dili, Tarix, Ədəbiyyat/Coğrafiya (hüquq, humanitar, pedaqoji)'}
                          {group === 'IV' && 'Biologiya, Kimya, Fizika (tibb, əczaçılıq, biologiya)'}
                          {group === 'V' && 'Attestat balı ilə (incəsənət, idman, dizayn)'}
                        </div>
                      </div>

                      {/* Subgroup (altqrup) — only for I and III groups */}
                      {(group === 'I' || group === 'III') && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-200 mb-3">
                            {t('wiz_subgroup_label')}
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setSubgroup('all')}
                              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                subgroup === 'all'
                                  ? 'bg-blue-600 text-white'
                                  : 'glass border border-white/10 text-gray-300 hover:border-white/20'
                              }`}
                            >
                              {t('wiz_subgroup_all')}
                            </button>
                            {group === 'I' && (
                              <>
                                <button
                                  onClick={() => setSubgroup('RK')}
                                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                    subgroup === 'RK'
                                      ? 'bg-cyan-600 text-white'
                                      : 'glass border border-white/10 text-gray-300 hover:border-white/20'
                                  }`}
                                >
                                  Riyaziyyat-Kimya (RK)
                                </button>
                                <button
                                  onClick={() => setSubgroup('RI')}
                                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                    subgroup === 'RI'
                                      ? 'bg-violet-600 text-white'
                                      : 'glass border border-white/10 text-gray-300 hover:border-white/20'
                                  }`}
                                >
                                  Riyaziyyat-İnformatika (Ri)
                                </button>
                              </>
                            )}
                            {group === 'III' && (
                              <>
                                <button
                                  onClick={() => setSubgroup('DT')}
                                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                    subgroup === 'DT'
                                      ? 'bg-amber-600 text-white'
                                      : 'glass border border-white/10 text-gray-300 hover:border-white/20'
                                  }`}
                                >
                                  Dil-tarix (DT)
                                </button>
                                <button
                                  onClick={() => setSubgroup('TC')}
                                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                    subgroup === 'TC'
                                      ? 'bg-emerald-600 text-white'
                                      : 'glass border border-white/10 text-gray-300 hover:border-white/20'
                                  }`}
                                >
                                  Tarix-coğrafiya (TC)
                                </button>
                              </>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            {group === 'I' && subgroup === 'RK' && '🧪 Kimya fənni ilə imtahan verdiyiniz üçün'}
                            {group === 'I' && subgroup === 'RI' && '💻 İnformatika fənni ilə imtahan verdiyiniz üçün'}
                            {group === 'III' && subgroup === 'DT' && '📖 Dil-tarix altqrupu seçdiyiniz üçün'}
                            {group === 'III' && subgroup === 'TC' && '🗺️ Tarix-coğrafiya altqrupu seçdiyiniz üçün'}
                            {subgroup === 'all' && 'Bütün altqruplar üzrə ixtisaslar göstəriləcək'}
                          </div>
                        </div>
                      )}

                      {/* Block < 100 checkbox */}
                      <div
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          lowBlock
                            ? 'bg-amber-500/15 border-amber-500/50'
                            : 'glass border-white/10 hover:border-amber-500/30'
                        }`}
                        onClick={() => setLowBlock(v => !v)}
                      >
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                          <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                            lowBlock ? 'bg-amber-500 border-amber-500' : 'border-gray-500'
                          }`}>
                            {lowBlock && <span className="text-white text-xs font-bold">✓</span>}
                          </div>
                          <div>
                            <div className={`font-semibold text-sm ${lowBlock ? 'text-amber-300' : 'text-gray-200'}`}>
                              {t('wiz_low_block_title')}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {t('wiz_low_block_desc')}
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 glass px-6 py-3 rounded-2xl text-gray-300 border border-white/10"
                >
                  <ChevronLeft size={18} /> {t('wiz_back')}
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={validateAndNext}
                  className={`flex items-center gap-2 text-white font-bold px-8 py-4 rounded-2xl ${isLowScore ? 'bg-gradient-to-r from-rose-600 to-pink-600' : 'bg-gradient-to-r from-blue-600 to-purple-600'}`}
                >
                  {t('wiz_next')} <ChevronRight size={18} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Filters */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
            >
              <div className="glass rounded-2xl p-8 border border-white/8 mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">{t('wiz_step3')}</h2>
                <p className="text-gray-400 mb-6">{t('wiz_step3_sub')}</p>

                {/* Payment filter */}
                <div className="mb-6">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-200 mb-3">
                    <CreditCard size={16} className="text-green-400" /> {t('wiz_payment_label')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { value: 'hər ikisi' as PaymentFilter, label: '🔄 Hamısı', desc: 'Pulsuz da, ödənişli də' },
                      { value: 'ödənişli' as PaymentFilter, label: '💰 Yalnız ödənişli', desc: 'Ödənişli yerlər' },
                      { value: 'pulsuz' as PaymentFilter, label: '🆓 Yalnız dövlət sifarişli', desc: 'Pulsuz dövlət yeri' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setPayFilter(opt.value)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          payFilter === opt.value
                            ? 'bg-green-600/20 border-green-500/60 text-green-300'
                            : 'glass border-white/10 text-gray-300 hover:border-white/20'
                        }`}
                      >
                        <div className="font-bold">{opt.label}</div>
                        <div className="text-xs text-gray-400 mt-1">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                  {payFilter === 'ödənişli' && (
                    <div className="mt-2 text-xs text-amber-400 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Həm pulsuz, həm ödənişli ixtisaslar sıralanacaq (ödəniş qiyməti hər ixtisas üçün fərqlidir)
                    </div>
                  )}
                </div>

                {/* Region filter */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-200 mb-3">
                    <MapPin size={16} className="text-blue-400" /> {t('wiz_region_label')}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(Object.keys(regionLabels) as RegionFilter[]).map(r => (
                      <button
                        key={r}
                        onClick={() => setRegionFilter(r)}
                        className={`p-3 rounded-xl border text-left text-sm transition-all ${
                          regionFilter === r
                            ? 'bg-blue-600/20 border-blue-500/60 text-blue-300'
                            : 'glass border-white/10 text-gray-300 hover:border-white/20'
                        }`}
                      >
                        {regionLabels[r]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {fetchError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle size={14} /> {fetchError}
                </div>
              )}
              <div className="flex justify-between gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 glass px-6 py-3 rounded-2xl text-gray-300 border border-white/10"
                >
                  <ChevronLeft size={18} /> {t('wiz_back')}
                </button>
                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  onClick={filterAndRankSpecialties}
                  disabled={loading}
                  className={`flex items-center gap-2 text-white font-bold px-8 py-4 rounded-2xl disabled:opacity-60 ${isLowScore ? 'bg-gradient-to-r from-rose-600 to-pink-600' : 'bg-gradient-to-r from-green-600 to-teal-600'}`}
                >
                  {loading
                    ? <><Loader2 size={18} className="animate-spin" /> {t('wiz_searching')}</>
                    : isLowScore
                      ? <><TrendingDown size={18} /> Münasib İxtisasları Göstər</>
                      : <><Star size={18} /> {t('wiz_show_results')}</>}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        {step === 4 && (
          <motion.div
            ref={resultRef}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="fade-in-up"
          >
            {/* Low score note */}
            {isLowScore && (
              <div className="glass rounded-2xl p-4 mb-4 border border-rose-500/20 bg-rose-500/5 flex items-center gap-3">
                <TrendingDown size={20} className="text-rose-400 shrink-0" />
                <div className="text-sm text-gray-300">
                  <span className="text-rose-300 font-semibold">100-dən aşağı bal rejimi:</span>{' '}
                  Aşağıda kollec, subbakalavr və aşağı bal tələb edən ixtisaslar sıralanır.
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="glass rounded-2xl p-5 mb-6 border border-white/8 flex flex-wrap gap-4 items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm">{t('wiz_total_score')}</div>
                <div className="text-3xl font-black gradient-text">{totalBal}</div>
              </div>
              <div className="flex gap-3 flex-wrap">
                <span className="badge badge-info">{levelLabels[level]}</span>
                {level === 'bakalavr' && <span className="badge badge-purple">{group} Qrup</span>}
                {level === 'bakalavr' && subgroup !== 'all' && (
                  <span className={`badge text-xs ${
                    subgroup === 'RK' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                    subgroup === 'RI' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' :
                    subgroup === 'DT' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>{subgroup}</span>
                )}
                {lowBlock && <span className="badge bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs">Blok &lt;100</span>}
                <span className="badge badge-success">{payFilter}</span>
                <span className="badge badge-info">{regionLabels[regionFilter]}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => exportToExcel(results)}
                  className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-xl text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/10 text-xs transition-colors">
                  <Download size={13} /> Excel
                </button>
                <button onClick={() => setShowComparison(true)}
                  className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-xl text-blue-300 border border-blue-500/30 hover:bg-blue-500/10 text-xs transition-colors">
                  <BarChart2 size={13} /> Müqayisə
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 glass px-3 py-1.5 rounded-xl border border-white/10"
                >
                  <ChevronLeft size={13} /> {t('wiz_research')}
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-4 text-xs">
              <span className="badge badge-success">✅ Pulsuz - Düşür</span>
              <span className="badge badge-warning">⚡ Pulsuz - Yaxın</span>
              <span className="badge" style={{ background: 'rgba(249,115,22,0.2)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.3)' }}>🔥 Əldə Edilə bilər (30-40 yuxarı)</span>
              <span className="badge badge-info">💰 Ödənişli - Düşür</span>
              <span className="badge badge-danger">❌ Çatmır</span>
            </div>

            {results.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center border border-white/8">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-white mb-2">Nəticə tapılmadı</h3>
                <p className="text-gray-400">Filtrlərinizi dəyişdirməyə cəhd edin</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto glass rounded-2xl border border-white/8">
                  <table className="dim-table">
                    <thead>
                      <tr>
                        <th className="w-8">#</th>
                        <th>İxtisas</th>
                        <th>Universitet</th>
                        <th>Region</th>
                        <th>Ödənişli Balı</th>
                        <th>Dövlət Yeri</th>
                        <th>Vəziyyət</th>
                        <th>{t('wiz_select_label')}</th>
                        <th>Əməl</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((spec, idx) => {
                        const status = getStatus(totalBal, spec, payFilter);
                        const isSelected = selectedList.includes(spec.id);
                        const diff = totalBal - (spec.bal_dovlet ?? spec.bal_odenis ?? 0);
                        const isAbove35 = diff < -10 && diff >= -40;
                        const fav = isFavorite(spec.id);
                        const cmp = isInComparison(spec.id);
                        return (
                          <motion.tr
                            key={spec.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className={`${isSelected ? 'bg-blue-500/10' : ''} ${isAbove35 ? 'border-l-2 border-orange-500' : ''}`}
                          >
                            <td className="text-gray-500 text-sm font-mono">{idx + 1}</td>
                            <td>
                              <div className="font-medium text-white text-sm">{spec.name}</div>
                              {isAbove35 && (
                                <span className="text-xs text-orange-400 font-medium">🔥 İlk sıralara yaz</span>
                              )}
                              {spec.applicants && (
                                <div className="text-xs text-amber-400 mt-0.5">
                                  🏆 {(spec.applicants / spec.plan).toFixed(1)} nəfər/yer
                                </div>
                              )}
                            </td>
                            <td className="text-sm text-gray-300">{spec.universityShort}</td>
                            <td className="text-xs text-gray-400">{spec.city}</td>
                            <td className="text-sm font-bold text-orange-300">{spec.bal_odenis ?? '—'}</td>
                            <td className="text-sm font-bold text-green-300">{spec.bal_dovlet ?? '—'}</td>
                            <td>
                              <span className={`badge text-xs ${status.badge}`}>
                                {status.label}
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => toggleSelect(spec.id)}
                                disabled={!isSelected && selectedList.length >= 15}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                  isSelected
                                    ? 'bg-blue-500 border-blue-500 text-white'
                                    : 'border-gray-600 hover:border-blue-400'
                                } disabled:opacity-30`}
                              >
                                {isSelected && <CheckCircle size={14} />}
                              </button>
                            </td>
                            <td>
                              <div className="flex items-center gap-1">
                                <button onClick={() => toggleFavorite(spec)} title={fav ? 'Favoritdən çıxar' : 'Favoritə əlavə et'}
                                  className={`p-1 rounded-lg transition-colors ${fav ? 'text-pink-400 bg-pink-500/10' : 'text-gray-600 hover:text-pink-400 hover:bg-pink-500/10'}`}>
                                  <Heart size={13} fill={fav ? 'currentColor' : 'none'} />
                                </button>
                                <button onClick={() => toggleComparison(spec)} title={cmp ? 'Müqayisədən çıxar' : 'Müqayisəyə əlavə et'}
                                  className={`p-1 rounded-lg transition-colors ${cmp ? 'text-blue-400 bg-blue-500/10' : 'text-gray-600 hover:text-blue-400 hover:bg-blue-500/10'}`}>
                                  <BarChart2 size={13} />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Selected list */}
                {selectedList.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 glass-strong rounded-2xl p-6 border border-blue-500/20"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                      <div className="flex items-center gap-3">
                        <Trophy size={20} className="text-amber-400" />
                        <h3 className="font-bold text-white text-lg">DİM Portala Yazacağınız Sıralama</h3>
                        <span className="badge badge-info">{selectedList.length}/15 ixtisas</span>
                      </div>
                      <button
                        onClick={downloadPDF}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all hover:shadow-lg shadow-blue-500/25 cursor-pointer self-start sm:self-auto border-0"
                      >
                        <Download size={16} /> {t('wiz_pdf_download')}
                      </button>
                    </div>
                    <Reorder.Group 
                      axis="y" 
                      values={selectedList} 
                      onReorder={handleReorder}
                      className="space-y-3"
                    >
                      {selectedList.map((id, i) => {
                        const spec = results.find(r => r.id === id);
                        if (!spec) return null;
                        const status = getStatus(totalBal, spec, payFilter);
                        return (
                          <Reorder.Item
                            key={id}
                            value={id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 glass rounded-xl p-3 border border-white/5 cursor-grab active:cursor-grabbing hover:border-blue-500/30 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="text-gray-500 hover:text-white transition-colors cursor-grab">
                                <GripVertical size={16} />
                              </div>
                              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {i + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-white text-sm font-medium truncate">{spec.name}</div>
                                <div className="text-gray-400 text-xs flex items-center gap-2">
                                  {spec.universityShort}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`badge text-xs ${status.badge} shrink-0 hidden sm:inline-block`}>{status.label}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSelect(id);
                                }}
                                className="text-gray-500 hover:text-red-400 transition-colors shrink-0 p-1"
                              >
                                ×
                              </button>
                            </div>
                          </Reorder.Item>
                        );
                      })}
                    </Reorder.Group>
                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                      💡 DİM portalında (ekabinet.dim.gov.az) ixtisasları yuxarıdakı sıraya uyğun daxil edin.
                      Ən yüksək ehtimallı ixtisaslar yuxarıda, arzuolunan amma çətin olan ixtisaslar aşağıda olmalıdır.
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
