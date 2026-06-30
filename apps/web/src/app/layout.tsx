import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Accred-IQ — نظام إدارة الاعتماد الأكاديمي',
  description: 'نظام ذكي لإدارة الجودة والاعتماد الأكاديمي والتقويم المبني على الجدارات',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-arabic">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
