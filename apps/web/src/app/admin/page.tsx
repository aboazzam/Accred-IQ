'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  LayoutDashboard, BookOpen, Users, FileText, Settings,
  TrendingUp, Award, CheckCircle2, Clock, AlertCircle,
  Plus, Search, Filter, BarChart3, Target, Shield,
  LogOut, GraduationCap, Building2, ArrowUpRight, Edit,
  Eye, Download, RefreshCw, ChevronRight, Loader2,
  BookMarked, ClipboardList, Bell, Star, Layers,
  Sliders, Save, RotateCcw, X, Trash2, Languages,
  UserCog, UserPlus, ShieldCheck, Mail,
} from 'lucide-react';
import {
  fetchPrograms, fetchCourses, fetchDepartments, fetchColleges, fetchPlos,
  createProgram, createCourse,
  createCollegeApi, updateCollegeApi, deleteCollegeApi,
  createDepartmentApi, updateDepartmentApi, deleteDepartmentApi,
  type Program, type Course, type Department, type College, type PLO,
} from '@/lib/api';
import { getToken, getUser, clearAuth } from '@/lib/auth';
import { useLang, type TKey } from '@/lib/i18n';
import { ImportExcelButton, type ExcelCourseRow, type ExcelUserRow } from '@/components/ImportExcelButton';

// ── Constants ────────────────────────────────────────────────
const LEVEL_AR: Record<string, string> = {
  BACHELOR: 'بكالوريوس', MASTER: 'ماجستير', DOCTORATE: 'دكتوراه', DIPLOMA: 'دبلوم',
};

const ACC_STATUS: Record<string, { key: TKey; dot: string; badge: string }> = {
  ACCREDITED: { key: 'accredited', dot: 'bg-emerald-400', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  CANDIDATE:  { key: 'candidate',  dot: 'bg-cyan-400',    badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'    },
  INITIAL:    { key: 'initial',    dot: 'bg-brand-400',   badge: 'bg-brand-600/20 text-brand-300 border-brand-600/30' },
  NONE:       { key: 'none',       dot: 'bg-slate-400',   badge: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
};

const NAV_ITEMS: { id: string; icon: React.ElementType; key: TKey; color: string }[] = [
  { id: 'overview',   icon: LayoutDashboard, key: 'navOverview',  color: 'from-brand-600 to-brand-500'  },
  { id: 'programs',   icon: Building2,       key: 'navPrograms',  color: 'from-cyan-700 to-cyan-500'   },
  { id: 'courses',    icon: BookOpen,        key: 'navCourses',   color: 'from-brand-600 to-cyan-700'  },
  { id: 'standards',  icon: Sliders,         key: 'navStandards', color: 'from-emerald-700 to-cyan-600' },
  { id: 'reports',    icon: FileText,        key: 'navReports',   color: 'from-violet-600 to-brand-500' },
  { id: 'users',      icon: UserCog,         key: 'navUsers',     color: 'from-amber-600 to-orange-500' },
  { id: 'settings',   icon: Settings,        key: 'navSettings',  color: 'from-slate-600 to-brand-600'  },
];

// ── Page ─────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const user   = getUser();
  const { lang, setLang, t, dir } = useLang();

  const [tab,         setTab]         = useState('overview');
  const [programs,    setPrograms]    = useState<Program[]>([]);
  const [courses,     setCourses]     = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [colleges,    setColleges]    = useState<College[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [search,      setSearch]      = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterLevel,  setFilterLevel]  = useState('ALL');
  const [refreshKey,   setRefreshKey]   = useState(0);

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    setLoading(true);
    Promise.all([fetchPrograms(), fetchCourses(), fetchDepartments(), fetchColleges()])
      .then(([p, c, d, col]) => {
        setPrograms(p.data); setCourses(c.data);
        setDepartments(d.data); setColleges(col.data);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [router, refreshKey]);

  function logout() { clearAuth(); router.push('/login'); }
  function refresh() { setRefreshKey(k => k + 1); }

  // ── Filtered programs ──
  const filteredPrograms = useMemo(() => programs.filter(p => {
    const matchSearch = !search ||
      p.nameAr.includes(search) ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || p.accreditationStatus === filterStatus;
    const matchLevel  = filterLevel  === 'ALL' || p.level === filterLevel;
    return matchSearch && matchStatus && matchLevel;
  }), [programs, search, filterStatus, filterLevel]);

  // ── Filtered courses ──
  const filteredCourses = useMemo(() => courses.filter(c => {
    return !search ||
      c.nameAr.includes(search) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase());
  }), [courses, search]);

  // ── Stats ──
  const stats = {
    totalPrograms:    programs.length,
    totalCourses:     courses.length,
    accredited:       programs.filter(p => p.accreditationStatus === 'ACCREDITED').length,
    candidate:        programs.filter(p => p.accreditationStatus === 'CANDIDATE').length,
    totalPlos:        programs.reduce((n, p) => n + (p._count?.plos ?? 0), 0),
    totalCourseClos:  courses.reduce((n, c) => n + (c._count?.clos ?? 0), 0),
  };

  return (
    <div className="min-h-screen page-bg flex" dir={dir}>

      {/* ════ SIDEBAR ════ */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-l border-white/[0.07] sticky top-0 h-screen overflow-y-auto"
        style={{ backgroundColor: 'rgba(26,13,52,0.92)', backdropFilter: 'blur(20px)' }}>

        {/* Logo + title */}
        <div className="p-5 border-b border-white/[0.07]">
          <Link href="/" className="flex flex-col items-start gap-2.5 mb-4 hover:opacity-80 transition" title={t('backToHome')}>
            <Image src="/logo.png" alt="SRU" width={827} height={136}
              style={{ height: '28px', width: 'auto', maxWidth: '100%' }}
              className="logo-white drop-shadow-[0_0_10px_rgba(0,180,216,0.38)]" />
            <div className="min-w-0">
              <p className="font-black text-white text-sm leading-tight">Accred-IQ</p>
              <p className="text-purple-300/50 text-[10px] leading-tight mt-0.5">{t('adminPanel')}</p>
            </div>
          </Link>
          {/* Admin badge */}
          <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-black flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--color-purple-light), var(--color-cyan-brand))' }}>
              {user?.name?.charAt(0) ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[11px] font-bold truncate">{user?.name ?? 'Admin'}</p>
              <p className="text-purple-300/50 text-[10px] truncate">{user?.roleNameAr ?? t('sysAdmin')}</p>
            </div>
            <button onClick={logout} className="text-purple-300/40 hover:text-red-400 transition flex-shrink-0" title={t('logout')}>
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map(({ id, icon: Icon, key, color }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => { setTab(id); setSearch(''); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  active ? 'text-white' : 'text-purple-300/60 hover:text-white hover:bg-white/5'
                }`}
                style={active ? { background: 'rgba(107,70,193,0.25)', border: '1px solid rgba(107,70,193,0.35)' } : {}}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                  active ? `bg-gradient-to-br ${color}` : 'bg-white/5 group-hover:bg-white/10'
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                {t(key)}
                {active && <ArrowUpRight className="w-3 h-3 mr-auto opacity-50" />}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.07]">
          <Link href="/programs"
            className="flex items-center gap-2 text-purple-300/50 hover:text-white text-xs transition py-2 px-3 rounded-lg hover:bg-white/5">
            <ChevronRight className="w-3.5 h-3.5" />
            {t('backToPrograms')}
          </Link>
        </div>
      </aside>

      {/* ════ MAIN ════ */}
      <main className="flex-1 overflow-auto">

        {/* Top header */}
        <header className="sticky top-0 z-30 border-b border-white/[0.07] px-8 h-14 flex items-center justify-between"
          style={{ backgroundColor: 'rgba(44,22,80,0.85)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold text-white">
              {t(NAV_ITEMS.find(n => n.id === tab)?.key ?? 'navOverview')}
            </h1>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />}
          </div>
          <div className="flex items-center gap-3">
            {/* Language toggle — prominent, always visible in topbar */}
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition"
              style={{ background: 'rgba(0,180,216,0.15)', border: '1px solid rgba(0,180,216,0.30)', color: '#00B4D8' }}
              title="تبديل اللغة / Switch Language">
              <Languages className="w-3.5 h-3.5" />
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>
            <button onClick={refresh} className="text-purple-300/50 hover:text-white transition" title="تحديث">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button className="relative text-purple-300/50 hover:text-white transition">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-cyan-400 rounded-full" />
            </button>
          </div>
        </header>

        <div className="p-8">
          {error && (
            <div className="glass rounded-xl px-4 py-3 text-red-300 text-sm mb-6"
              style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
              ⚠ {error}
            </div>
          )}

          {/* ── Overview Tab ── */}
          {tab === 'overview' && <OverviewTab stats={stats} programs={programs} courses={courses} setTab={setTab} />}

          {/* ── Programs Tab ── */}
          {tab === 'programs' && (
            <ProgramsTab
              programs={filteredPrograms} allCount={programs.length}
              search={search} setSearch={setSearch}
              filterStatus={filterStatus} setFilterStatus={setFilterStatus}
              filterLevel={filterLevel} setFilterLevel={setFilterLevel}
              loading={loading}
              departments={departments}
              onAdd={p => setPrograms(prev => [p, ...prev])}
            />
          )}

          {/* ── Courses Tab ── */}
          {tab === 'courses' && (
            <CoursesTab
              courses={filteredCourses} allCount={courses.length}
              programs={programs}
              search={search} setSearch={setSearch}
              loading={loading}
              onAdd={c => setCourses(prev => [c, ...prev])}
            />
          )}

          {/* ── Standards Tab ── */}
          {tab === 'standards' && <CompetencyStandardsTab />}

          {/* ── Reports Tab ── */}
          {tab === 'reports' && <ReportsTab programs={programs} />}

          {/* ── Users & Permissions Tab ── */}
          {tab === 'users' && <UsersPermissionsTab />}

          {/* ── Settings Tab ── */}
          {tab === 'settings' && (
            <SettingsTab
              colleges={colleges} departments={departments}
              onRefresh={() => setRefreshKey(k => k + 1)}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ════════════════════════════════════════════════════════════
function OverviewTab({
  stats, programs, courses, setTab,
}: {
  stats: Record<string, number>;
  programs: Program[];
  courses: Course[];
  setTab: (t: string) => void;
}) {
  const { t, lang } = useLang();
  const statCards = [
    { val: stats.totalPrograms,   label: t('statPrograms'),   icon: Building2,     color: 'from-brand-600 to-brand-500',  tab: 'programs' },
    { val: stats.totalCourses,    label: t('statCourses'),    icon: BookOpen,      color: 'from-cyan-700 to-cyan-500',    tab: 'courses'  },
    { val: stats.accredited,      label: t('statAccredited'), icon: CheckCircle2,  color: 'from-emerald-700 to-emerald-500', tab: 'programs' },
    { val: stats.totalPlos,       label: t('statPlos'),       icon: Target,        color: 'from-violet-700 to-brand-500', tab: 'reports'  },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-black text-white mb-0.5">{t('welcome')}، {(typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('accrediq_user') ?? '{}').name ?? 'Admin') : 'Admin').split(' ')[0]} 👋</h2>
        <p className="text-purple-300/50 text-sm">{t('overviewSubtitle')}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(s => {
          const Icon = s.icon;
          return (
            <button key={s.label} onClick={() => setTab(s.tab)}
              className="glass glass-hover card-glow rounded-2xl p-5 text-right group transition-all">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl font-black text-white mb-0.5">{s.val}</div>
              <div className="text-purple-300/60 text-xs">{s.label}</div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Programs by status */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-white">{t('programsByStatus')}</h3>
            <button onClick={() => setTab('programs')} className="text-xs text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1">
              {t('viewAll')} <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {Object.entries(ACC_STATUS).map(([key, { key: statusKey, dot, badge }]) => {
              const count = programs.filter(p => p.accreditationStatus === key).length;
              const pct   = programs.length ? Math.round(count / programs.length * 100) : 0;
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border w-16 text-center flex-shrink-0 ${badge}`}>{t(statusKey)}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className={`h-full rounded-full ${dot}`} style={{ width: `${pct}%`, opacity: 0.7 }} />
                  </div>
                  <span className="text-white text-xs font-bold w-4 text-left">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent programs */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-white">{t('recentPrograms')}</h3>
            <button onClick={() => setTab('programs')} className="text-xs text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1">
              {t('viewAll')} <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {programs.slice(0, 5).map(p => {
              const st = ACC_STATUS[p.accreditationStatus] ?? ACC_STATUS.NONE;
              return (
                <Link key={p.id} href={`/dashboard/${p.id}`}
                  className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-white/5 transition group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(107,70,193,0.25)', border: '1px solid rgba(107,70,193,0.30)' }}>
                    <GraduationCap className="w-4 h-4 text-brand-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{lang === 'ar' ? p.nameAr : p.name}</p>
                    <p className="text-purple-300/50 text-[10px] font-mono">{p.code} · {LEVEL_AR[p.level] ?? p.level}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${st.badge}`}>{t(st.key)}</span>
                </Link>
              );
            })}
            {programs.length === 0 && !programs.length && (
              <p className="text-purple-300/40 text-xs text-center py-4">{t('noPrograms')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-bold text-white mb-4">{t('quickActions')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: t('managePrograms'),       icon: Building2,      tab: 'programs', color: 'from-brand-600 to-brand-500' },
            { label: t('viewCourses'),           icon: BookOpen,       tab: 'courses',  color: 'from-cyan-700 to-cyan-500'  },
            { label: t('manageUsers'),           icon: UserCog,        tab: 'users',    color: 'from-amber-600 to-orange-500' },
            { label: t('accreditationReports'),  icon: FileText,       tab: 'reports',  color: 'from-violet-600 to-brand-500'},
            { label: t('systemSettings'),        icon: Settings,       tab: 'settings', color: 'from-slate-600 to-brand-600' },
          ].map(a => {
            const Icon = a.icon;
            return (
              <button key={a.label} onClick={() => setTab(a.tab)}
                className="glass glass-hover rounded-xl p-4 flex flex-col items-center gap-2 text-center group">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-purple-200/70 text-xs font-semibold group-hover:text-white transition">{a.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PROGRAMS TAB
// ════════════════════════════════════════════════════════════
function ProgramsTab({
  programs, allCount, search, setSearch,
  filterStatus, setFilterStatus, filterLevel, setFilterLevel, loading,
  departments, onAdd,
}: {
  programs: Program[]; allCount: number;
  search: string; setSearch: (s: string) => void;
  filterStatus: string; setFilterStatus: (s: string) => void;
  filterLevel: string; setFilterLevel: (s: string) => void;
  loading: boolean;
  departments: Department[];
  onAdd: (p: Program) => void;
}) {
  const { lang, t } = useLang();
  const [showModal, setShowModal] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [apiError,  setApiError]  = useState('');
  const [form, setForm] = useState({
    code: '', name: '', nameAr: '',
    level: 'BACHELOR', totalCreditHours: 120,
    accreditationBody: 'NCAAA',
    departmentId: '',
  });

  async function handleCreate() {
    if (!form.code || !form.nameAr || !form.name) {
      setApiError('يرجى ملء الحقول المطلوبة (الاسم والكود)'); return;
    }
    setSaving(true); setApiError('');
    try {
      const payload = { ...form, departmentId: form.departmentId || undefined };
      const res = await createProgram(payload);
      onAdd(res.data);
      setShowModal(false);
      setForm({ code: '', name: '', nameAr: '', level: 'BACHELOR', totalCreditHours: 120, accreditationBody: 'NCAAA', departmentId: '' });
    } catch (e: unknown) {
      setApiError(e instanceof Error ? e.message : 'فشل إنشاء البرنامج');
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-5">
      {/* ── Add Program Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(10,5,20,0.80)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-lg glass card-glow rounded-2xl overflow-hidden relative"
            style={{ border: '1px solid rgba(107,70,193,0.30)' }}>
            <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(107,70,193,0.7), rgba(0,180,216,0.7), transparent)' }} />
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]"
              style={{ backgroundColor: 'rgba(44,22,80,0.60)' }}>
              <h3 className="text-white font-black text-base">إضافة برنامج أكاديمي جديد</h3>
              <button onClick={() => { setShowModal(false); setApiError(''); }}
                className="text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200/70">الاسم بالعربية *</label>
                  <input value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))}
                    placeholder="برنامج هندسة البرمجيات"
                    className="w-full px-4 py-2.5 rounded-xl text-white placeholder:text-purple-300/30 text-sm focus:outline-none"
                    style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(0,180,216,0.55)'; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(107,70,193,0.25)'; }} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200/70">الاسم بالإنجليزية *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Software Engineering" dir="ltr"
                    className="w-full px-4 py-2.5 rounded-xl text-white placeholder:text-purple-300/30 text-sm focus:outline-none"
                    style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(0,180,216,0.55)'; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(107,70,193,0.25)'; }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200/70">كود البرنامج *</label>
                  <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                    placeholder="SW-BSc" dir="ltr"
                    className="w-full px-4 py-2.5 rounded-xl text-white placeholder:text-purple-300/30 text-sm focus:outline-none font-mono"
                    style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(0,180,216,0.55)'; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(107,70,193,0.25)'; }} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200/70">المستوى *</label>
                  <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-white text-sm focus:outline-none"
                    style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }}>
                    <option value="BACHELOR">بكالوريوس</option>
                    <option value="MASTER">ماجستير</option>
                    <option value="DOCTORATE">دكتوراه</option>
                    <option value="DIPLOMA">دبلوم</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200/70">الساعات المعتمدة *</label>
                  <input type="number" min={1} value={form.totalCreditHours}
                    onChange={e => setForm(f => ({ ...f, totalCreditHours: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl text-white text-sm focus:outline-none"
                    style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(0,180,216,0.55)'; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(107,70,193,0.25)'; }} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200/70">جهة الاعتماد</label>
                  <input value={form.accreditationBody} onChange={e => setForm(f => ({ ...f, accreditationBody: e.target.value }))}
                    placeholder="NCAAA" dir="ltr"
                    className="w-full px-4 py-2.5 rounded-xl text-white placeholder:text-purple-300/30 text-sm focus:outline-none"
                    style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(0,180,216,0.55)'; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(107,70,193,0.25)'; }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-purple-200/70">القسم الأكاديمي (اختياري)</label>
                <select value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-white text-sm focus:outline-none"
                  style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }}>
                  <option value="">— بدون قسم —</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.nameAr} — {d.code}</option>
                  ))}
                </select>
              </div>
              {apiError && (
                <div className="rounded-xl px-4 py-2.5 text-red-300 text-xs"
                  style={{ backgroundColor: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.28)' }}>
                  ⚠ {apiError}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-white/[0.07] flex items-center justify-end gap-3"
              style={{ backgroundColor: 'rgba(26,13,52,0.40)' }}>
              <button onClick={() => { setShowModal(false); setApiError(''); }}
                className="text-xs text-purple-300/60 hover:text-white glass glass-hover px-4 py-2 rounded-xl transition">
                إلغاء
              </button>
              <button onClick={handleCreate} disabled={saving}
                className="btn-glow flex items-center gap-1.5 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-purple-light) 0%, var(--color-cyan-brand) 100%)' }}>
                {saving
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> جارٍ الحفظ...</>
                  : <><Plus className="w-3.5 h-3.5" /> إضافة</>}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-purple-300/40" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث باسم البرنامج أو الكود..."
            className="w-full pr-9 pl-4 py-2 rounded-xl text-sm text-white placeholder:text-purple-300/30 focus:outline-none"
            style={{ backgroundColor: 'rgba(26,13,52,0.80)', border: '1px solid rgba(107,70,193,0.25)' }}
            onFocus={e => { e.target.style.borderColor = 'rgba(0,180,216,0.5)'; }}
            onBlur={e =>  { e.target.style.borderColor = 'rgba(107,70,193,0.25)'; }}
          />
        </div>

        {/* Status filter */}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="text-xs text-white py-2 px-3 rounded-xl focus:outline-none"
          style={{ backgroundColor: 'rgba(26,13,52,0.80)', border: '1px solid rgba(107,70,193,0.25)' }}>
          <option value="ALL">كل الحالات</option>
          <option value="ACCREDITED">معتمد</option>
          <option value="CANDIDATE">مرشح</option>
          <option value="INITIAL">تمهيدي</option>
          <option value="NONE">غير محدد</option>
        </select>

        {/* Level filter */}
        <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
          className="text-xs text-white py-2 px-3 rounded-xl focus:outline-none"
          style={{ backgroundColor: 'rgba(26,13,52,0.80)', border: '1px solid rgba(107,70,193,0.25)' }}>
          <option value="ALL">كل المستويات</option>
          <option value="BACHELOR">بكالوريوس</option>
          <option value="MASTER">ماجستير</option>
          <option value="DOCTORATE">دكتوراه</option>
          <option value="DIPLOMA">دبلوم</option>
        </select>

        <div className="text-xs text-purple-300/50">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : `${programs.length} من ${allCount}`}
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 text-white text-xs font-bold px-4 py-2 rounded-xl transition btn-glow flex-shrink-0 mr-auto"
          style={{ background: 'linear-gradient(135deg, var(--color-purple-light), var(--color-cyan-brand))' }}>
          <Plus className="w-3.5 h-3.5" /> إضافة برنامج
        </button>
      </div>

      {/* Grid */}
      {programs.length === 0 && !loading && (
        <EmptyState icon={Building2} text="لا توجد برامج تطابق معايير البحث" />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {programs.map(prog => {
          const st = ACC_STATUS[prog.accreditationStatus] ?? ACC_STATUS.NONE;
          return (
            <div key={prog.id} className="glass glass-hover card-glow rounded-2xl p-5 flex flex-col gap-4 group">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(107,70,193,0.25)', border: '1px solid rgba(107,70,193,0.30)' }}>
                  <GraduationCap className="w-5 h-5 text-brand-300" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.badge}`}>{t(st.key)}</span>
              </div>

              {/* Info */}
              <div className="flex-1">
                <p className="text-white font-bold text-sm leading-snug">{lang === 'ar' ? prog.nameAr : prog.name}</p>
                <p className="text-purple-300/50 text-xs mt-0.5" dir={lang === 'ar' ? 'ltr' : 'rtl'}>{lang === 'ar' ? prog.name : prog.nameAr}</p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="text-[10px] text-purple-300/50">{LEVEL_AR[prog.level] ?? prog.level}</span>
                  <span className="text-purple-300/20">·</span>
                  <span className="text-[10px] font-mono text-purple-300/50">{prog.code}</span>
                  {prog.totalCreditHours > 0 && <>
                    <span className="text-purple-300/20">·</span>
                    <span className="text-[10px] text-purple-300/50">{prog.totalCreditHours} ساعة</span>
                  </>}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  {prog._count && (
                    <>
                      <span className="flex items-center gap-1 text-[10px] text-purple-300/50">
                        <BookOpen className="w-3 h-3" />{prog._count.courses} مقرر
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-purple-300/50">
                        <Target className="w-3 h-3" />{prog._count.plos} PLO
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-auto">
                <Link href={`/dashboard/${prog.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 text-white text-xs font-bold py-2 rounded-xl transition btn-glow"
                  style={{ background: 'linear-gradient(135deg, var(--color-purple-light), var(--color-cyan-brand))' }}>
                  <LayoutDashboard className="w-3.5 h-3.5" /> إدارة البرنامج
                </Link>
                <Link href={`/dashboard/${prog.id}?tab=plos`}
                  className="flex items-center justify-center w-9 h-9 glass glass-hover rounded-xl text-purple-300/60 hover:text-white">
                  <Target className="w-4 h-4" />
                </Link>
                <Link href={`/dashboard/${prog.id}?tab=courses`}
                  className="flex items-center justify-center w-9 h-9 glass glass-hover rounded-xl text-purple-300/60 hover:text-white">
                  <BookOpen className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// COURSES TAB
// ════════════════════════════════════════════════════════════
function CoursesTab({
  courses, allCount, programs, search, setSearch, loading,
  onAdd,
}: {
  courses: Course[]; allCount: number;
  programs: Program[];
  search: string; setSearch: (s: string) => void;
  loading: boolean;
  onAdd: (c: Course) => void;
}) {
  const { t, lang } = useLang();
  const programMap = useMemo(() =>
    Object.fromEntries(programs.map(p => [p.id, p])), [programs]);

  const [showModal, setShowModal] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [apiError,  setApiError]  = useState('');
  const [form, setForm] = useState({
    code: '', name: '', nameAr: '',
    creditHours: 3,
    programId: programs[0]?.id ?? '',
    semester: '', academicYear: '',
    ploIds: [] as string[],
  });
  const [plos, setPlos] = useState<PLO[]>([]);
  const [plosLoading, setPlosLoading] = useState(false);

  useEffect(() => {
    if (!form.programId) { setPlos([]); return; }
    setPlosLoading(true);
    fetchPlos(form.programId)
      .then(res => setPlos(res.data))
      .catch(() => setPlos([]))
      .finally(() => setPlosLoading(false));
  }, [form.programId]);

  function togglePlo(id: string) {
    setForm(f => ({
      ...f,
      ploIds: f.ploIds.includes(id) ? f.ploIds.filter(x => x !== id) : [...f.ploIds, id],
    }));
  }

  function handleImport(rows: ExcelCourseRow[]) {
    const row = rows[0];
    if (!row) return;
    setForm(f => ({ ...f, code: row.code, name: row.name, nameAr: row.nameAr, creditHours: row.creditHours, semester: row.semester, academicYear: row.academicYear }));
  }

  async function handleCreate() {
    if (!form.code || !form.nameAr || !form.name || !form.programId) {
      setApiError(t('fillAll')); return;
    }
    setSaving(true); setApiError('');
    try {
      const res = await createCourse({
        ...form,
        semester:     form.semester     || undefined,
        academicYear: form.academicYear || undefined,
      });
      onAdd(res.data);
      setShowModal(false);
      setForm({ code: '', name: '', nameAr: '', creditHours: 3, programId: programs[0]?.id ?? '', semester: '', academicYear: '', ploIds: [] });
    } catch (e: unknown) {
      setApiError(e instanceof Error ? e.message : t('createCourseFail'));
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-5">
      {/* ── Add Course Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(10,5,20,0.80)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-lg glass card-glow rounded-2xl overflow-hidden relative"
            style={{ border: '1px solid rgba(0,180,216,0.30)' }}>
            <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(0,180,216,0.7), rgba(107,70,193,0.7), transparent)' }} />
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]"
              style={{ backgroundColor: 'rgba(44,22,80,0.60)' }}>
              <h3 className="text-white font-black text-base">{t('addCourseTitle')}</h3>
              <div className="flex items-center gap-2">
                <ImportExcelButton template="course" onImport={handleImport} compact />
                <button onClick={() => { setShowModal(false); setApiError(''); }}
                  className="text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-purple-200/70">{t('academicProgram')} *</label>
                <select value={form.programId} onChange={e => setForm(f => ({ ...f, programId: e.target.value, ploIds: [] }))}
                  className="w-full px-4 py-2.5 rounded-xl text-white text-sm focus:outline-none"
                  style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }}>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.nameAr} — {p.code}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200/70">{t('nameAr')} *</label>
                  <input value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))}
                    placeholder="مبادئ البرمجة"
                    className="w-full px-4 py-2.5 rounded-xl text-white placeholder:text-purple-300/30 text-sm focus:outline-none"
                    style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(0,180,216,0.55)'; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(107,70,193,0.25)'; }} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200/70">{t('nameEn')} *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Introduction to Programming" dir="ltr"
                    className="w-full px-4 py-2.5 rounded-xl text-white placeholder:text-purple-300/30 text-sm focus:outline-none"
                    style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(0,180,216,0.55)'; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(107,70,193,0.25)'; }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200/70">{t('courseCode')} *</label>
                  <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                    placeholder="CS101" dir="ltr"
                    className="w-full px-4 py-2.5 rounded-xl text-white placeholder:text-purple-300/30 text-sm focus:outline-none font-mono"
                    style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(0,180,216,0.55)'; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(107,70,193,0.25)'; }} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200/70">{t('hours')} *</label>
                  <input type="number" min={1} max={6} value={form.creditHours}
                    onChange={e => setForm(f => ({ ...f, creditHours: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl text-white text-sm focus:outline-none"
                    style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(0,180,216,0.55)'; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(107,70,193,0.25)'; }} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200/70">{t('semester')}</label>
                  <input value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}
                    placeholder={t('semesterPlaceholder')}
                    className="w-full px-4 py-2.5 rounded-xl text-white placeholder:text-purple-300/30 text-sm focus:outline-none"
                    style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(0,180,216,0.55)'; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(107,70,193,0.25)'; }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-purple-200/70">{t('academicYear')}</label>
                <input value={form.academicYear} onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))}
                  placeholder={t('academicYearPlaceholder')} dir="ltr"
                  className="w-full px-4 py-2.5 rounded-xl text-white placeholder:text-purple-300/30 text-sm focus:outline-none"
                  style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(0,180,216,0.55)'; }}
                  onBlur={e  => { e.target.style.borderColor = 'rgba(107,70,193,0.25)'; }} />
              </div>

              {/* Dynamic PLO dropdown — loaded live from the API per selected program */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-purple-200/70 flex items-center justify-between">
                  <span>{t('ploCourseLink')}</span>
                  {form.ploIds.length > 0 && (
                    <span className="text-cyan-400 text-[11px] font-bold">{form.ploIds.length} {t('plosSelectedCount')}</span>
                  )}
                </label>
                <div className="rounded-xl max-h-40 overflow-y-auto"
                  style={{ backgroundColor: 'rgba(26,13,52,0.55)', border: '1px solid rgba(107,70,193,0.25)' }}>
                  {plosLoading && (
                    <div className="flex items-center gap-2 px-4 py-3 text-purple-300/50 text-xs">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('loadingPlos')}
                    </div>
                  )}
                  {!plosLoading && plos.length === 0 && (
                    <p className="px-4 py-3 text-purple-300/35 text-xs">{t('noPlosForProgram')}</p>
                  )}
                  {!plosLoading && plos.map(plo => (
                    <label key={plo.id}
                      className="flex items-center gap-2.5 px-4 py-2 cursor-pointer hover:bg-white/[0.04] transition border-b border-white/[0.03] last:border-0">
                      <input type="checkbox" checked={form.ploIds.includes(plo.id)} onChange={() => togglePlo(plo.id)}
                        className="accent-cyan-500 w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-[11px] font-bold text-cyan-400 flex-shrink-0">{plo.code}</span>
                      <span className="text-xs text-purple-200/70 truncate">{plo.descriptionAr}</span>
                    </label>
                  ))}
                </div>
              </div>

              {apiError && (
                <div className="rounded-xl px-4 py-2.5 text-red-300 text-xs"
                  style={{ backgroundColor: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.28)' }}>
                  ⚠ {apiError}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-white/[0.07] flex items-center justify-end gap-3"
              style={{ backgroundColor: 'rgba(26,13,52,0.40)' }}>
              <button onClick={() => { setShowModal(false); setApiError(''); }}
                className="text-xs text-purple-300/60 hover:text-white glass glass-hover px-4 py-2 rounded-xl transition">
                {t('cancel')}
              </button>
              <button onClick={handleCreate} disabled={saving}
                className="btn-glow flex items-center gap-1.5 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-cyan-brand) 0%, var(--color-purple-light) 100%)' }}>
                {saving
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('saving')}</>
                  : <><Plus className="w-3.5 h-3.5" /> {t('add')}</>}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-sm relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-purple-300/40" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('courseSearch')}
            className="w-full pr-9 pl-4 py-2 rounded-xl text-sm text-white placeholder:text-purple-300/30 focus:outline-none"
            style={{ backgroundColor: 'rgba(26,13,52,0.80)', border: '1px solid rgba(107,70,193,0.25)' }}
            onFocus={e => { e.target.style.borderColor = 'rgba(0,180,216,0.5)'; }}
            onBlur={e =>  { e.target.style.borderColor = 'rgba(107,70,193,0.25)'; }}
          />
        </div>
        <div className="text-xs text-purple-300/50 mr-auto">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : `${courses.length} ${t('ofCount')} ${allCount}`}
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 text-white text-xs font-bold px-4 py-2 rounded-xl transition btn-glow flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--color-cyan-brand), var(--color-purple-light))' }}>
          <Plus className="w-3.5 h-3.5" /> {t('addCourse')}
        </button>
      </div>

      {/* Table */}
      {courses.length === 0 && !loading && (
        <EmptyState icon={BookOpen} text={t('noCoursesMatch')} />
      )}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07]"
                style={{ backgroundColor: 'rgba(26,13,52,0.60)' }}>
                <th className="text-right px-5 py-3 text-[11px] font-bold text-purple-300/60">{t('course')}</th>
                <th className="text-right px-5 py-3 text-[11px] font-bold text-purple-300/60">{t('courseCode')}</th>
                <th className="text-right px-5 py-3 text-[11px] font-bold text-purple-300/60">{t('program')}</th>
                <th className="text-right px-5 py-3 text-[11px] font-bold text-purple-300/60">{t('hours')}</th>
                <th className="text-right px-5 py-3 text-[11px] font-bold text-purple-300/60">{t('semester')}</th>
                <th className="text-right px-5 py-3 text-[11px] font-bold text-purple-300/60">{t('clos')}</th>
                <th className="text-right px-5 py-3 text-[11px] font-bold text-purple-300/60">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c, i) => {
                const prog = programMap[c.programId];
                return (
                  <tr key={c.id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.03] transition"
                    style={i % 2 === 0 ? {} : { backgroundColor: 'rgba(26,13,52,0.25)' }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(6,145,178,0.20)', border: '1px solid rgba(6,145,178,0.25)' }}>
                          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-white text-xs font-semibold">{lang === 'ar' ? c.nameAr : c.name}</p>
                          <p className="text-purple-300/40 text-[10px]" dir={lang === 'ar' ? 'ltr' : 'rtl'}>{lang === 'ar' ? c.name : c.nameAr}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-purple-300/60">{c.code}</td>
                    <td className="px-5 py-3">
                      {prog ? (
                        <span className="text-xs text-purple-200/60">{lang === 'ar' ? prog.nameAr : prog.name}</span>
                      ) : (
                        <span className="text-xs text-purple-300/30">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-purple-300/60">{c.creditHours}</td>
                    <td className="px-5 py-3 text-xs text-purple-300/60">{c.semester ?? '—'}</td>
                    <td className="px-5 py-3 text-xs text-purple-300/60">{c._count?.clos ?? 0}</td>
                    <td className="px-5 py-3">
                      <Link href={`/dashboard/${c.programId}/course/${c.id}`}
                        className="text-cyan-400 hover:text-cyan-300 transition">
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// COMPETENCY STANDARDS TAB
// ════════════════════════════════════════════════════════════

interface DomainThresholds { excellent: number; good: number; acceptable: number; }
interface DomainConfig {
  key: string; nameAr: string; nameEn: string; descriptionAr: string; descriptionEn: string;
  icon: React.ElementType; gradient: string;
  accentBg: string; accentBorder: string; accentText: string;
}

const RATING_LEVELS = [
  { key: 'excellent',  icon: Star,         descriptionAr: 'أداء استثنائي يتجاوز التوقعات',        descriptionEn: 'Exceptional performance that exceeds expectations',   bgColor: 'rgba(16,185,129,0.12)',  borderColor: 'rgba(16,185,129,0.30)',  textColor: '#34d399', barColor: '#10b981', badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  { key: 'good',       icon: TrendingUp,   descriptionAr: 'أداء يلبي المتطلبات بشكل واضح',         descriptionEn: 'Performance that clearly meets requirements',          bgColor: 'rgba(0,180,216,0.12)',   borderColor: 'rgba(0,180,216,0.30)',   textColor: '#00B4D8', barColor: '#00B4D8', badgeClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'          },
  { key: 'acceptable', icon: CheckCircle2, descriptionAr: 'أداء يستوفي الحد الأدنى المطلوب',        descriptionEn: 'Performance that meets the minimum required level',    bgColor: 'rgba(251,191,36,0.12)',  borderColor: 'rgba(251,191,36,0.30)',  textColor: '#fbbf24', barColor: '#f59e0b', badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30'       },
  { key: 'poor',       icon: AlertCircle,  descriptionAr: 'أداء لا يستوفي الحد الأدنى المطلوب',     descriptionEn: 'Performance that does not meet the minimum required level', bgColor: 'rgba(239,68,68,0.12)',   borderColor: 'rgba(239,68,68,0.30)',   textColor: '#f87171', barColor: '#ef4444', badgeClass: 'bg-red-500/15 text-red-400 border-red-500/30'             },
] as const satisfies readonly { key: TKey; icon: React.ElementType; descriptionAr: string; descriptionEn: string; bgColor: string; borderColor: string; textColor: string; barColor: string; badgeClass: string }[];

const DOMAIN_CONFIGS: DomainConfig[] = [
  { key: 'KNOWLEDGE',  nameAr: 'المعرفة والفهم',           nameEn: 'Knowledge & Understanding',    descriptionAr: 'قدرة الطالب على استيعاب المحتوى الأكاديمي والمفاهيم النظرية والتطبيقية',   descriptionEn: "The student's ability to grasp academic content and theoretical and applied concepts", icon: BookMarked,  gradient: 'from-brand-600 to-brand-500',  accentBg: 'rgba(107,70,193,0.15)', accentBorder: 'rgba(107,70,193,0.35)', accentText: '#A78BFA' },
  { key: 'SKILL',      nameAr: 'المهارات المعرفية والعملية', nameEn: 'Cognitive & Practical Skills', descriptionAr: 'قدرة الطالب على تطبيق المعرفة وتحليل المشكلات وتطوير حلول إبداعية',          descriptionEn: "The student's ability to apply knowledge, analyze problems, and develop creative solutions", icon: Target,      gradient: 'from-cyan-700 to-cyan-500',    accentBg: 'rgba(0,180,216,0.15)',   accentBorder: 'rgba(0,180,216,0.35)',   accentText: '#00B4D8' },
  { key: 'ATTITUDE',   nameAr: 'القيم والمواقف المهنية',   nameEn: 'Values & Professional Ethics', descriptionAr: 'التزام الطالب بالأخلاقيات المهنية والقيم الأكاديمية وتحمّل المسؤولية',       descriptionEn: "The student's commitment to professional ethics, academic values, and accountability", icon: Star,        gradient: 'from-violet-700 to-brand-500', accentBg: 'rgba(139,92,246,0.15)', accentBorder: 'rgba(139,92,246,0.35)', accentText: '#C4B5FD' },
  { key: 'COMPETENCY', nameAr: 'الجدارات المهنية العامة',  nameEn: 'General Professional Competencies', descriptionAr: 'مهارات التواصل والعمل الجماعي والقيادة والتطوير المهني المستمر',       descriptionEn: 'Communication, teamwork, leadership, and continuous professional development skills', icon: Award,       gradient: 'from-emerald-700 to-cyan-600', accentBg: 'rgba(16,185,129,0.15)', accentBorder: 'rgba(16,185,129,0.35)', accentText: '#34d399' },
];

const DEFAULT_THRESHOLDS: Record<string, DomainThresholds> = {
  KNOWLEDGE:  { excellent: 90, good: 75, acceptable: 60 },
  SKILL:      { excellent: 90, good: 75, acceptable: 60 },
  ATTITUDE:   { excellent: 85, good: 70, acceptable: 55 },
  COMPETENCY: { excellent: 90, good: 75, acceptable: 60 },
};

function CompetencyStandardsTab() {
  const { t, lang } = useLang();
  const [thresholds, setThresholds] = useState<Record<string, DomainThresholds>>(
    () => JSON.parse(JSON.stringify(DEFAULT_THRESHOLDS))
  );
  const [editingDomain, setEditingDomain]   = useState<string | null>(null);
  const [draftThresholds, setDraftThresholds] = useState<DomainThresholds | null>(null);
  const [savedDomains, setSavedDomains]     = useState<Set<string>>(new Set());
  const [viewMode, setViewMode]             = useState<'cards' | 'matrix'>('cards');

  function startEdit(key: string) {
    setEditingDomain(key);
    setDraftThresholds({ ...thresholds[key] });
  }
  function cancelEdit() { setEditingDomain(null); setDraftThresholds(null); }
  function saveEdit(key: string) {
    if (!draftThresholds) return;
    setThresholds(prev => ({ ...prev, [key]: { ...draftThresholds } }));
    setEditingDomain(null); setDraftThresholds(null);
    setSavedDomains(prev => { const s = new Set(prev); s.add(key); return s; });
    setTimeout(() => setSavedDomains(prev => { const s = new Set(prev); s.delete(key); return s; }), 2000);
  }
  function resetDomain(key: string) {
    setThresholds(prev => ({ ...prev, [key]: { ...DEFAULT_THRESHOLDS[key] } }));
    setEditingDomain(null); setDraftThresholds(null);
  }
  function resetAll() {
    setThresholds(JSON.parse(JSON.stringify(DEFAULT_THRESHOLDS)));
    setEditingDomain(null); setDraftThresholds(null);
  }
  const draftInvalid = draftThresholds
    ? (draftThresholds.excellent <= draftThresholds.good || draftThresholds.good <= draftThresholds.acceptable)
    : false;

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-black text-white mb-1">{t('stdTitle')}</h2>
          <p className="text-purple-300/50 text-sm">{t('stdSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex glass rounded-xl overflow-hidden">
            {(['cards', 'matrix'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                className={`px-3 py-1.5 text-xs font-semibold transition ${viewMode === m ? 'text-white' : 'text-purple-300/50 hover:text-white'}`}
                style={viewMode === m ? { background: 'rgba(107,70,193,0.35)' } : {}}>
                {m === 'cards' ? t('cardView') : t('matrixView')}
              </button>
            ))}
          </div>
          <button onClick={resetAll}
            className="flex items-center gap-1.5 text-xs text-purple-300/60 hover:text-white glass glass-hover px-3 py-1.5 rounded-xl transition">
            <RotateCcw className="w-3.5 h-3.5" /> {t('resetAll')}
          </button>
        </div>
      </div>

      {/* ── Rating level legend ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {RATING_LEVELS.map(r => {
          const Icon = r.icon;
          return (
            <div key={r.key} className="rounded-2xl p-4 flex flex-col gap-2"
              style={{ backgroundColor: r.bgColor, border: `1px solid ${r.borderColor}` }}>
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: r.textColor }} />
                <span className="text-sm font-black" style={{ color: r.textColor }}>{t(r.key)}</span>
              </div>
              <p className="text-[11px] text-purple-200/50 leading-snug">{lang === 'ar' ? r.descriptionAr : r.descriptionEn}</p>
            </div>
          );
        })}
      </div>

      {/* ── CARDS VIEW ── */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {DOMAIN_CONFIGS.map(domain => {
            const dth        = thresholds[domain.key];
            const isEditing  = editingDomain === domain.key;
            const draft      = isEditing ? draftThresholds! : dth;
            const Icon       = domain.icon;
            const isSaved    = savedDomains.has(domain.key);
            const primaryName   = lang === 'ar' ? domain.nameAr : domain.nameEn;
            const secondaryName = lang === 'ar' ? domain.nameEn : domain.nameAr;

            return (
              <div key={domain.key} className="glass rounded-2xl overflow-hidden card-glow">

                {/* Domain header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]"
                  style={{ backgroundColor: domain.accentBg }}>
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${domain.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <Icon className="w-[18px] h-[18px] text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm">{primaryName}</p>
                    <p className="text-purple-300/40 text-[10px]" dir={lang === 'ar' ? 'ltr' : 'rtl'}>{secondaryName}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isSaved && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> {t('savedBadge')}
                      </span>
                    )}
                    {isEditing ? (
                      <>
                        <button onClick={() => saveEdit(domain.key)} disabled={draftInvalid}
                          className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-40"
                          style={{ background: 'rgba(16,185,129,0.20)', border: '1px solid rgba(16,185,129,0.40)', color: '#34d399' }}>
                          <Save className="w-3 h-3" /> {t('save')}
                        </button>
                        <button onClick={cancelEdit}
                          className="text-[11px] font-semibold px-3 py-1.5 rounded-lg glass glass-hover text-purple-300/60 hover:text-white transition">
                          {t('cancel')}
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(domain.key)}
                          className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition"
                          style={{ background: domain.accentBg, border: `1px solid ${domain.accentBorder}`, color: domain.accentText }}>
                          <Edit className="w-3 h-3" /> {t('edit')}
                        </button>
                        <button onClick={() => resetDomain(domain.key)}
                          className="text-purple-300/35 hover:text-white transition p-1.5 rounded-lg hover:bg-white/5" title={t('resetDomain')}>
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <p className="text-purple-200/45 text-xs leading-relaxed">{lang === 'ar' ? domain.descriptionAr : domain.descriptionEn}</p>

                  {/* Threshold rows */}
                  <div className="space-y-2.5">
                    {(['excellent', 'good', 'acceptable'] as const).map((level, idx) => {
                      const rating = RATING_LEVELS[idx];
                      const val    = draft[level];
                      return (
                        <div key={level} className="flex items-center gap-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border w-14 text-center flex-shrink-0 ${rating.badgeClass}`}>
                            {t(rating.key)}
                          </span>
                          <span className="text-purple-300/35 text-[10px] flex-shrink-0">≥</span>

                          {isEditing ? (
                            <input type="number" min={0} max={100}
                              value={draftThresholds![level]}
                              onChange={e => {
                                const n = Math.min(100, Math.max(0, Number(e.target.value)));
                                setDraftThresholds(prev => prev ? { ...prev, [level]: n } : prev);
                              }}
                              className="w-16 text-center text-sm font-bold text-white rounded-lg py-1 focus:outline-none transition"
                              style={{
                                backgroundColor: 'rgba(26,13,52,0.80)',
                                border: `1px solid ${domain.accentBorder}`,
                                color: draftInvalid ? '#f87171' : 'white',
                              }}
                            />
                          ) : (
                            <span className="text-sm font-black w-12 flex-shrink-0" style={{ color: rating.textColor }}>
                              {val}%
                            </span>
                          )}

                          {/* Visual bar */}
                          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${val}%`, backgroundColor: rating.barColor, opacity: 0.70 }} />
                          </div>
                          <span className="text-[10px] text-purple-300/30 w-8 text-left flex-shrink-0">{val}%</span>
                        </div>
                      );
                    })}

                    {/* Poor — auto from acceptable threshold */}
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border w-14 text-center flex-shrink-0 ${RATING_LEVELS[3].badgeClass}`}>
                        {t(RATING_LEVELS[3].key)}
                      </span>
                      <span className="text-purple-300/35 text-[10px] flex-shrink-0">&lt;</span>
                      <span className="text-sm font-black w-12 flex-shrink-0" style={{ color: RATING_LEVELS[3].textColor }}>
                        {draft.acceptable}%
                      </span>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${draft.acceptable}%`, backgroundColor: RATING_LEVELS[3].barColor, opacity: 0.35 }} />
                      </div>
                      <span className="text-[10px] text-purple-300/30 w-8 text-left flex-shrink-0">—</span>
                    </div>
                  </div>

                  {/* Validation warning */}
                  {isEditing && draftInvalid && (
                    <div className="flex items-center gap-2 text-amber-300 text-[11px] font-medium px-3 py-2 rounded-xl"
                      style={{ backgroundColor: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.25)' }}>
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {t('sequenceWarning')}: {t('excellent')} &gt; {t('good')} &gt; {t('acceptable')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MATRIX VIEW ── */}
      {viewMode === 'matrix' && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.07]" style={{ backgroundColor: 'rgba(26,13,52,0.65)' }}>
                  <th className="text-right px-5 py-3.5 text-[11px] font-bold text-purple-300/60 min-w-[200px]">{t('domainCol')}</th>
                  {RATING_LEVELS.map(r => (
                    <th key={r.key} className="text-center px-5 py-3.5 text-[11px] font-bold whitespace-nowrap" style={{ color: r.textColor }}>
                      {t(r.key)}
                    </th>
                  ))}
                  <th className="px-4 py-3.5 w-12" />
                </tr>
              </thead>
              <tbody>
                {DOMAIN_CONFIGS.map((domain, i) => {
                  const dth  = thresholds[domain.key];
                  const Icon = domain.icon;
                  const primaryName   = lang === 'ar' ? domain.nameAr : domain.nameEn;
                  const secondaryName = lang === 'ar' ? domain.nameEn : domain.nameAr;
                  return (
                    <tr key={domain.key} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition"
                      style={i % 2 !== 0 ? { backgroundColor: 'rgba(26,13,52,0.25)' } : {}}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${domain.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-white text-xs font-bold">{primaryName}</p>
                            <p className="text-purple-300/40 text-[10px]" dir={lang === 'ar' ? 'ltr' : 'rtl'}>{secondaryName}</p>
                          </div>
                        </div>
                      </td>
                      {/* Excellent */}
                      <td className="px-5 py-4 text-center">
                        <span className="inline-block text-sm font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg">
                          ≥ {dth.excellent}%
                        </span>
                      </td>
                      {/* Good */}
                      <td className="px-5 py-4 text-center">
                        <span className="inline-block text-sm font-black px-3 py-1 rounded-lg"
                          style={{ color: '#00B4D8', backgroundColor: 'rgba(0,180,216,0.10)' }}>
                          {dth.good}–{dth.excellent - 1}%
                        </span>
                      </td>
                      {/* Acceptable */}
                      <td className="px-5 py-4 text-center">
                        <span className="inline-block text-sm font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg">
                          {dth.acceptable}–{dth.good - 1}%
                        </span>
                      </td>
                      {/* Poor */}
                      <td className="px-5 py-4 text-center">
                        <span className="inline-block text-sm font-black text-red-400 bg-red-500/10 px-3 py-1 rounded-lg">
                          &lt; {dth.acceptable}%
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button onClick={() => { setViewMode('cards'); startEdit(domain.key); }}
                          className="text-purple-300/40 hover:text-white transition">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── NCAAA notice ── */}
      <div className="glass rounded-xl px-5 py-3.5 flex items-start gap-3"
        style={{ borderColor: 'rgba(107,70,193,0.25)' }}>
        <Shield className="w-4 h-4 text-brand-300 flex-shrink-0 mt-0.5" />
        <p className="text-purple-200/45 text-xs leading-relaxed">
          {t('stdNotice')}
        </p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// REPORTS TAB
// ════════════════════════════════════════════════════════════
function ReportsTab({ programs }: { programs: Program[] }) {
  const { lang, t } = useLang();
  const academicYear = '2024-2025';

  return (
    <div className="space-y-6">
      <p className="text-purple-300/50 text-sm">{t('reportsSubtitle')}</p>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {programs.map(prog => {
          const st = ACC_STATUS[prog.accreditationStatus] ?? ACC_STATUS.NONE;
          return (
          <div key={prog.id} className="glass glass-hover card-glow rounded-2xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(107,70,193,0.25)', border: '1px solid rgba(107,70,193,0.30)' }}>
                <FileText className="w-4 h-4 text-brand-300" />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-bold">{lang === 'ar' ? prog.nameAr : prog.name}</p>
                <p className="text-purple-300/50 text-[10px] font-mono">{prog.code}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${st.badge}`}>
                {t(st.key)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <a href={`/api/reports/programs/${prog.id}/plo-attainment?academicYear=${academicYear}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition"
                style={{ backgroundColor: 'rgba(0,180,216,0.15)', border: '1px solid rgba(0,180,216,0.30)', color: '#00B4D8' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.backgroundColor = 'rgba(0,180,216,0.25)'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.backgroundColor = 'rgba(0,180,216,0.15)'; }}>
                <Download className="w-3 h-3" /> {t('ploAttainmentReport')}
              </a>
              <Link href={`/dashboard/${prog.id}?tab=attainment`}
                className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition"
                style={{ backgroundColor: 'rgba(107,70,193,0.15)', border: '1px solid rgba(107,70,193,0.30)', color: '#A78BFA' }}>
                <BarChart3 className="w-3 h-3" /> {t('detailedView')}
              </Link>
            </div>
          </div>
          );
        })}
      </div>

      {programs.length === 0 && <EmptyState icon={FileText} text={t('noReports')} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// USERS & PERMISSIONS TAB — المستخدمين والصلاحيات
// ════════════════════════════════════════════════════════════

interface ManagedUser {
  id: string; nameAr: string; nameEn: string; email: string; roleCode: string;
  departmentAr: string; departmentEn: string; status: 'ACTIVE' | 'INACTIVE';
}

const ROLE_CATALOG: { code: string; nameAr: string; nameEn: string; badge: string; permAr: string; permEn: string }[] = [
  { code: 'UNIVERSITY_PRESIDENT', nameAr: 'رئيس الجامعة',                          nameEn: 'University President',  badge: 'bg-violet-600/20 text-violet-300 border-violet-600/30',
    permAr: 'التحكم الكامل بالنظام واعتماد القرارات الاستراتيجية', permEn: 'Full system control and strategic decision approval' },
  { code: 'VP_ACADEMIC',          nameAr: 'نائب رئيس الجامعة للشؤون الأكاديمية',     nameEn: 'VP Academic Affairs',   badge: 'bg-brand-600/20 text-brand-300 border-brand-600/30',
    permAr: 'الإشراف على جميع الشؤون الأكاديمية والبرامج عبر الكليات', permEn: 'Oversight of all academic affairs and programs across colleges' },
  { code: 'DEAN',                 nameAr: 'عميد الكلية',                           nameEn: 'College Dean',          badge: 'bg-cyan-600/20 text-cyan-300 border-cyan-600/30',
    permAr: 'إدارة برامج الكلية ومتابعة تقارير الاعتماد', permEn: 'Manage college programs and monitor accreditation reports' },
  { code: 'PROGRAM_DIRECTOR',     nameAr: 'مدير البرنامج الأكاديمي',                nameEn: 'Program Director',      badge: 'bg-emerald-600/20 text-emerald-300 border-emerald-600/30',
    permAr: 'إدارة المنهج الأكاديمي ومخرجات التعلم البرامجية (PLOs)', permEn: 'Manage curriculum and program learning outcomes (PLOs)' },
  { code: 'STANDARD_OFFICER',     nameAr: 'مسؤول المعيار',                         nameEn: 'Standard Officer',      badge: 'bg-amber-600/20 text-amber-300 border-amber-600/30',
    permAr: 'إدارة معايير الجدارة وعتبات الأداء', permEn: 'Manage competency standards and performance thresholds' },
  { code: 'COURSE_INSTRUCTOR',    nameAr: 'أستاذ المقرر',                          nameEn: 'Course Instructor',     badge: 'bg-slate-600/20 text-slate-300 border-slate-600/30',
    permAr: 'إدارة المقرر ودرجات الطلاب ومخرجات تعلم المقرر (CLOs)', permEn: 'Manage course, student grades, and course learning outcomes (CLOs)' },
  { code: 'QUALITY_COORDINATOR',  nameAr: 'منسق الجودة',                           nameEn: 'Quality Coordinator',   badge: 'bg-rose-600/20 text-rose-300 border-rose-600/30',
    permAr: 'مراجعة تقارير الاعتماد ومتابعة الامتثال للمعايير', permEn: 'Review accreditation reports and monitor standards compliance' },
];

function roleInfo(code: string) {
  return ROLE_CATALOG.find(r => r.code === code) ?? { code, nameAr: code, nameEn: code, badge: 'bg-slate-600/20 text-slate-300 border-slate-600/30', permAr: '', permEn: '' };
}

const SEED_USERS: ManagedUser[] = [
  { id: 'u1', nameAr: 'د. عبدالله الحربي', nameEn: 'Dr. Abdullah Al-Harbi', email: 'a.alharbi@sru.edu.sa',   roleCode: 'UNIVERSITY_PRESIDENT', departmentAr: 'مكتب رئيس الجامعة',       departmentEn: 'Office of the University President',      status: 'ACTIVE' },
  { id: 'u2', nameAr: 'د. منيرة السبيعي',  nameEn: 'Dr. Munira Al-Subaie',  email: 'm.alsubaie@sru.edu.sa',  roleCode: 'VP_ACADEMIC',          departmentAr: 'نيابة الشؤون الأكاديمية', departmentEn: 'Vice Presidency for Academic Affairs',     status: 'ACTIVE' },
  { id: 'u3', nameAr: 'د. فهد العنزي',     nameEn: 'Dr. Fahad Al-Anazi',    email: 'f.alanazi@sru.edu.sa',   roleCode: 'DEAN',                 departmentAr: 'كلية علوم الحاسب',        departmentEn: 'College of Computer Science',              status: 'ACTIVE' },
  { id: 'u4', nameAr: 'د. هند الدوسري',    nameEn: 'Dr. Hind Al-Dosari',    email: 'h.aldosari@sru.edu.sa',  roleCode: 'PROGRAM_DIRECTOR',     departmentAr: 'قسم علوم الحاسب',         departmentEn: 'Department of Computer Science',           status: 'ACTIVE' },
  { id: 'u5', nameAr: 'أ. ماجد القرني',    nameEn: 'Mr. Majed Al-Qarni',    email: 'm.alqarni@sru.edu.sa',   roleCode: 'STANDARD_OFFICER',     departmentAr: 'عمادة الجودة',            departmentEn: 'Deanship of Quality',                      status: 'ACTIVE' },
  { id: 'u6', nameAr: 'د. ريم الشهري',     nameEn: 'Dr. Reem Al-Shehri',    email: 'r.alshehri@sru.edu.sa',  roleCode: 'COURSE_INSTRUCTOR',    departmentAr: 'قسم علوم الحاسب',         departmentEn: 'Department of Computer Science',           status: 'ACTIVE' },
  { id: 'u7', nameAr: 'أ. بندر المطيري',   nameEn: 'Mr. Bandar Al-Mutairi', email: 'b.almutairi@sru.edu.sa', roleCode: 'QUALITY_COORDINATOR',  departmentAr: 'عمادة الجودة',            departmentEn: 'Deanship of Quality',                      status: 'INACTIVE' },
  { id: 'u8', nameAr: 'د. لمياء الغامدي',  nameEn: 'Dr. Lamia Al-Ghamdi',   email: 'l.alghamdi@sru.edu.sa',  roleCode: 'COURSE_INSTRUCTOR',    departmentAr: 'قسم الرياضيات',           departmentEn: 'Department of Mathematics',                status: 'ACTIVE' },
];

function UsersPermissionsTab() {
  const { t, lang } = useLang();
  const [users, setUsers] = useState<ManagedUser[]>(SEED_USERS);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nameAr: '', nameEn: '', email: '', roleCode: ROLE_CATALOG[5].code,
    departmentAr: '', departmentEn: '', status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });
  const [formError, setFormError] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  const filtered = users.filter(u => {
    const matchSearch = !search || u.nameAr.includes(search) || u.nameEn.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.roleCode === roleFilter;
    return matchSearch && matchRole;
  });

  function openAdd() {
    setEditId(null);
    setForm({ nameAr: '', nameEn: '', email: '', roleCode: ROLE_CATALOG[5].code, departmentAr: '', departmentEn: '', status: 'ACTIVE' });
    setFormError('');
    setShowModal(true);
  }

  function openEdit(u: ManagedUser) {
    setEditId(u.id);
    setForm({ nameAr: u.nameAr, nameEn: u.nameEn, email: u.email, roleCode: u.roleCode, departmentAr: u.departmentAr, departmentEn: u.departmentEn, status: u.status });
    setFormError('');
    setShowModal(true);
  }

  function handleSave() {
    if (!form.nameAr || !form.email) { setFormError(t('fillAll')); return; }
    if (editId) {
      setUsers(prev => prev.map(u => u.id === editId ? { ...u, ...form } : u));
    } else {
      setUsers(prev => [{ id: crypto.randomUUID(), ...form }, ...prev]);
    }
    setShowModal(false);
  }

  function deleteUser(id: string) {
    if (!confirm(t('deleteUserConfirm'))) return;
    setUsers(prev => prev.filter(u => u.id !== id));
  }

  function handleImport(rows: ExcelUserRow[]) {
    const imported: ManagedUser[] = rows.map(r => ({
      id: crypto.randomUUID(), nameAr: r.name, nameEn: r.name, email: r.email, roleCode: r.roleCode,
      departmentAr: r.department, departmentEn: r.department, status: 'ACTIVE',
    }));
    setUsers(prev => [...imported, ...prev]);
  }

  const inputCls = "w-full px-4 py-2.5 rounded-xl text-white placeholder:text-purple-300/30 text-sm focus:outline-none";
  const inputStyle = { backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' };

  return (
    <div className="space-y-5">
      {/* ── Add/Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(10,5,20,0.80)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md glass card-glow rounded-2xl overflow-hidden relative"
            style={{ border: '1px solid rgba(107,70,193,0.30)' }}>
            <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(107,70,193,0.7), rgba(0,180,216,0.7), transparent)' }} />
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]"
              style={{ backgroundColor: 'rgba(44,22,80,0.60)' }}>
              <h3 className="text-white font-black text-base">{editId ? t('editUser') : t('addUser')}</h3>
              <button onClick={() => { setShowModal(false); setFormError(''); }}
                className="text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200/70">{t('userName')} ({t('nameAr')}) *</label>
                  <input className={inputCls} style={inputStyle} value={form.nameAr}
                    placeholder="د. عبدالعزيز المالكي"
                    onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200/70">{t('userName')} ({t('nameEn')})</label>
                  <input className={inputCls} style={inputStyle} dir="ltr" value={form.nameEn}
                    placeholder="Dr. Abdulaziz Al-Malki"
                    onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-purple-200/70">{t('userEmail')} *</label>
                <input className={inputCls} style={inputStyle} dir="ltr" type="email" value={form.email}
                  placeholder="name@sru.edu.sa"
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200/70">{t('userRole')} *</label>
                  <select className={inputCls} style={inputStyle} value={form.roleCode}
                    onChange={e => setForm(f => ({ ...f, roleCode: e.target.value }))}>
                    {ROLE_CATALOG.map(r => (
                      <option key={r.code} value={r.code}>{lang === 'ar' ? r.nameAr : r.nameEn}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200/70">{t('userStatus')}</label>
                  <select className={inputCls} style={inputStyle} value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as 'ACTIVE' | 'INACTIVE' }))}>
                    <option value="ACTIVE">{t('statusActive')}</option>
                    <option value="INACTIVE">{t('statusInactive')}</option>
                  </select>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-xl px-3.5 py-2.5"
                style={{ backgroundColor: 'rgba(0,180,216,0.08)', border: '1px solid rgba(0,180,216,0.22)' }}>
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-cyan-400 text-[11px] font-bold">{t('rolePermissions')}</p>
                  <p className="text-purple-200/60 text-[11px] mt-0.5">
                    {lang === 'ar' ? roleInfo(form.roleCode).permAr : roleInfo(form.roleCode).permEn}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200/70">{t('deptAr')}</label>
                  <input className={inputCls} style={inputStyle} value={form.departmentAr}
                    placeholder="قسم علوم الحاسب"
                    onChange={e => setForm(f => ({ ...f, departmentAr: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200/70">{t('deptEn')}</label>
                  <input className={inputCls} style={inputStyle} dir="ltr" value={form.departmentEn}
                    placeholder="Department of Computer Science"
                    onChange={e => setForm(f => ({ ...f, departmentEn: e.target.value }))} />
                </div>
              </div>
              {formError && (
                <div className="rounded-xl px-4 py-2.5 text-red-300 text-xs"
                  style={{ backgroundColor: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.28)' }}>
                  ⚠ {formError}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-white/[0.07] flex items-center justify-end gap-3"
              style={{ backgroundColor: 'rgba(26,13,52,0.40)' }}>
              <button onClick={() => setShowModal(false)}
                className="text-xs text-purple-300/60 hover:text-white glass glass-hover px-4 py-2 rounded-xl transition">{t('cancel')}</button>
              <button onClick={handleSave}
                className="btn-glow flex items-center gap-1.5 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition"
                style={{ background: 'linear-gradient(135deg, var(--color-purple-light) 0%, var(--color-cyan-brand) 100%)' }}>
                <Save className="w-3.5 h-3.5" /> {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">{t('usersPermTitle')}</h2>
          <p className="text-purple-300/50 text-sm mt-0.5">{t('usersPermSubtitle')}</p>
        </div>
        <button onClick={() => setShowGuide(g => !g)}
          className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl transition flex-shrink-0"
          style={{ backgroundColor: 'rgba(0,180,216,0.14)', border: '1px solid rgba(0,180,216,0.30)', color: '#00B4D8' }}>
          <ShieldCheck className="w-3.5 h-3.5" /> {t('rolePermissionsGuide')}
        </button>
      </div>

      {/* Roles & Permissions Guide */}
      {showGuide && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.07]" style={{ backgroundColor: 'rgba(26,13,52,0.50)' }}>
            <p className="text-white text-sm font-bold">{t('rolePermissionsGuide')}</p>
            <p className="text-purple-300/50 text-[11px] mt-0.5">{t('rolePermissionsGuideSub')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
            {ROLE_CATALOG.map(r => (
              <div key={r.code} className="flex items-start gap-2.5 px-5 py-3" style={{ backgroundColor: 'rgba(26,13,52,0.35)' }}>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5 ${r.badge}`}>
                  {lang === 'ar' ? r.nameAr : r.nameEn}
                </span>
                <p className="text-purple-200/60 text-[11px] leading-snug">{lang === 'ar' ? r.permAr : r.permEn}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-purple-300/40" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('searchUsers')}
            className="w-full pr-9 pl-4 py-2 rounded-xl text-sm text-white placeholder:text-purple-300/30 focus:outline-none"
            style={{ backgroundColor: 'rgba(26,13,52,0.80)', border: '1px solid rgba(107,70,193,0.25)' }} />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="text-xs text-white py-2 px-3 rounded-xl focus:outline-none"
          style={{ backgroundColor: 'rgba(26,13,52,0.80)', border: '1px solid rgba(107,70,193,0.25)' }}>
          <option value="ALL">{t('allRoles')}</option>
          {ROLE_CATALOG.map(r => <option key={r.code} value={r.code}>{lang === 'ar' ? r.nameAr : r.nameEn}</option>)}
        </select>
        <span className="text-xs bg-amber-600/20 text-amber-300 border border-amber-600/30 px-3 py-1 rounded-full">
          {filtered.length} {t('userCount')}
        </span>
        <div className="flex items-center gap-2 mr-auto">
          <ImportExcelButton template="user" onImport={handleImport} useModal />
          <button onClick={openAdd}
            className="flex items-center gap-1.5 text-white text-xs font-bold px-4 py-2 rounded-xl transition btn-glow flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--color-purple-light), var(--color-cyan-brand))' }}>
            <UserPlus className="w-3.5 h-3.5" /> {t('addUser')}
          </button>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 && <EmptyState icon={Users} text={t('noUsersMatch')} />}
      <div className="space-y-2">
        {filtered.map(u => {
          const role = roleInfo(u.roleCode);
          const displayName = lang === 'ar' ? u.nameAr : (u.nameEn || u.nameAr);
          const displayDept = lang === 'ar' ? u.departmentAr : (u.departmentEn || u.departmentAr);
          return (
            <div key={u.id} className="glass glass-hover rounded-2xl px-5 py-3.5 flex items-center gap-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--color-purple-light), var(--color-cyan-brand))' }}>
                {displayName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{displayName}</p>
                <p className="text-purple-300/50 text-xs flex items-center gap-1" dir="ltr">
                  <Mail className="w-3 h-3" /> {u.email}
                </p>
              </div>
              {displayDept && (
                <span className="text-[10px] text-purple-300/50 hidden md:inline-block flex-shrink-0">{displayDept}</span>
              )}
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex-shrink-0 ${role.badge}`}
                title={lang === 'ar' ? role.permAr : role.permEn}>
                {lang === 'ar' ? role.nameAr : role.nameEn}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                u.status === 'ACTIVE'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
              }`}>
                {u.status === 'ACTIVE' ? t('statusActive') : t('statusInactive')}
              </span>
              <button onClick={() => openEdit(u)}
                className="text-purple-300/50 hover:text-white transition p-1.5 rounded-lg hover:bg-white/5 flex-shrink-0" title={t('assignRole')}>
                <ShieldCheck className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => deleteUser(u.id)}
                className="text-red-400/50 hover:text-red-400 transition p-1.5 rounded-lg hover:bg-red-500/10 flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// COLLEGE & DEPARTMENT MANAGEMENT
// ════════════════════════════════════════════════════════════
function CollegeDeptTab({
  colleges, departments, onRefresh,
}: { colleges: College[]; departments: Department[]; onRefresh: () => void }) {
  const { t } = useLang();
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  // College modal
  const [showCollegeModal, setShowCollegeModal] = useState(false);
  const [editCollegeId, setEditCollegeId] = useState<string | null>(null);
  const [collegeForm, setCollegeForm] = useState({ name: '', nameAr: '', code: '' });

  // Department modal
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editDeptId, setEditDeptId] = useState<string | null>(null);
  const [deptForm, setDeptForm] = useState({ name: '', nameAr: '', code: '', collegeId: '' });

  function openAddCollege() {
    setEditCollegeId(null);
    setCollegeForm({ name: '', nameAr: '', code: '' });
    setApiError('');
    setShowCollegeModal(true);
  }
  function openEditCollege(c: College) {
    setEditCollegeId(c.id);
    setCollegeForm({ name: c.name, nameAr: c.nameAr, code: c.code });
    setApiError('');
    setShowCollegeModal(true);
  }
  function openAddDept(collegeId: string) {
    setEditDeptId(null);
    setDeptForm({ name: '', nameAr: '', code: '', collegeId });
    setApiError('');
    setShowDeptModal(true);
  }
  function openEditDept(d: Department) {
    setEditDeptId(d.id);
    setDeptForm({ name: d.name, nameAr: d.nameAr, code: d.code, collegeId: d.college.id });
    setApiError('');
    setShowDeptModal(true);
  }

  async function saveCollege() {
    if (!collegeForm.nameAr || !collegeForm.name || !collegeForm.code) {
      setApiError(t('fillAll')); return;
    }
    setSaving(true); setApiError('');
    try {
      if (editCollegeId) {
        await updateCollegeApi(editCollegeId, collegeForm);
      } else {
        await createCollegeApi(collegeForm);
      }
      setShowCollegeModal(false);
      onRefresh();
    } catch (e: unknown) { setApiError(e instanceof Error ? e.message : t('saveFail')); }
    finally { setSaving(false); }
  }

  async function deleteCollege(id: string, deptCount: number) {
    if (deptCount > 0) { alert(t('cannotDeleteCollege')); return; }
    if (!confirm(t('deleteCollegeConfirm'))) return;
    try { await deleteCollegeApi(id); onRefresh(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : t('deleteFail')); }
  }

  async function saveDept() {
    if (!deptForm.nameAr || !deptForm.name || !deptForm.code || !deptForm.collegeId) {
      setApiError(t('fillAll')); return;
    }
    setSaving(true); setApiError('');
    try {
      if (editDeptId) {
        await updateDepartmentApi(editDeptId, { name: deptForm.name, nameAr: deptForm.nameAr, code: deptForm.code });
      } else {
        await createDepartmentApi(deptForm);
      }
      setShowDeptModal(false);
      onRefresh();
    } catch (e: unknown) { setApiError(e instanceof Error ? e.message : t('saveFail')); }
    finally { setSaving(false); }
  }

  async function deleteDept(id: string) {
    if (!confirm(t('deleteDeptConfirm'))) return;
    try { await deleteDepartmentApi(id); onRefresh(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : t('deleteFail')); }
  }

  const deptsByCollege = colleges.map(c => ({
    college: c,
    depts: departments.filter(d => d.college.id === c.id),
  }));

  const inputCls = "w-full px-4 py-2.5 rounded-xl text-white placeholder:text-purple-300/30 text-sm focus:outline-none";
  const inputStyle = { backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-white">{t('collegeDeptMgmt')}</h3>
          <p className="text-purple-300/50 text-xs mt-0.5">{t('collegeDeptSubtitle')}</p>
        </div>
        <button onClick={openAddCollege}
          className="flex items-center gap-1.5 text-white text-xs font-bold px-4 py-2 rounded-xl btn-glow"
          style={{ background: 'linear-gradient(135deg, var(--color-cyan-brand), var(--color-purple-light))' }}>
          <Plus className="w-3.5 h-3.5" /> {t('addCollege')}
        </button>
      </div>

      {colleges.length === 0 && (
        <EmptyState icon={Building2} text={t('noColleges')} />
      )}

      {deptsByCollege.map(({ college, depts }) => (
        <div key={college.id} className="glass rounded-2xl overflow-hidden">
          {/* College header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.07]"
            style={{ backgroundColor: 'rgba(26,13,52,0.55)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(107,70,193,0.25)', border: '1px solid rgba(107,70,193,0.35)' }}>
              <Building2 className="w-4 h-4 text-brand-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold">{college.nameAr}</p>
              <p className="text-purple-300/40 text-[10px]" dir="ltr">{college.name} · {college.code}</p>
            </div>
            <span className="text-[10px] text-purple-300/40">{depts.length} {t('deptUnit')}</span>
            <button onClick={() => openAddDept(college.id)}
              className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition"
              style={{ background: 'rgba(0,180,216,0.15)', border: '1px solid rgba(0,180,216,0.30)', color: '#00B4D8' }}>
              <Plus className="w-3 h-3" /> {t('deptShort')}
            </button>
            <button onClick={() => openEditCollege(college)}
              className="text-purple-300/50 hover:text-white transition p-1.5 rounded-lg hover:bg-white/5">
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => deleteCollege(college.id, college._count.departments)}
              className="text-red-400/50 hover:text-red-400 transition p-1.5 rounded-lg hover:bg-red-500/10">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Departments */}
          {depts.length === 0 ? (
            <div className="px-5 py-4 text-purple-300/30 text-xs">{t('noDepts')}</div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {depts.map(d => (
                <div key={d.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(0,180,216,0.15)', border: '1px solid rgba(0,180,216,0.25)' }}>
                    <GraduationCap className="w-3 h-3 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold">{d.nameAr}</p>
                    <p className="text-purple-300/40 text-[10px]" dir="ltr">{d.name} · {d.code}</p>
                  </div>
                  <button onClick={() => openEditDept(d)}
                    className="text-purple-300/40 hover:text-white transition p-1 rounded hover:bg-white/5">
                    <Edit className="w-3 h-3" />
                  </button>
                  <button onClick={() => deleteDept(d.id)}
                    className="text-red-400/40 hover:text-red-400 transition p-1 rounded hover:bg-red-500/10">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* College Modal */}
      {showCollegeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(10,5,20,0.80)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md glass card-glow rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(107,70,193,0.30)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]"
              style={{ backgroundColor: 'rgba(44,22,80,0.60)' }}>
              <h3 className="text-white font-black text-base">
                {editCollegeId ? t('editCollege') : t('addCollegeTitle')}
              </h3>
              <button onClick={() => setShowCollegeModal(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-purple-200/70">{t('nameAr')} *</label>
                <input className={inputCls} style={inputStyle} value={collegeForm.nameAr}
                  placeholder="كلية الأعمال"
                  onChange={e => setCollegeForm(f => ({ ...f, nameAr: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-purple-200/70">{t('nameEn')} *</label>
                <input className={inputCls} style={inputStyle} dir="ltr" value={collegeForm.name}
                  placeholder="College of Business"
                  onChange={e => setCollegeForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-purple-200/70">{t('courseCode')} *</label>
                <input className={inputCls + ' font-mono'} style={inputStyle} dir="ltr" value={collegeForm.code}
                  placeholder="BUS"
                  onChange={e => setCollegeForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
              </div>
              {apiError && (
                <div className="rounded-xl px-4 py-2.5 text-red-300 text-xs"
                  style={{ backgroundColor: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.28)' }}>
                  ⚠ {apiError}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-white/[0.07] flex items-center justify-end gap-3"
              style={{ backgroundColor: 'rgba(26,13,52,0.40)' }}>
              <button onClick={() => setShowCollegeModal(false)}
                className="text-xs text-purple-300/60 hover:text-white glass glass-hover px-4 py-2 rounded-xl transition">
                {t('cancel')}
              </button>
              <button onClick={saveCollege} disabled={saving}
                className="btn-glow flex items-center gap-1.5 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-cyan-brand) 0%, var(--color-purple-light) 100%)' }}>
                {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('saving')}</> : <><Save className="w-3.5 h-3.5" /> {t('save')}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(10,5,20,0.80)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md glass card-glow rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(107,70,193,0.30)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]"
              style={{ backgroundColor: 'rgba(44,22,80,0.60)' }}>
              <h3 className="text-white font-black text-base">
                {editDeptId ? t('editDept') : t('addDeptTitle')}
              </h3>
              <button onClick={() => setShowDeptModal(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-purple-200/70">{t('collegeLabel')} *</label>
                <select className={inputCls} style={inputStyle} value={deptForm.collegeId}
                  onChange={e => setDeptForm(f => ({ ...f, collegeId: e.target.value }))}>
                  <option value="">{t('selectCollege')}</option>
                  {colleges.map(c => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-purple-200/70">{t('nameAr')} *</label>
                <input className={inputCls} style={inputStyle} value={deptForm.nameAr}
                  placeholder="قسم المالية"
                  onChange={e => setDeptForm(f => ({ ...f, nameAr: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-purple-200/70">{t('nameEn')} *</label>
                <input className={inputCls} style={inputStyle} dir="ltr" value={deptForm.name}
                  placeholder="Department of Finance"
                  onChange={e => setDeptForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-purple-200/70">{t('courseCode')} *</label>
                <input className={inputCls + ' font-mono'} style={inputStyle} dir="ltr" value={deptForm.code}
                  placeholder="FIN"
                  onChange={e => setDeptForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
              </div>
              {apiError && (
                <div className="rounded-xl px-4 py-2.5 text-red-300 text-xs"
                  style={{ backgroundColor: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.28)' }}>
                  ⚠ {apiError}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-white/[0.07] flex items-center justify-end gap-3"
              style={{ backgroundColor: 'rgba(26,13,52,0.40)' }}>
              <button onClick={() => setShowDeptModal(false)}
                className="text-xs text-purple-300/60 hover:text-white glass glass-hover px-4 py-2 rounded-xl transition">
                {t('cancel')}
              </button>
              <button onClick={saveDept} disabled={saving}
                className="btn-glow flex items-center gap-1.5 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-cyan-brand) 0%, var(--color-purple-light) 100%)' }}>
                {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('saving')}</> : <><Save className="w-3.5 h-3.5" /> {t('save')}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SETTINGS TAB
// ════════════════════════════════════════════════════════════
function SettingsTab({ colleges, departments, onRefresh }: {
  colleges: College[]; departments: Department[]; onRefresh: () => void;
}) {
  const { t } = useLang();
  const [subTab, setSubTab] = useState<'system' | 'colleges'>('system');

  const sections = [
    {
      title: t('uniInfo'), icon: Building2, items: [
        { label: t('uniAr'),         value: 'جامعة سليمان الراجحي' },
        { label: t('uniEn'),         value: 'Sulaiman Alrajhi University' },
        { label: t('mainAccredBody'), value: 'NCAAA' },
        { label: t('currentYear'),   value: '2024-2025' },
      ],
    },
    {
      title: t('algoSettings'), icon: BarChart3, items: [
        { label: t('directCloWeight'), value: '80%' },
        { label: t('indirectWeight'),  value: '20%' },
        { label: t('defaultPassRate'), value: '70%' },
        { label: t('minStudents'),     value: `5 ${t('studentsUnit')}` },
      ],
    },
    {
      title: t('security'), icon: Shield, items: [
        { label: t('systemVersion'), value: 'Accred-IQ v1.0.0' },
        { label: t('database'),      value: 'PostgreSQL 18' },
        { label: t('authProvider'),  value: 'JWT / RS256' },
        { label: t('lastBackup'),    value: t('todayBackupTime') },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      {/* Sub-tab switcher */}
      <div className="flex gap-2">
        <button onClick={() => setSubTab('system')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${subTab === 'system' ? 'text-white' : 'text-purple-300/50 hover:text-white glass glass-hover'}`}
          style={subTab === 'system' ? { background: 'rgba(107,70,193,0.30)', border: '1px solid rgba(107,70,193,0.40)' } : {}}>
          {t('navSettings')}
        </button>
        <button onClick={() => setSubTab('colleges')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${subTab === 'colleges' ? 'text-white' : 'text-purple-300/50 hover:text-white glass glass-hover'}`}
          style={subTab === 'colleges' ? { background: 'rgba(0,180,216,0.20)', border: '1px solid rgba(0,180,216,0.35)' } : {}}>
          {t('collegeDeptMgmt')}
        </button>
      </div>

      {subTab === 'colleges' && (
        <CollegeDeptTab colleges={colleges} departments={departments} onRefresh={onRefresh} />
      )}

      {subTab === 'system' && (
        <div className="space-y-5 max-w-3xl">
          <p className="text-purple-300/50 text-sm">{t('settingsSubtitle')}</p>
          {sections.map(sec => {
            const Icon = sec.icon;
            return (
              <div key={sec.title} className="glass rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.07]"
                  style={{ backgroundColor: 'rgba(26,13,52,0.50)' }}>
                  <Icon className="w-4 h-4 text-brand-300" />
                  <h3 className="text-sm font-bold text-white">{sec.title}</h3>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {sec.items.map(item => (
                    <div key={item.label} className="flex items-center justify-between px-5 py-3">
                      <span className="text-purple-300/60 text-xs">{item.label}</span>
                      <span className="text-white text-xs font-semibold" dir="ltr">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Shared empty state ──────────────────────────────────────
function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="glass rounded-2xl py-16 flex flex-col items-center justify-center gap-3 text-center">
      <Icon className="w-10 h-10 text-purple-300/20" />
      <p className="text-purple-300/40 text-sm">{text}</p>
    </div>
  );
}
