import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Trash2, Download, BarChart2, BookOpen } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useComparison } from '../context/ComparisonContext';
import { useLang } from '../context/LanguageContext';
import { exportToExcel, exportToPDF } from '../utils/export';
import { Specialty } from '../data/specialties';

const levelLabel: Record<string, string> = {
  bakalavr: 'Bakalavr', magistr: 'Magistr', rezidentura: 'Rezidentura',
  kollec_9: 'Kollec (9)', kollec_11: 'Kollec (11)', subbakalavr: 'Subbakalavr',
};

const groupColors: Record<string, string> = {
  I:   'bg-blue-500/20 text-blue-300 border-blue-500/30',
  II:  'bg-green-500/20 text-green-300 border-green-500/30',
  III: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  IV:  'bg-red-500/20 text-red-300 border-red-500/30',
  V:   'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

function FavoriteCard({ spec }: { spec: Specialty }) {
  const { toggleFavorite } = useFavorites();
  const { toggleComparison, isInComparison } = useComparison();
  const { t } = useLang();
  const inCmp = isInComparison(spec.id);

  return (
    <motion.div
      layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      className="glass rounded-2xl p-4 border border-white/8 hover:border-pink-500/30 transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-sm leading-snug">{spec.name}</div>
          <div className="text-xs text-gray-400 mt-0.5 truncate">{spec.universityName}</div>
        </div>
        <button onClick={() => toggleFavorite(spec)} className="shrink-0 p-1.5 rounded-xl hover:bg-red-500/20 text-pink-400 hover:text-red-400 transition-colors" title={t('favorites_remove')}>
          <Heart size={16} fill="currentColor" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="badge bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs">{levelLabel[spec.level] || spec.level}</span>
        {spec.group && <span className={`badge border text-xs ${groupColors[spec.group] || ''}`}>{spec.group} Qrup</span>}
        <span className="badge bg-white/10 text-gray-300 border border-white/20 text-xs">{spec.language || 'AZ'}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="glass rounded-xl p-2 text-center">
          <div className="text-xs text-gray-400">💰 Ödənişli</div>
          <div className="font-bold text-orange-300 text-sm">{spec.bal_odenis ?? '—'}</div>
        </div>
        <div className="glass rounded-xl p-2 text-center">
          <div className="text-xs text-gray-400">🆓 Dövlət</div>
          <div className="font-bold text-emerald-300 text-sm">{spec.bal_dovlet ?? '—'}</div>
        </div>
        <div className="glass rounded-xl p-2 text-center">
          <div className="text-xs text-gray-400">Plan</div>
          <div className="font-bold text-white text-sm">{spec.plan}</div>
        </div>
      </div>

      <button
        onClick={() => toggleComparison(spec)}
        className={`w-full flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-xl border transition-all ${
          inCmp
            ? 'bg-blue-500/20 border-blue-500/30 text-blue-300'
            : 'glass border-white/10 text-gray-400 hover:text-white hover:border-blue-500/30'
        }`}
      >
        <BarChart2 size={13} />
        {inCmp ? t('compare_remove') : t('compare_add')}
      </button>
    </motion.div>
  );
}

export default function FavoritesPage() {
  const { favorites, clearFavorites } = useFavorites();
  const { t } = useLang();
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 relative">
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />

      <div className="max-w-6xl mx-auto relative">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-pink-600/20 border border-pink-500/30 text-pink-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Heart size={16} fill="currentColor" />
            {t('favorites_title')}
          </div>
          <h1 className="text-4xl font-black text-white mb-3">{t('favorites_title')}</h1>
          <p className="text-gray-400">Saxladığınız ixtisasların siyahısı</p>
        </motion.div>

        {favorites.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6 justify-end">
            <button
              onClick={() => exportToExcel(favorites, 'Favoritler')}
              className="flex items-center gap-2 glass px-4 py-2 rounded-xl text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors text-sm"
            >
              <Download size={16} /> Excel
            </button>
            <button
              onClick={() => exportToPDF(favorites, 'Favoritlər')}
              className="flex items-center gap-2 glass px-4 py-2 rounded-xl text-red-300 border border-red-500/30 hover:bg-red-500/10 transition-colors text-sm"
            >
              <Download size={16} /> PDF
            </button>
            <button
              onClick={() => setShowConfirmClear(true)}
              className="flex items-center gap-2 glass px-4 py-2 rounded-xl text-gray-400 border border-white/10 hover:text-red-400 hover:border-red-500/30 transition-colors text-sm"
            >
              <Trash2 size={16} /> Hamısını sil
            </button>
          </div>
        )}

        {favorites.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Heart size={64} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">{t('favorites_empty')}</p>
            <p className="text-gray-500 text-sm">{t('favorites_hint')}</p>
            <a href="#/ixtilas-secimi" className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 transition-colors">
              <BookOpen size={18} /> İxtisas Seçiminə keç
            </a>
          </motion.div>
        ) : (
          <>
            <div className="text-sm text-gray-400 mb-6">{favorites.length} ixtisas saxlanılıb</div>
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map(spec => (
                  <FavoriteCard key={spec.id} spec={spec} />
                ))}
              </div>
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Clear confirm modal */}
      <AnimatePresence>
        {showConfirmClear && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="glass-strong rounded-2xl p-6 border border-white/10 max-w-sm w-full"
            >
              <h3 className="font-bold text-white mb-2">Bütün favoritləri sil?</h3>
              <p className="text-gray-400 text-sm mb-4">Bu əməliyyat geri alına bilməz.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmClear(false)} className="flex-1 py-2 rounded-xl glass text-gray-300 border border-white/10 hover:text-white transition-colors">Ləğv et</button>
                <button onClick={() => { clearFavorites(); setShowConfirmClear(false); }} className="flex-1 py-2 rounded-xl bg-red-600/20 border border-red-500/30 text-red-300 hover:bg-red-600/30 transition-colors font-bold">Sil</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
