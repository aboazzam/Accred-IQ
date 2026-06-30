'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getToken } from '@/lib/auth';

export default function ProgramsPage() {
  const router = useRouter();
  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
    } else {
      router.replace('/admin');
    }
  }, [router]);

  return (
    <div className="min-h-screen page-bg flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
    </div>
  );
}
