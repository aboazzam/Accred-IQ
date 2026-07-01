'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, LogIn, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { loginApi } from '@/lib/api';
import { saveAuth } from '@/lib/auth';
import { useLang } from '@/lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const { t, dir } = useLang();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const BackIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await loginApi(email, password);
      saveAuth(res.data.accessToken, res.data.refreshToken, res.data.user);
      router.push('/programs');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('loginFailed'));
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen page-bg flex items-center justify-center px-4" dir={dir}>
      {/* Mesh blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-[-8%] w-[520px] h-[520px] rounded-full blur-[140px]"
          style={{ background: 'rgba(0,180,216,0.12)' }} />
        <div className="absolute bottom-[15%] right-[-8%] w-[480px] h-[480px] rounded-full blur-[120px]"
          style={{ background: 'rgba(107,70,193,0.18)' }} />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{ background: 'rgba(44,22,80,0.40)' }} />
        <div className="absolute inset-0 bg-hero-grid bg-[size:44px_44px] opacity-70" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Back */}
        <Link href="/" className="flex items-center gap-1.5 text-purple-300/50 hover:text-white text-xs mb-8 transition w-fit">
          <BackIcon className="w-3.5 h-3.5" /> {t('backToHome')}
        </Link>

        {/* Logo — h-16 w-auto, no wrapper height restriction */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-5">
            <Image
              src="/logo.png"
              alt={t('university')}
              width={827}
              height={136}
              style={{ height: '32px', width: 'auto' }}
              className="logo-white drop-shadow-[0_0_30px_rgba(0,180,216,0.48)]"
              priority
            />
          </div>
          <h1 className="text-2xl font-black text-white">{t('appName')}</h1>
          <p className="text-purple-200/50 text-xs mt-1">{t('university')} — {t('systemSubtitle')}</p>
        </div>

        {/* Card */}
        <div className="glass card-glow rounded-2xl p-7 relative overflow-hidden">
          {/* Top shimmer line */}
          <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(107,70,193,0.7), rgba(0,180,216,0.7), transparent)' }} />

          <h2 className="text-lg font-bold text-white mb-1">{t('loginTitle')}</h2>
          <p className="text-purple-200/50 text-xs mb-6">{t('loginSubtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-purple-200/70">{t('emailLabel')}</label>
              <input
                type="email" value={email} required dir="ltr"
                onChange={e => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                className="w-full px-4 py-2.5 rounded-xl text-white placeholder:text-purple-300/30 focus:outline-none transition text-sm"
                style={{
                  backgroundColor: 'rgba(26,13,52,0.75)',
                  border: '1px solid rgba(107,70,193,0.25)',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(0,180,216,0.55)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(107,70,193,0.25)'; }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-purple-200/70">{t('passwordLabel')}</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} value={password} required dir="ltr"
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl text-white placeholder:text-purple-300/30 focus:outline-none transition text-sm"
                  style={{
                    backgroundColor: 'rgba(26,13,52,0.75)',
                    border: '1px solid rgba(107,70,193,0.25)',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(0,180,216,0.55)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(107,70,193,0.25)'; }}
                />
                <button type="button" tabIndex={-1}
                  onClick={() => setShowPass(v => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300/40 hover:text-white transition">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl px-4 py-2.5 text-red-300 text-xs font-medium"
                style={{ backgroundColor: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.28)' }}>
                ⚠ {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full btn-glow flex items-center justify-center gap-2 text-white font-bold py-2.5 rounded-xl transition disabled:opacity-50 text-sm mt-2"
              style={{ background: loading ? 'rgba(44,22,80,0.9)' : 'linear-gradient(135deg, var(--color-purple-light) 0%, var(--color-cyan-brand) 100%)' }}>
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('verifying')}</>
                : <><LogIn className="w-4 h-4" /> {t('signinBtn')}</>}
            </button>
          </form>
        </div>

        <p className="text-center text-purple-300/25 text-xs mt-6">
          © {new Date().getFullYear()} Accred-IQ · {t('universityEn')}
        </p>
      </div>
    </div>
  );
}
