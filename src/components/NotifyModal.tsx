import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { subscribeEmail } from '../lib/api';
import { useLang } from '../context/LanguageContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NotifyModal({ open, onClose }: Props) {
  const { t, lang } = useLang();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await subscribeEmail(email, lang);
      setDone(true);
    } catch (err: any) {
      if (err.message === 'already_subscribed') {
        setError(t('notify_already'));
      } else {
        setError(err.message || 'Xəta baş verdi');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { onClose(); setDone(false); setError(''); setEmail(''); };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
        onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          className="w-full max-w-md glass-strong rounded-3xl border border-white/10 shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell size={20} className="text-amber-400" />
                <h2 className="text-xl font-black text-white">{t('notify_title')}</h2>
              </div>
              <button onClick={handleClose} className="glass p-2 rounded-xl text-gray-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {done ? (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-4 py-8">
                <CheckCircle size={56} className="text-emerald-400" />
                <p className="text-white font-bold text-lg text-center">{t('notify_success')}</p>
                <p className="text-gray-400 text-sm text-center">
                  {email} — bu ünvana bildirişlər göndəriləcək
                </p>
                <button onClick={handleClose} className="px-6 py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 transition-colors font-medium">
                  {t('close')}
                </button>
              </motion.div>
            ) : (
              <>
                <p className="text-gray-400 text-sm mb-5">{t('notify_desc')}</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder={t('notify_email')} required
                      className="dim-input pl-9"
                    />
                  </div>
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl">
                      ⚠️ {error}
                    </div>
                  )}
                  <button type="submit" disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Bell size={18} />}
                    {t('notify_subscribe')}
                  </button>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
