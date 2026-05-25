import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Heart, BarChart2, Download, Loader2 } from 'lucide-react';
import { fetchSpecialties } from '../lib/api';
import { Specialty } from '../data/specialties';
import { useFavorites } from '../context/FavoritesContext';
import { useComparison } from '../context/ComparisonContext';
import { useLang } from '../context/LanguageContext';
import { exportToExcel, exportToPDF } from '../utils/export';

const LEVELS = [
  { value: '', label: 'Hamısı' },
  { value: 'bakalavr', label: 'Bakalavr' },
  { value: 'magistr', label: 'Magistr' },
  { value: 'rezidentura', label: 'Rezidentura' },
  { value: 'kollec_9', label: 'Kollec (9-illik)' },
  { value: 'kollec_11', label: 'Kollec (11-illik)' },
  { value: 'subbakalavr', label: 'Subbakalavr' },
];

const groupColors: Record<string, string> = {
  I: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  II: 'bg-green-500/20 text-green-300 border-green-500/30',
  III: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  IV: 'bg-red-500/20 text-red-300 border-red-500/30',
  V: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

function SpecRow({ spec }: { spec: Specialty }) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { toggleComparison, isInComparison } = useComparison();
  const fav = isFavorite(spec.id);
  const cmp = isInComparison(spec.id);

  return (
    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <td>
        <div className="text-white text-sm font-medium">{spec.name}</div>
        {spec.isSpecial && (
          <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md mt-0.5 inline-block border border-amber-500/20">★ Xüsusi</span>
        )}
      </td>
      <td className="text-xs text-gray-300">{spec.universityShort || spec.universityName}</td>
      <td>
        {spec.group && <span className={`badge border text-xs ${groupColors[spec.group] || ''}`}>{spec.group}</span>}
      </td>
      <td className="font-bold text-orange-300">{spec.bal_odenis ?? '—'}</td>
      <td className="font-bold text-green-300">{spec.bal_dovlet ?? '—'}</td>
      <td className="text-gray-400 text-xs">{spec.plan}</td>
      {spec.applicants && (
        <td className="text-xs text-amber-300">{(spec.applicants / spec.plan).toFixed(1)}x</td>
      )}
      <td>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => toggleFavorite(spec)}
            className={`p-1.5 rounded-lg transition-colors ${fav ? 'text-pink-400 bg-pink-500/10' : 'text-gray-500 hover:text-pink-400 hover:bg-pink-500/10'}`}
            title={fav ? 'Favoritdən çıxar' : 'Favoritə əlavə et'}
          >
            <Heart size={14} fill={fav ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => toggleComparison(spec)}
            className={`p-1.5 rounded-lg transition-colors ${cmp ? 'text-blue-400 bg-blue-500/10' : 'text-gray-500 hover:text-blue-400 hover:bg-blue-500/10'}`}
            title={cmp ? 'Müqayisədən çıxar' : 'Müqayisəyə əlavə et'}
          >
            <BarChart2 size={14} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

export default function GlobalSearchPage() {
  const { t } = useLang();
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('');
  const [results, setResults] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { setShowModal } = useComparison();

  // hasHistory removed - old fields no longer in schema

  const doSearch = useCallback(async (q: string, lvl: string) => {
    if (!q.trim() && !lvl) { setResults([]); setHasSearched(false); return; }
    setLoading(true);
    setHasSearched(true);
    try {
      const levels = lvl ? [lvl] : ['bakalavr', 'magistr', 'rezidentura', 'kollec_9', 'kollec_11', 'subbakalavr'];
      const all = await Promise.all(
        levels.map(l => fetchSpecialties({ level: l, search: q.trim() || undefined }))
      );
      setResults(all.flat().slice(0, 200));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => doSearch(query, level), 400);
    return () => clearTimeout(timer);
  }, [query, level, doSearch]);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 relative">
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />

      <div className="max-w-7xl mx-auto relative">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Search size={16} />
            {t('search_title')}
          </div>
          <h1 className="text-4xl font-black text-white mb-3">{t('search_title')}</h1>
          <p className="text-gray-400">Bütün səviyyələrdə ixtisas, kod, universitet adı ilə axtarış</p>
        </motion.div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder={t('search_placeholder')}
              className="dim-input pl-10"
              autoFocus
            />
          </div>
          <div className="relative">
            <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={level} onChange={e => setLevel(e.target.value)}
              className="dim-input pl-9 appearance-none min-w-44 cursor-pointer"
            >
              {LEVELS.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 gap-3">
            <Loader2 size={24} className="animate-spin" />
            Axtarılır...
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="text-center py-20">
            <Search size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">{t('search_no_results')}</p>
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-400">{results.length} nəticə tapıldı</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-xl text-blue-300 border border-blue-500/30 hover:bg-blue-500/10 transition-colors text-xs"
                >
                  <BarChart2 size={14} /> Müqayisə
                </button>
                <button
                  onClick={() => exportToExcel(results)}
                  className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-xl text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors text-xs"
                >
                  <Download size={14} /> Excel
                </button>
                <button
                  onClick={() => exportToPDF(results)}
                  className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-xl text-red-300 border border-red-500/30 hover:bg-red-500/10 transition-colors text-xs"
                >
                  <Download size={14} /> PDF
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="dim-table">
                <thead>
                  <tr>
                    <th>İxtisas</th>
                    <th>Universitet</th>
                    <th>Qrup</th>
                    <th>💰 Ödənişli Bal</th>
                    <th>🆓 Dövlət Balı</th>
                    <th>Plan</th>
                    {results.some(s => s.applicants) && <th>Rəq.</th>}
                    <th>Əməl</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {results.map(spec => (
                      <SpecRow key={spec.id} spec={spec} />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            {results.length >= 200 && (
              <p className="text-xs text-gray-500 text-center mt-3">İlk 200 nəticə göstərilir. Daha dəqiq axtarış üçün filtrdən istifadə edin.</p>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <Search size={48} className="text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">Axtarış üçün yuxarıdakı sahəyə mətn daxil edin</p>
          </div>
        )}
      </div>
    </div>
  );
}
