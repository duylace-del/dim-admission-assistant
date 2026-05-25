import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Lock, Eye, EyeOff, Loader2, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';

function IconInput({
  icon,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  rightEl,
}: {
  icon: React.ReactNode;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
  required?: boolean;
  rightEl?: React.ReactNode;
}) {
  return (
    <div className="relative flex items-center">
      <span className="absolute left-3 text-gray-500 pointer-events-none z-10 flex items-center">
        {icon}
      </span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        style={{ paddingLeft: '2.5rem', paddingRight: rightEl ? '2.5rem' : '0.875rem' }}
        className="w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 py-3 focus:outline-none focus:border-blue-500 focus:bg-blue-500/5 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)] transition-all font-[Outfit,sans-serif] text-sm"
      />
      {rightEl && (
        <span className="absolute right-3 z-10 flex items-center">
          {rightEl}
        </span>
      )}
    </div>
  );
}

export default function AuthModal() {
  const { login, register, loading, showAuthModal, setShowAuthModal, authMode, setAuthMode } = useAuth();
  const { t } = useLang();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');

  const reset = () => { setUsername(''); setEmail(''); setPassword(''); setConfirm(''); setError(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (authMode === 'login') {
        await login(email, password);
      } else {
        if (password !== confirm) { setError('Şifrələr uyğun gəlmir'); return; }
        await register(username, email, password);
      }
      reset();
    } catch (err: any) {
      setError(err.message || 'Xəta baş verdi');
    }
  };

  const switchMode = () => { reset(); setAuthMode(authMode === 'login' ? 'register' : 'login'); };

  if (!showAuthModal) return null;

  const pwToggle = (
    <button type="button" onClick={() => setShowPwd(!showPwd)} className="text-gray-400 hover:text-white transition-colors">
      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
        onClick={e => { if (e.target === e.currentTarget) { setShowAuthModal(false); reset(); } }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          className="w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
          style={{ background: 'rgba(10,22,50,0.95)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-white/8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shrink-0">
                  <GraduationCap size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white leading-tight">
                    {authMode === 'login' ? t('auth_title') : t('register_title')}
                  </h2>
                  <p className="text-xs text-gray-400">DİM Köməkçi</p>
                </div>
              </div>
              <button
                onClick={() => { setShowAuthModal(false); reset(); }}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-3">
              {authMode === 'register' && (
                <IconInput
                  icon={<User size={16} />}
                  type="text"
                  value={username}
                  onChange={setUsername}
                  placeholder={t('username')}
                  autoComplete="username"
                  required
                />
              )}

              <IconInput
                icon={<Mail size={16} />}
                type="email"
                value={email}
                onChange={setEmail}
                placeholder={t('email')}
                autoComplete="email"
                required
              />

              <IconInput
                icon={<Lock size={16} />}
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
                placeholder={t('password')}
                autoComplete="current-password"
                required
                rightEl={pwToggle}
              />

              {authMode === 'register' && (
                <IconInput
                  icon={<Lock size={16} />}
                  type={showPwd ? 'text' : 'password'}
                  value={confirm}
                  onChange={setConfirm}
                  placeholder={t('confirm_password')}
                  autoComplete="new-password"
                  required
                />
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {authMode === 'login' ? t('login') : t('register')}
              </button>
            </form>

            <div className="mt-4 text-center text-sm text-gray-400">
              {authMode === 'login' ? t('no_account') : t('have_account')}
              {' '}
              <button onClick={switchMode} className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                {authMode === 'login' ? t('register') : t('login')}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
