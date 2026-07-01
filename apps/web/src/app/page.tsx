'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Shield, BarChart3, FileCheck, Users, Award, ArrowLeft, Sparkles, ChevronLeft } from 'lucide-react';
import { useLang, type TKey } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const features: { icon: typeof Shield; titleKey: TKey; textKey: TKey; color: string }[] = [
  { icon: Shield,    titleKey: 'feat1Title', textKey: 'feat1Text', color: 'from-brand-600 to-brand-500' },
  { icon: BarChart3, titleKey: 'feat2Title', textKey: 'feat2Text', color: 'from-cyan-700 to-cyan-500' },
  { icon: FileCheck, titleKey: 'feat3Title', textKey: 'feat3Text', color: 'from-brand-600 to-cyan-600' },
  { icon: Users,     titleKey: 'feat4Title', textKey: 'feat4Text', color: 'from-violet-700 to-brand-500' },
  { icon: Award,     titleKey: 'feat5Title', textKey: 'feat5Text', color: 'from-cyan-700 to-brand-600' },
  { icon: Sparkles,  titleKey: 'feat6Title', textKey: 'feat6Text', color: 'from-violet-600 to-cyan-600' },
];

export default function LandingPage() {
  const { t, dir } = useLang();

  return (
    <div className="min-h-screen page-bg overflow-x-hidden" dir={dir}>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.07]"
        style={{ backgroundColor: 'rgba(44,22,80,0.88)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo — h-16 w-auto, no restrictive wrapper */}
          <div className="flex items-center gap-4">
            <Image
              src="/logo.png"
              alt="شعار جامعة سليمان الراجحي"
              width={200}
              height={32}
              style={{ height: '32px', width: 'auto' }}
              className="logo-white drop-shadow-[0_0_14px_rgba(0,180,216,0.45)]"
              priority
            />
            <div className="flex flex-col leading-tight">
              <span className="font-black text-white text-lg tracking-tight">Accred-IQ</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/login"
              className="btn-glow flex items-center gap-2 text-sm font-bold text-white rounded-full px-6 py-2.5 transition"
              style={{ background: 'linear-gradient(135deg, var(--color-purple-light) 0%, var(--color-cyan-brand) 100%)' }}>
              <span>{t('loginBtn')}</span>
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero-glow relative pt-40 pb-28 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-hero-grid bg-[size:44px_44px] opacity-100 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* University Badge */}
          <div className="inline-flex items-center gap-3 glass px-5 py-2.5 rounded-full text-xs text-cyan-300 font-semibold mb-10">
            {t('university')} — {t('universityEn')}
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
            <span className="gradient-text">{t('heroTitle1')}</span>
            <br />
            <span className="text-white/90 text-3xl md:text-4xl font-bold mt-2 inline-block">{t('heroTitle2')}</span>
          </h1>

          <p className="text-purple-200/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12">
            {t('heroDesc')}
          </p>
          <p className="text-purple-200/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12">
            {t('heroStandards')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login"
              className="btn-glow flex items-center gap-2.5 text-white font-bold px-9 py-4 rounded-2xl transition text-base"
              style={{ background: 'linear-gradient(135deg, var(--color-purple-light) 0%, var(--color-cyan-brand) 100%)' }}>
              <Shield className="w-5 h-5" />
              {t('getStarted')}
              <ArrowLeft className="w-4 h-4" />
            </Link>

          </div>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <section className="border-y border-white/[0.07] py-8 px-6"
        style={{ backgroundColor: 'rgba(26,13,52,0.70)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {([
            { val: '4',    labelKey: 'devPhases' },
            { val: '40+',  labelKey: 'apiRoutes' },
            { val: '7',    labelKey: 'roles' },
            { val: '100%', labelKey: null },
          ] as { val: string; labelKey: TKey | null }[]).map(s => (
            <div key={s.val}>
              <div className="text-3xl font-black gradient-text">{s.val}</div>
              <div className="text-purple-200/50 text-xs mt-1">{s.labelKey ? t(s.labelKey) : 'TypeScript'}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-white mb-3">{t('systemComponents')}</h2>
            <p className="text-purple-200/50">{t('systemDesc')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, titleKey, textKey, color }) => (
              <div key={titleKey} className="glass glass-hover rounded-2xl p-6 card-glow group">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-white text-base mb-2">{t(titleKey)}</h3>
                <p className="text-purple-200/55 text-sm leading-relaxed">{t(textKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center glass card-glow-purple rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(107,70,193,0.20) 0%, transparent 70%)' }} />
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-6">
              <Image
                src="/logo.png"
                alt="SRU Logo"
                width={400}
                height={80}
                style={{ height: '80px', width: 'auto' }}
                className="logo-white drop-shadow-[0_0_28px_rgba(0,180,216,0.50)]"
              />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">{t('readyToStart')}</h2>
            <p className="text-purple-200/55 mb-8 text-sm">{t('loginToProceed')}</p>
            <Link href="/login"
              className="btn-glow inline-flex items-center gap-2 text-white font-bold px-9 py-3.5 rounded-xl transition text-sm"
              style={{ background: 'linear-gradient(135deg, var(--color-purple-light) 0%, var(--color-cyan-brand) 100%)' }}>
              {t('loginBtn')} <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.07] py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Image
            src="/logo.png"
            alt="SRU"
            width={100}
            height={22}
            style={{ height: '22px', width: 'auto' }}
            className="logo-white opacity-30"
          />
        </div>
        <p className="text-purple-300/30 text-xs">
          © {new Date().getFullYear()} Accred-IQ — {t('university')} — {t('allRights')}
        </p>
      </footer>
    </div>
  );
}
