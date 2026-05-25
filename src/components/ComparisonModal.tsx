import { motion, AnimatePresence } from 'framer-motion';
import { X, BarChart2, Trash2 } from 'lucide-react';
import { useComparison } from '../context/ComparisonContext';
import { useLang } from '../context/LanguageContext';
import { Specialty } from '../data/specialties';

const levelLabel: Record<string, string> = {
  bakalavr: 'Bakalavr', magistr: 'Magistr', rezidentura: 'Rezidentura',
  kollec_9: 'Kollec (9)', kollec_11: 'Kollec (11)', subbakalavr: 'Subbakalavr',
};

function ScoreBar({ value, max, color }: { value: number | null | undefined; max: number; color: string }) {
  const pct = value ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="text-xs font-bold" style={{ color }}>{value ?? '—'}</span>
    </div>
  );
}

function SpecCard({ spec, onRemove }: { spec: Specialty; onRemove: () => void }) {
  const maxBal = spec.level === 'bakalavr' ? 700 : spec.level === 'rezidentura' ? 200 : spec.level === 'magistr' ? 100 : 300;
  return (
    <div className="glass rounded-2xl p-4 border border-white/10 flex flex-col gap-3 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold text-white text-sm leading-snug">{spec.name}</div>
          <div className="text-xs text-gray-400 mt-0.5">{spec.universityShort || spec.universityName}</div>
        </div>
        <button onClick={onRemove} className="shrink-0 p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 text-xs">
        <span className="badge bg-blue-500/20 text-blue-300 border border-blue-500/30">{levelLabel[spec.level] || spec.level}</span>
        {spec.group && <span className="badge bg-purple-500/20 text-purple-300 border border-purple-500/30">{spec.group} Qrup</span>}
        <span className="badge bg-white/10 text-gray-300 border border-white/20">{spec.language || 'AZ'}</span>
      </div>

      <div className="space-y-1">
        <div className="text-xs text-orange-400 font-medium">💰 Ödənişli keçid balı</div>
        <ScoreBar value={spec.bal_odenis} max={maxBal} color="#f97316" />
      </div>
      <div className="space-y-1">
        <div className="text-xs text-green-400 font-medium">🆓 Dövlət yeri balı</div>
        <ScoreBar value={spec.bal_dovlet} max={maxBal} color="#10b981" />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="glass p-2 rounded-xl text-center">
          <div className="text-gray-400">Plan yeri</div>
          <div className="font-bold text-white">{spec.plan ?? '—'}</div>
        </div>
        <div className="glass p-2 rounded-xl text-center">
          <div className="text-gray-400">Şəhər</div>
          <div className="font-bold text-blue-300 text-[11px]">{spec.city || '—'}</div>
        </div>
        {spec.applicants && (
          <div className="glass p-2 rounded-xl text-center col-span-2">
            <div className="text-gray-400">Rəqabət</div>
            <div className="font-bold text-amber-300">{(spec.applicants / (spec.plan || 30)).toFixed(1)} n/yer</div>
          </div>
        )}
      </div>

      {spec.isSpecial && (
        <div className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
          ★ Xüsusi Qabiliyyət imtahanı tələb olunur
        </div>
      )}
    </div>
  );
}

export default function ComparisonModal() {
  const { items, clearComparison, toggleComparison, showModal, setShowModal } = useComparison();
  const { t } = useLang();

  if (!showModal || items.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
        onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          className="w-full max-w-5xl glass-strong rounded-3xl border border-white/10 shadow-2xl mb-8"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-5 border-b border-white/8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 size={20} className="text-blue-400" />
              <h2 className="font-bold text-white text-lg">{t('compare_title')}</h2>
              <span className="text-sm text-gray-400">({items.length} ixtisas)</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearComparison} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 glass px-3 py-1.5 rounded-xl transition-colors">
                <Trash2 size={13} /> Hamısını sil
              </button>
              <button onClick={() => setShowModal(false)} className="glass p-2 rounded-xl text-gray-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="p-5">
            <div className={`grid gap-4 ${items.length === 1 ? 'grid-cols-1 max-w-sm' : items.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {items.map(spec => (
                <SpecCard key={spec.id} spec={spec} onRemove={() => toggleComparison(spec)} />
              ))}
              {items.length < 3 && (
                <div className="glass rounded-2xl p-4 border border-dashed border-white/20 flex flex-col items-center justify-center gap-2 text-gray-500 min-h-[200px]">
                  <BarChart2 size={24} />
                  <span className="text-xs text-center">Müqayisə üçün daha ixtisas seçin<br/><span className="opacity-60">max 3 ixtisas</span></span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
