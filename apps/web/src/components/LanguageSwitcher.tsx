'use client';

import { Languages } from 'lucide-react';
import { useLang } from '@/lib/i18n';

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLang();

  return (
    <button
      onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition ${className}`}
      style={{ background: 'rgba(0,180,216,0.15)', border: '1px solid rgba(0,180,216,0.30)', color: '#00B4D8' }}
      title="تبديل اللغة / Switch Language">
      <Languages className="w-3.5 h-3.5" />
      {lang === 'ar' ? 'English' : 'العربية'}
    </button>
  );
}
