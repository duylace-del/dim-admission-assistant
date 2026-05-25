import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, ChevronDown, Info, RotateCcw } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { fetchCalculatorConfig, CalcTypeConfig } from '../lib/api';

type CalcType = 'attestat9' | 'attestat11' | 'blok1rk' | 'blok1ri' | 'blok2' | 'blok3dt' | 'blok3tc' | 'blok4' | 'magistr' | 'rezidentura' | 'kollec' | 'subbakalavr';

interface SubjectInput {
  key: string;
  label: string;
  coefficient: number;
  maxQ: number; // qapalı sual sayı
  maxKod?: number; // kodlaşdırıla bilən açıq sual sayı
  maxYazili?: number; // yazılı açıq sual sayı
  color: string;
}

const calcTypes: { value: CalcType; label: string; desc: string }[] = [
  { value: 'attestat9', label: '9-cu sinif Attestat', desc: 'Buraxılış imtahanı (I mərhələ, 9-illik)' },
  { value: 'attestat11', label: '11-ci sinif Attestat', desc: 'Buraxılış imtahanı (I mərhələ, max 300 bal)' },
  { value: 'blok1rk', label: 'I Qrup Blok — RK (Riyaziyyat+Kimya)', desc: 'Riyaziyyat×1.5, Fizika×1.5, Kimya×1' },
  { value: 'blok1ri', label: 'I Qrup Blok — Ri (Riyaziyyat+İnformatika)', desc: 'Riyaziyyat×1.5, Fizika×1.5, İnformatika×1' },
  { value: 'blok2', label: 'II Qrup Blok', desc: 'Riyaziyyat×1.5, Coğrafiya×1.5, Tarix×1' },
  { value: 'blok3dt', label: 'III Qrup Blok — DT', desc: 'Az.dili×1.5, Tarix×1.5, Ədəbiyyat×1' },
  { value: 'blok3tc', label: 'III Qrup Blok — TC', desc: 'Az.dili×1.5, Tarix×1.5, Coğrafiya×1' },
  { value: 'blok4', label: 'IV Qrup Blok', desc: 'Biologiya×1.5, Kimya×1.5, Fizika×1' },
  { value: 'magistr', label: 'Magistratura', desc: 'Məntiq(50)+İnformatika(25)+Xarici dil(20)+Esse(5) = max 100 bal' },
  { value: 'rezidentura', label: 'Rezidentura', desc: 'I mərhələ (Baza, max 100) + II mərhələ (İxtisas, max 100)' },
  { value: 'kollec', label: 'Kollec (11-illik baza)', desc: 'Az.dili imtahanı, max 30 sual' },
  { value: 'subbakalavr', label: 'Subbakalavr', desc: 'Buraxılış imtahanı nəticəsi ilə' },
];

function getSubjects(type: CalcType): SubjectInput[] {
  switch (type) {
    case 'attestat9':
      return [
        { key: 'azDili', label: 'Azərbaycan dili', coefficient: 1, maxQ: 30, maxKod: 0, maxYazili: 3, color: 'blue' },
        { key: 'riyaz', label: 'Riyaziyyat', coefficient: 1, maxQ: 25, maxKod: 8, maxYazili: 4, color: 'purple' },
      ];
    case 'attestat11':
      return [
        { key: 'azDili', label: 'Azərbaycan dili', coefficient: 1, maxQ: 30, maxKod: 0, maxYazili: 3, color: 'blue' },
        { key: 'riyaz', label: 'Riyaziyyat', coefficient: 1, maxQ: 25, maxKod: 8, maxYazili: 4, color: 'purple' },
        { key: 'xariciDil', label: 'Xarici dil', coefficient: 1, maxQ: 30, maxKod: 0, maxYazili: 3, color: 'green' },
      ];
    case 'blok1rk':
      return [
        { key: 'riyaz', label: 'Riyaziyyat', coefficient: 1.5, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'blue' },
        { key: 'fizika', label: 'Fizika', coefficient: 1.5, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'purple' },
        { key: 'kimya', label: 'Kimya', coefficient: 1, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'green' },
      ];
    case 'blok1ri':
      return [
        { key: 'riyaz', label: 'Riyaziyyat', coefficient: 1.5, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'blue' },
        { key: 'fizika', label: 'Fizika', coefficient: 1.5, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'purple' },
        { key: 'informatika', label: 'İnformatika', coefficient: 1, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'cyan' },
      ];
    case 'blok2':
      return [
        { key: 'riyaz', label: 'Riyaziyyat', coefficient: 1.5, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'blue' },
        { key: 'cografiya', label: 'Coğrafiya', coefficient: 1.5, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'green' },
        { key: 'tarix', label: 'Tarix', coefficient: 1, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'amber' },
      ];
    case 'blok3dt':
      return [
        { key: 'azDili', label: 'Azərbaycan dili', coefficient: 1.5, maxQ: 22, maxKod: 0, maxYazili: 3, color: 'blue' },
        { key: 'tarix', label: 'Tarix', coefficient: 1.5, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'amber' },
        { key: 'edebiyyat', label: 'Ədəbiyyat', coefficient: 1, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'purple' },
      ];
    case 'blok3tc':
      return [
        { key: 'azDili', label: 'Azərbaycan dili', coefficient: 1.5, maxQ: 22, maxKod: 0, maxYazili: 3, color: 'blue' },
        { key: 'tarix', label: 'Tarix', coefficient: 1.5, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'amber' },
        { key: 'cografiya', label: 'Coğrafiya', coefficient: 1, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'green' },
      ];
    case 'blok4':
      return [
        { key: 'bio', label: 'Biologiya', coefficient: 1.5, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'green' },
        { key: 'kimya', label: 'Kimya', coefficient: 1.5, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'purple' },
        { key: 'fizika', label: 'Fizika', coefficient: 1, maxQ: 22, maxKod: 5, maxYazili: 3, color: 'blue' },
      ];
    case 'magistr':
      return [
        { key: 'mentiq', label: 'Məntiqi təfəkkür', coefficient: 1, maxQ: 45, maxKod: 0, maxYazili: 5, color: 'blue' },
        { key: 'informatika', label: 'İnformatika', coefficient: 1, maxQ: 20, maxKod: 0, maxYazili: 5, color: 'purple' },
        { key: 'xariciDil', label: 'Xarici dil', coefficient: 1, maxQ: 18, maxKod: 0, maxYazili: 2, color: 'green' },
      ];
    case 'rezidentura':
      return [
        { key: 'baza', label: 'I Mərhələ (Baza fənnləri)', coefficient: 1, maxQ: 100, color: 'blue' },
        { key: 'ixtisas', label: 'II Mərhələ (İxtisas fənnləri)', coefficient: 1, maxQ: 100, color: 'purple' },
      ];
    case 'kollec':
      return [
        { key: 'azDili', label: 'Azərbaycan dili', coefficient: 1, maxQ: 27, maxKod: 0, maxYazili: 3, color: 'blue' },
      ];
    case 'subbakalavr':
      return [
        { key: 'azDili', label: 'Azərbaycan dili', coefficient: 1, maxQ: 30, maxKod: 0, maxYazili: 3, color: 'blue' },
        { key: 'riyaz', label: 'Riyaziyyat', coefficient: 1, maxQ: 25, maxKod: 8, maxYazili: 4, color: 'purple' },
      ];
    default:
      return [];
  }
}

const colorMap: Record<string, { border: string; bg: string; text: string }> = {
  blue: { border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  purple: { border: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400' },
  green: { border: 'border-green-500', bg: 'bg-green-500/10', text: 'text-green-400' },
  cyan: { border: 'border-cyan-500', bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  amber: { border: 'border-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-400' },
};

interface SubjectState {
  dogru: string;
  sehv: string;
  bos: string;
  kodDogru?: string;
  yaziliDogru?: string;
}



// Simplified but realistic calculation for blok (max 400)
function calcBlokScore(subjects: SubjectInput[], states: Record<string, SubjectState>): number {
  let total = 0;
  let maxPossible = 0;
  subjects.forEach(subj => {
    const dq = Number(states[subj.key]?.dogru) || 0;
    const yq = Number(states[subj.key]?.sehv) || 0;
    const dkod = Number(states[subj.key]?.kodDogru) || 0;
    const dyazili = Number(states[subj.key]?.yaziliDogru) || 0;

    // Nisbi bal qapalı: [Dq - Yq/4] / maxQ  (max = 1.0)
    const nbq = Math.max(0, (dq - yq / 4)) / subj.maxQ;
    // Nisbi bal açıq:
    const maxAciqBal = (subj.maxKod || 0) + 2 * (subj.maxYazili || 0);
    const nba = maxAciqBal > 0 ? Math.min(1, (dkod + 2 * dyazili) / maxAciqBal) : 0;

    // Combined NB (0 to 1) - nbq and nba used for reference
    void nbq; void nba;
    // Simplified: NB = (Dq - Yq/4) * (100/maxQ) gives up to 100, then multiply coefficient
    const rawScore = Math.max(0, (dq - yq / 4)) * (100 / subj.maxQ);
    const aciqBonus = maxAciqBal > 0 ? ((dkod + 2 * dyazili) / maxAciqBal) * (subj.maxKod || 0) * 2 : 0;
    const subjScore = (rawScore + aciqBonus) * subj.coefficient;
    total += subjScore;
    maxPossible += 100 * subj.coefficient + (subj.maxKod || 0) * subj.coefficient * 2;
  });

  // Normalize to max 400
  const normalized = (total / maxPossible) * 400;
  return parseFloat(Math.min(400, Math.max(0, normalized)).toFixed(1));
}

function calcAttestatScore(subjects: SubjectInput[], states: Record<string, SubjectState>): number {
  let total = 0;
  subjects.forEach(subj => {
    const dq = Number(states[subj.key]?.dogru) || 0;
    const yq = Number(states[subj.key]?.sehv) || 0;
    const dkod = Number(states[subj.key]?.kodDogru) || 0;
    const dyazili = Number(states[subj.key]?.yaziliDogru) || 0;

    const rawScore = Math.max(0, (dq - yq / 4)) * (100 / subj.maxQ);
    const maxAciqBal = (subj.maxKod || 0) + 2 * (subj.maxYazili || 0);
    const aciqBonus = maxAciqBal > 0 ? ((dkod + 2 * dyazili) / maxAciqBal) * 20 : 0;
    total += rawScore + aciqBonus;
  });

  const perSubject = 100;
  const maxTotal = subjects.length * perSubject;
  const normalized = (total / maxTotal) * 300;
  return parseFloat(Math.min(300, Math.max(0, normalized)).toFixed(1));
}

function calcMagistrScore(states: Record<string, SubjectState>, esse: string): number {
  const mentiqD = Number(states['mentiq']?.dogru) || 0;
  const mentiqY = Number(states['mentiq']?.sehv) || 0;
  const infoD = Number(states['informatika']?.dogru) || 0;
  const infoY = Number(states['informatika']?.sehv) || 0;
  const xariciD = Number(states['xariciDil']?.dogru) || 0;
  const xariciY = Number(states['xariciDil']?.sehv) || 0;
  const esseBal = Math.min(5, Number(esse) || 0);

  const mentiqBal = Math.max(0, mentiqD - mentiqY / 4);
  const infoBal = Math.max(0, infoD - infoY / 4);
  const xariciBal = Math.max(0, xariciD - xariciY / 4);

  return parseFloat(Math.min(100, mentiqBal + infoBal + xariciBal + esseBal).toFixed(1));
}

function calcRezidenturaScore(states: Record<string, SubjectState>): number {
  const bazaD = Number(states['baza']?.dogru) || 0;
  const bazaY = Number(states['baza']?.sehv) || 0;
  const ixtisasD = Number(states['ixtisas']?.dogru) || 0;
  const ixtisasY = Number(states['ixtisas']?.sehv) || 0;

  const bazaBal = Math.max(0, bazaD - bazaY / 4);
  const ixtisasBal = Math.max(0, ixtisasD - ixtisasY / 4);

  return parseFloat(Math.min(200, bazaBal + ixtisasBal).toFixed(1));
}

function calcKollecScore(states: Record<string, SubjectState>): number {
  const dq = Number(states['azDili']?.dogru) || 0;
  const yq = Number(states['azDili']?.sehv) || 0;
  const dyazili = Number(states['azDili']?.yaziliDogru) || 0;
  return parseFloat(Math.min(30, Math.max(0, dq - yq / 4 + dyazili)).toFixed(1));
}

export default function ScoreCalculator() {
  const { t } = useLang();
  const [calcType, setCalcType] = useState<CalcType>('attestat11');
  const [subjectStates, setSubjectStates] = useState<Record<string, SubjectState>>({});
  const [esse, setEsse] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [apiConfig, setApiConfig] = useState<CalcTypeConfig[] | null>(null);

  useEffect(() => {
    fetchCalculatorConfig()
      .then(cfg => setApiConfig(cfg))
      .catch(() => {}); // fallback to hardcoded
  }, []);

  // Use API config if available, otherwise fall back to hardcoded
  const activeCalcTypes = apiConfig
    ? apiConfig.map(c => ({ value: c.value as CalcType, label: c.label, desc: c.desc }))
    : calcTypes;

  const subjects = apiConfig
    ? (apiConfig.find(c => c.value === calcType)?.subjects || getSubjects(calcType))
    : getSubjects(calcType);

  const selected = activeCalcTypes.find(c => c.value === calcType) || activeCalcTypes[0];

  const isAttestat = calcType === 'attestat9' || calcType === 'attestat11' || calcType === 'subbakalavr';
  const isBlok = calcType.startsWith('blok');
  const isMagistr = calcType === 'magistr';
  const isRezidentura = calcType === 'rezidentura';
  const isKollec = calcType === 'kollec';

  const handleInput = (key: string, field: keyof SubjectState, value: string) => {
    setSubjectStates(prev => ({
      ...prev,
      [key]: { ...(prev[key] || { dogru: '', sehv: '', bos: '' }), [field]: value },
    }));
    setScore(null);
  };

  const handleCalculate = () => {
    if (isMagistr) {
      setScore(calcMagistrScore(subjectStates, esse));
    } else if (isRezidentura) {
      setScore(calcRezidenturaScore(subjectStates));
    } else if (isKollec) {
      setScore(calcKollecScore(subjectStates));
    } else if (isAttestat) {
      setScore(calcAttestatScore(subjects, subjectStates));
    } else if (isBlok) {
      setScore(calcBlokScore(subjects, subjectStates));
    }
  };

  const handleReset = () => {
    setSubjectStates({});
    setEsse('');
    setScore(null);
  };

  const maxScore = apiConfig
    ? (apiConfig.find(c => c.value === calcType)?.maxScore ?? (isAttestat ? 300 : isBlok ? 400 : isMagistr ? 100 : isRezidentura ? 200 : 30))
    : (isAttestat ? 300 : isBlok ? 400 : isMagistr ? 100 : isRezidentura ? 200 : 30);
  const scorePercent = score !== null ? (score / maxScore) * 100 : 0;
  const scoreColor = scorePercent >= 70 ? 'text-green-400' : scorePercent >= 40 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />

      <div className="max-w-4xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-purple-600/20 border border-purple-500/30 px-4 py-2 rounded-full text-sm font-medium text-purple-300 mb-4">
            <Calculator size={16} />
            {t('calc_badge')}
          </div>
          <h1 className="text-4xl font-black text-white mb-3">{t('calc_title')}</h1>
          <p className="text-gray-400">{t('calc_subtitle')}</p>
        </motion.div>

        {/* Type Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-5 mb-6 border border-white/8"
        >
          <label className="block text-sm font-semibold text-gray-300 mb-3">{t('calc_select_type')}</label>
          <div className="relative">
            <select
              value={calcType}
              onChange={e => { setCalcType(e.target.value as CalcType); handleReset(); }}
              className="dim-input pr-10 appearance-none cursor-pointer font-medium"
            >
              {activeCalcTypes.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <p className="text-sm text-gray-400 mt-2 flex items-center gap-1">
            <Info size={14} className="text-blue-400" />
            {selected.desc}
          </p>
        </motion.div>

        {/* Formula Info */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass rounded-2xl p-5 mb-6 border border-blue-500/20 bg-blue-500/5"
            >
              <h4 className="font-bold text-blue-300 mb-3">{t('calc_formula_title')}</h4>
              {isAttestat && (
                <div className="text-sm text-gray-300 space-y-2">
                  <p><strong className="text-white">Qapalı suallar:</strong> NBq = (Düzgün − Yanlış÷4) ÷ Sual_sayı</p>
                  <p><strong className="text-white">Açıq suallar:</strong> NBa = Dkod + 2×Dyazılı</p>
                  <p><strong className="text-white">Fənn balı:</strong> NB = NBq + NBa (normallaşdırılır)</p>
                  <p><strong className="text-white">Ümumi:</strong> 3 fənn × 100 bal = max 300 bal</p>
                </div>
              )}
              {isBlok && (
                <div className="text-sm text-gray-300 space-y-2">
                  <p><strong className="text-white">Qapalı suallar:</strong> NBq = (Düzgün − Yanlış÷4) ÷ 22 sual</p>
                  <p><strong className="text-white">Açıq suallar:</strong> NBa = (Dkod + 2×Dyazılı)</p>
                  <p><strong className="text-white">Fənn NB:</strong> NBq + NBa (0-100 arasında)</p>
                  <p><strong className="text-white">Çəki əmsalı:</strong> ×1.5 (əsas fənnlər), ×1 (köməkçi fənn)</p>
                  <p><strong className="text-white">Ümumi:</strong> max 400 bal</p>
                </div>
              )}
              {isMagistr && (
                <div className="text-sm text-gray-300 space-y-2">
                  <p><strong className="text-white">Məntiqi təfəkkür:</strong> max 50 bal (45 qapalı + 5 yazılı)</p>
                  <p><strong className="text-white">İnformatika:</strong> max 25 bal (20 qapalı + 5 yazılı)</p>
                  <p><strong className="text-white">Xarici dil:</strong> max 20 bal (18 qapalı + 2 yazılı)</p>
                  <p><strong className="text-white">Esse:</strong> max 5 bal (markerlər tərəfindən qiymətləndirilir)</p>
                  <p><strong className="text-white">Ümumi:</strong> max 100 bal. Keçid: ≥50 bal</p>
                </div>
              )}
              {isKollec && (
                <div className="text-sm text-gray-300 space-y-2">
                  <p><strong className="text-white">Az.dili:</strong> 27 qapalı + 3 yazılı = max 30 bal</p>
                  <p><strong className="text-white">Qapalı:</strong> hər düzgün = 1 bal, yanlış bal çıxmır</p>
                  <p><strong className="text-white">Keçid:</strong> ≥15 bal (məqbul)</p>
                </div>
              )}
              {isRezidentura && (
                <div className="text-sm text-gray-300 space-y-2">
                  <p><strong className="text-white">I Mərhələ:</strong> 100 qapalı sual (hər 4 səhv 1 düzü aparır)</p>
                  <p><strong className="text-white">II Mərhələ:</strong> 100 qapalı sual (hər 4 səhv 1 düzü aparır)</p>
                  <p><strong className="text-white">Ümumi:</strong> max 200 bal</p>
                  <p><strong className="text-white">Keçid:</strong> I mərhələ ≥40, II mərhələ ≥50</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setShowInfo(!showInfo)}
          className="mb-6 text-sm text-blue-400 flex items-center gap-1 hover:text-blue-300 transition-colors"
        >
          <Info size={14} />
          {showInfo ? t('calc_hide_formula') : t('calc_show_formula')}
        </button>

        {/* Subject Inputs */}
        <div className="space-y-4 mb-6">
          {subjects.map((subj, i) => {
            const state = subjectStates[subj.key] || {};
            const colors = colorMap[subj.color] || colorMap.blue;
            const dogru = Number(state.dogru) || 0;
            const sehv = Number(state.sehv) || 0;
            const bos = Math.max(0, subj.maxQ - dogru - sehv);

            return (
              <motion.div
                key={subj.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`glass rounded-2xl p-5 border ${colors.border} border-opacity-30`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-8 rounded-full ${colors.bg} border ${colors.border}`} />
                    <div>
                      <h3 className={`font-bold ${colors.text}`}>{subj.label}</h3>
                      <p className="text-xs text-gray-400">
                        Əmsal: ×{subj.coefficient} | Qapalı: {subj.maxQ} sual
                        {(subj.maxKod || 0) > 0 && ` | Kodlaşdırılan: ${subj.maxKod}`}
                        {(subj.maxYazili || 0) > 0 && ` | Yazılı: ${subj.maxYazili}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  {/* Dogru */}
                  <div>
                    <label className="block text-xs font-semibold text-green-400 mb-1.5">{t('calc_correct')}</label>
                    <input
                      type="number"
                      min="0"
                      max={subj.maxQ}
                      value={state.dogru || ''}
                      onChange={e => handleInput(subj.key, 'dogru', e.target.value)}
                      placeholder={`0-${subj.maxQ}`}
                      className="dim-input q-correct text-center font-bold"
                    />
                  </div>
                  {/* Sehv */}
                  <div>
                    <label className="block text-xs font-semibold text-red-400 mb-1.5">{t('calc_wrong')}</label>
                    <input
                      type="number"
                      min="0"
                      max={subj.maxQ}
                      value={state.sehv || ''}
                      onChange={e => handleInput(subj.key, 'sehv', e.target.value)}
                      placeholder="0"
                      className="dim-input q-wrong text-center font-bold"
                    />
                  </div>
                  {/* Bos */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">{t('calc_empty')}</label>
                    <input
                      type="number"
                      readOnly
                      value={bos}
                      className="dim-input q-empty text-center font-bold"
                    />
                  </div>
                </div>

                {/* Open questions row */}
                {((subj.maxKod || 0) > 0 || (subj.maxYazili || 0) > 0) && (
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
                    {(subj.maxKod || 0) > 0 && (
                      <div>
                        <label className="block text-xs font-semibold text-amber-400 mb-1.5">
                          🔢 Kodlaşdırılan açıq (0-{subj.maxKod})
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={subj.maxKod}
                          value={state.kodDogru || ''}
                          onChange={e => handleInput(subj.key, 'kodDogru', e.target.value)}
                          placeholder="0"
                          className="dim-input text-center"
                          style={{ borderColor: '#f59e0b' }}
                        />
                      </div>
                    )}
                    {(subj.maxYazili || 0) > 0 && (
                      <div>
                        <label className="block text-xs font-semibold text-blue-300 mb-1.5">
                          ✍️ Yazılı açıq (0-{subj.maxYazili})
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={subj.maxYazili}
                          value={state.yaziliDogru || ''}
                          onChange={e => handleInput(subj.key, 'yaziliDogru', e.target.value)}
                          placeholder="0"
                          className="dim-input text-center"
                          style={{ borderColor: '#93c5fd' }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}

          {/* Esse for Magistr */}
          {isMagistr && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass rounded-2xl p-5 border border-yellow-500/30"
            >
              <label className="block text-sm font-bold text-yellow-400 mb-3">
                ✍️ Esse Balı (0-5, markerlər tərəfindən qiymətləndirilir)
              </label>
              <input
                type="number"
                min="0"
                max="5"
                value={esse}
                onChange={e => setEsse(e.target.value)}
                placeholder="0-5"
                className="dim-input text-center font-bold w-32"
                style={{ borderColor: '#eab308' }}
              />
            </motion.div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCalculate}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
          >
            <Calculator size={20} />
            {t('calc_calculate_btn')}
          </motion.button>
          <button
            onClick={handleReset}
            className="glass px-5 py-4 rounded-2xl text-gray-300 hover:text-white transition-colors border border-white/10 flex items-center gap-2"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Result */}
        <AnimatePresence>
          {score !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-strong rounded-3xl p-8 text-center border border-white/10 score-animate"
            >
              <p className="text-gray-400 text-sm mb-2 font-medium uppercase tracking-wider">{t('calc_total')}</p>
              <div className={`text-7xl font-black mb-2 ${scoreColor}`}>{score}</div>
              <div className="text-gray-400 text-sm mb-6">{t('calc_max')}: {maxScore} bal</div>

              {/* Progress bar */}
              <div className="w-full bg-white/5 rounded-full h-3 mb-4 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${scorePercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${scorePercent >= 70 ? 'bg-green-400' : scorePercent >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                />
              </div>
              <p className="text-sm text-gray-400">{scorePercent.toFixed(1)}% (maks. {maxScore} baldan)</p>

              {isMagistr && (
                <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm ${score >= 50 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                  {score >= 50 ? '✅ Keçid balını ödəyir (≥50)' : '❌ Keçid balı ödənmir (<50)'}
                </div>
              )}
              {isKollec && (
                <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm ${score >= 15 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                  {score >= 15 ? '✅ Məqbul (≥15)' : '❌ Məqbul deyil (<15)'}
                </div>
              )}
              {isRezidentura && (
                <div className="mt-4 flex flex-col gap-2">
                  <div className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm ${ (Number(subjectStates['baza']?.dogru) || 0) >= 40 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                    I Mərhələ: {(Number(subjectStates['baza']?.dogru) || 0) >= 40 ? '✅ Məqbul (≥40)' : '❌ Qeyri-məqbul (<40)'}
                  </div>
                  <div className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm ${ (Number(subjectStates['ixtisas']?.dogru) || 0) >= 50 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                    II Mərhələ: {(Number(subjectStates['ixtisas']?.dogru) || 0) >= 50 ? '✅ Məqbul (≥50)' : '❌ Qeyri-məqbul (<50)'}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500 mt-4">{t('calc_disclaimer')}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
