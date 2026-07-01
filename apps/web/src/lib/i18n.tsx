'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export type Lang = 'ar' | 'en';

// ── Translations dictionary ──────────────────────────────────
const TRANSLATIONS = {
  ar: {
    // global
    appName: 'Accred-IQ',
    university: 'جامعة سليمان الراجحي',
    universityEn: 'Sulaiman Alrajhi University',
    langSwitch: 'English',
    logout: 'خروج',
    save: 'حفظ',
    cancel: 'إلغاء',
    add: 'إضافة',
    edit: 'تعديل',
    delete: 'حذف',
    saving: 'جارٍ الحفظ...',
    loading: 'جارٍ التحميل...',
    back: 'العودة',
    backToPrograms: 'العودة للبرامج',
    backToCourses: 'العودة للمقررات',
    fillAll: 'يرجى ملء جميع الحقول المطلوبة',
    exportPdf: 'تصدير تقرير PDF',
    search: 'بحث',
    refresh: 'تحديث',
    viewAll: 'عرض الكل',
    manage: 'إدارة',
    noData: 'لا توجد بيانات',
    comingSoon: 'سيتم تفعيل هذه الوحدة في المراحل القادمة',
    all: 'الكل',

    // landing
    loginBtn: 'تسجيل الدخول',
    heroTitle1: 'نظام Accred-IQ',
    heroTitle2: 'الأكاديمي المتكامل',
    heroDesc: 'منصة ذكية لإدارة الجودة الأكاديمية والاعتماد المؤسسي وقياس مخرجات التعلم المبني على الجدارات',
    heroStandards: 'متوافق مع معايير NCAAA و ABET',
    getStarted: 'ابدأ الآن',
    systemComponents: 'مكونات النظام',
    systemDesc: 'بنية متكاملة تغطي دورة الاعتماد الأكاديمي كاملاً',
    readyToStart: 'جاهز للبدء؟',
    loginToProceed: 'سجّل دخولك للوصول إلى لوحة التحكم الخاصة بك',
    allRights: 'جميع الحقوق محفوظة',
    devPhases: 'مراحل تطوير مكتملة',
    apiRoutes: 'مسار API',
    roles: 'أدوار أكاديمية',

    feat1Title: 'إدارة الاعتماد',
    feat1Text: 'متابعة متطلبات الاعتماد المؤسسي والبرامجي وفق معايير NCAAA',
    feat2Title: 'تحليل مخرجات التعلم',
    feat2Text: 'قياس تحقيق CLOs وPLOs بخوارزميات التقييم المباشر وغير المباشر',
    feat3Title: 'تقارير PDF احترافية',
    feat3Text: 'توليد ملف المقرر الكامل وتقارير الاعتماد بشكل آلي وفوري',
    feat4Title: 'إدارة الأدوار والصلاحيات',
    feat4Text: 'هرمية متكاملة من رئيس الجامعة حتى أستاذ المقرر مع صلاحيات دقيقة',
    feat5Title: 'مستويات الجدارة',
    feat5Text: 'ربط مخرجات التعلم بمستويات الجدارة المهنية الخمسة',
    feat6Title: 'الذكاء الاصطناعي',
    feat6Text: 'مساعد ذكي لتوليد تقارير التحسين وتحليل فجوات الاعتماد',

    // login
    backToHome: 'العودة للرئيسية',
    systemSubtitle: 'نظام الاعتماد الأكاديمي',
    loginTitle: 'تسجيل الدخول',
    loginSubtitle: 'أدخل بيانات حسابك للمتابعة',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'example@sru.edu.sa',
    passwordLabel: 'كلمة المرور',
    signinBtn: 'دخول',
    verifying: 'جارٍ التحقق...',
    loginFailed: 'فشل تسجيل الدخول',

    // admin sidebar
    navOverview: 'لوحة التحكم',
    navPrograms: 'البرامج الأكاديمية',
    navCourses: 'المقررات الدراسية',
    navStandards: 'معايير الجدارة',
    navReports: 'تقارير الاعتماد',
    navSettings: 'إعدادات النظام',
    adminPanel: 'لوحة الإدارة',
    sysAdmin: 'مدير النظام',

    // overview tab
    welcome: 'مرحباً',
    overviewSubtitle: 'هذه لوحة إدارة نظام Accred-IQ الأكاديمي',
    statPrograms: 'برنامج أكاديمي',
    statCourses: 'مقرر دراسي',
    statAccredited: 'برنامج معتمد NCAAA',
    statPlos: 'مخرج تعلم (PLO)',
    programsByStatus: 'البرامج حسب حالة الاعتماد',
    recentPrograms: 'أحدث البرامج المضافة',
    quickActions: 'إجراءات سريعة',
    managePrograms: 'إدارة البرامج',
    viewCourses: 'عرض المقررات',
    accreditationReports: 'تقارير الاعتماد',
    systemSettings: 'إعدادات النظام',
    noPrograms: 'لا توجد برامج بعد',

    // accreditation status
    accredited: 'معتمد',
    candidate: 'مرشح',
    initial: 'تمهيدي',
    none: 'غير محدد',

    // levels
    bachelor: 'بكالوريوس',
    master: 'ماجستير',
    doctorate: 'دكتوراه',
    diploma: 'دبلوم',
    allLevels: 'كل المستويات',
    allStatuses: 'كل الحالات',

    // programs tab
    addProgram: 'إضافة برنامج',
    addProgramTitle: 'إضافة برنامج أكاديمي جديد',
    programSearch: 'بحث باسم البرنامج أو الكود...',
    nameAr: 'الاسم بالعربية',
    nameEn: 'الاسم بالإنجليزية',
    deptAr: 'القسم بالعربية',
    deptEn: 'القسم بالإنجليزية',
    programCode: 'كود البرنامج',
    level: 'المستوى',
    creditHours: 'الساعات المعتمدة',
    accreditationBody: 'جهة الاعتماد',
    department: 'القسم الأكاديمي',
    loadingDepts: 'جارٍ تحميل الأقسام...',
    manageProgram: 'إدارة البرنامج',
    coursesCount: 'مقرر',
    hoursUnit: 'ساعة',
    noProgramsMatch: 'لا توجد برامج تطابق معايير البحث',
    createProgramFail: 'فشل إنشاء البرنامج',

    // courses tab
    addCourse: 'إضافة مقرر',
    addCourseTitle: 'إضافة مقرر دراسي جديد',
    courseSearch: 'بحث باسم المقرر أو الكود...',
    courseCode: 'الكود',
    hours: 'الساعات',
    semester: 'الفصل',
    semesterPlaceholder: 'الأول',
    academicYear: 'العام الأكاديمي',
    academicYearPlaceholder: '2024-2025',
    academicProgram: 'البرنامج الأكاديمي',
    noCoursesMatch: 'لا توجد مقررات تطابق البحث',
    createCourseFail: 'فشل إنشاء المقرر',
    program: 'البرنامج',
    clos: 'مخرجات التعلم',

    // program dashboard
    programs: 'البرامج',
    modulePlos: 'مخرجات البرنامج PLO',
    moduleCoursesNav: 'المقررات الدراسية',
    moduleAssessment: 'التقييمات',
    moduleAttainment: 'تحقيق المخرجات',
    moduleReports: 'تقارير الاعتماد',
    moduleEvidence: 'الأدلة الأكاديمية',
    moduleUsers: 'أعضاء هيئة التدريس',
    moduleOverview: 'نظرة عامة',
    creditHoursStat: 'ساعة معتمدة',
    accreditationBodyStat: 'جهة الاعتماد',
    mainModules: 'الوحدات الرئيسية',
    addPlo: 'إضافة مخرج',
    addPloTitle: 'إضافة مخرج تعلم PLO',
    ploCount: 'مخرجات',
    programLOs: 'مخرجات تعلم البرنامج (PLOs)',
    noPlOs: 'لا توجد PLOs مضافة بعد',
    addCourseBtn: 'إضافة مقرر',
    coursesTitle: 'المقررات الدراسية',
    noCourses: 'لا توجد مقررات مضافة بعد',
    manageCourseBtn: 'إدارة',
    coursesCountBadge: 'مقررات',
    createPloFail: 'فشل إنشاء المخرج',
    usersTitle: 'أعضاء هيئة التدريس والمستخدمون',
    usersSubtitle: 'المستخدمون المسجلون في نظام Accred-IQ',
    userCount: 'مستخدم',
    noUsers: 'لا يوجد مستخدمون في النظام بعد',

    // PLO/CLO domains
    domainKnowledge: 'معرفة',
    domainSkill: 'مهارة',
    domainAttitude: 'وجداني',
    domainCompetency: 'جدارة',
    domainAttitudeForm: 'قيم وجدانية',

    // CLO form
    cloCode: 'الكود',
    domain: 'المجال',
    descAr: 'الوصف بالعربية',
    descEn: 'الوصف بالإنجليزية',
    descArPlaceholder: 'يتمكن الطالب من...',
    descEnPlaceholder: 'Student will be able to...',
    targetBenchmark: 'نسبة الإتقان المستهدفة',
    benchmarkMin: '50% — حد أدنى',
    benchmarkMid: '75% — مقبول',
    benchmarkMax: '100%',
    targetBenchmarkStat: 'الإتقان المستهدف:',
    addCloTitle: 'إضافة مخرج تعلم CLO',
    editCloTitle: 'تعديل مخرج التعلم',
    addCloBtn: 'إضافة CLO',
    saveCloBtn: 'حفظ التعديلات',
    noClos: 'لا توجد مخرجات تعلم بعد',
    noClosSub: 'ابدأ بإضافة مخرجات التعلم الخاصة بهذا المقرر',
    closCount: 'مخرجات',
    closTitle: 'مخرجات تعلم المقرر (CLOs)',
    closSubtitle: 'ما يجب أن يتمكن الطالب من تحقيقه عند إتمام المقرر',
    addCloShort: 'إضافة CLO',
    saveFail: 'فشل الحفظ',

    // course overview
    courseInfo: 'معلومات المقرر',
    courseCode2: 'الكود',
    courseSemester: 'الفصل الدراسي',
    courseYear: 'العام الأكاديمي',
    courseHours: 'عدد الساعات',
    hoursUnit2: 'ساعات',
    cloDistribution: 'توزيع مجالات CLOs',
    noClosDist: 'لا توجد CLOs مضافة بعد',
    courseModules: 'وحدات إدارة المقرر',
    moduleClos: 'مخرجات التعلم CLOs',
    moduleRubrics: 'معايير الجدارة',

    // rubrics
    rubricsTitle: 'معايير الجدارة والتقييم (Rubrics)',
    rubricsSubtitle: 'مصفوفة تقييم الأداء لكل مخرج تعلم في هذا المقرر',
    addRubric: 'إضافة معيار',
    addRubricTitle: 'إضافة معيار جدارة جديد',
    editRubricTitle: 'تعديل معيار الجدارة',
    criterionAr: 'المعيار بالعربية',
    criterionEn: 'المعيار بالإنجليزية',
    criterionArPh: 'فهم المفاهيم الأساسية',
    criterionEnPh: 'Understanding core concepts',
    linkedClo: 'مخرج التعلم المرتبط',
    addCloFirst: '— أضف CLO أولاً —',
    weight: 'الوزن',
    perfLevels: 'وصف مستويات الأداء لهذا المعيار',
    perfLevelPh: 'وصف أداء مستوى',
    noRubrics: 'لا توجد معايير جدارة بعد',
    noRubricsSub: 'أضف معايير التقييم المرتبطة بمخرجات التعلم',
    totalWeight: 'مجموع الأوزان',
    weightComplete: '✓ مكتمل',
    addRubricBtn: 'إضافة معيار',
    saveRubricBtn: 'حفظ التعديلات',
    totalRow: 'الإجمالي',
    criterion: 'المعيار',
    excellent: 'ممتاز',
    good: 'جيد',
    acceptable: 'مقبول',
    poor: 'ضعيف',
    course: 'مقرر دراسي',

    // standards tab
    stdTitle: 'معايير تقييم الجدارات الأكاديمية',
    stdSubtitle: 'حدِّد عتبات الأداء لكل مجال جدارة وفق معايير NCAAA',
    cardView: 'بطاقات',
    matrixView: 'مصفوفة',
    resetAll: 'إعادة الضبط',
    resetDomain: 'إعادة ضبط',
    savedBadge: 'محفوظ',
    domainCol: 'مجال الجدارة',
    sequenceWarning: 'يجب أن تتسلسل القيم بالترتيب الصحيح',
    stdNotice: 'هذه المعايير مستندة إلى إطار الجودة الوطني للهيئة الوطنية للتقويم والاعتماد الأكاديمي (NCAAA). يُنصح بمراجعة العتبات مع مجلس البرنامج قبل تطبيقها في دورة التقييم السنوية.',

    // reports tab
    reportsSubtitle: 'تنزيل تقارير الاعتماد التلقائية لكل برنامج أو مقرر',
    ploAttainmentReport: 'تقرير PLO Attainment',
    detailedView: 'عرض تفصيلي',
    noReports: 'لا توجد برامج لعرض تقاريرها',

    // settings tab
    settingsSubtitle: 'إعدادات النظام (للقراءة فقط في هذه النسخة)',
    uniInfo: 'معلومات الجامعة',
    uniAr: 'اسم الجامعة (عربي)',
    uniEn: 'اسم الجامعة (إنجليزي)',
    mainAccredBody: 'جهة الاعتماد الرئيسية',
    currentYear: 'العام الأكاديمي الحالي',
    algoSettings: 'إعدادات الخوارزمية',
    directCloWeight: 'وزن التقييم المباشر CLO',
    indirectWeight: 'وزن التقييم غير المباشر',
    defaultPassRate: 'نسبة الاجتياز الافتراضية',
    minStudents: 'الحد الأدنى للطلاب',
    security: 'النظام والأمان',
    systemVersion: 'إصدار النظام',
    database: 'قاعدة البيانات',
    authProvider: 'مزود الاعتماد',
    lastBackup: 'آخر نسخ احتياطي',

    // users & permissions module
    navUsers: 'المستخدمين والصلاحيات',
    usersPermTitle: 'المستخدمين والصلاحيات',
    usersPermSubtitle: 'إدارة أعضاء هيئة التدريس ومديري النظام وتعيين الأدوار',
    addUser: 'إضافة مستخدم',
    editUser: 'تعديل المستخدم',
    userName: 'الاسم الكامل',
    userEmail: 'البريد الإلكتروني',
    userRole: 'الدور / الصلاحية',
    userDept: 'القسم / الجهة',
    userStatus: 'الحالة',
    statusActive: 'نشط',
    statusInactive: 'معطّل',
    searchUsers: 'بحث بالاسم أو البريد الإلكتروني...',
    allRoles: 'كل الأدوار',
    manageUsers: 'المستخدمين والصلاحيات',
    deleteUserConfirm: 'هل تريد حذف هذا المستخدم؟',
    noUsersMatch: 'لا يوجد مستخدمون يطابقون البحث',
    assignRole: 'تعيين الدور',

    // excel import
    importExcel: 'استيراد من Excel',
    importingExcel: 'جارٍ الاستيراد...',
    importedRows: 'تم استيراد البيانات بنجاح',

    // PLO ↔ Course / CLO weight mapping
    ploCourseLink: 'ربط المقرر بمخرجات البرنامج (PLOs)',
    loadingPlos: 'جارٍ تحميل مخرجات البرنامج...',
    noPlosForProgram: 'لا توجد مخرجات PLO لهذا البرنامج بعد',
    selectProgramFirst: 'اختر البرنامج الأكاديمي أولاً',
    plosSelectedCount: 'مخرج محدد',
    ploDetails: 'تفاصيل المخرج',
    hideDetails: 'إخفاء التفاصيل',
    closUnderPlo: 'مخرجات تعلم المقرر (CLOs) المرتبطة',
    addCloUnderPlo: 'إضافة CLO',
    academicWeight: 'الوزن الأكاديمي (%)',
    totalWeightSum: 'إجمالي الأوزان',
    weightWarning: 'يجب أن يساوي إجمالي أوزان مخرجات التعلم 100% بالضبط لحفظ الربط',
    weightOk: '✓ الإجمالي 100% — جاهز للحفظ',
    saveMapping: 'حفظ الربط',
    mappingSaved: '✓ تم حفظ الربط',
    noClosForPlo: 'لا توجد مخرجات تعلم مرتبطة بعد',

    // courses table
    actions: 'إجراءات',
    ofCount: 'من',

    // settings tab
    studentsUnit: 'طلاب',
    todayBackupTime: 'اليوم 03:00 ص',

    // college & department management
    collegeDeptMgmt: 'إدارة الكليات والأقسام',
    collegeDeptSubtitle: 'أضف أو عدّل الكليات والأقسام الأكاديمية',
    addCollege: 'إضافة كلية',
    addCollegeTitle: 'إضافة كلية جديدة',
    editCollege: 'تعديل الكلية',
    noColleges: 'لا توجد كليات مُضافة بعد',
    noDepts: 'لا توجد أقسام في هذه الكلية',
    deptUnit: 'قسم',
    deptShort: 'قسم',
    addDeptTitle: 'إضافة قسم جديد',
    editDept: 'تعديل القسم',
    collegeLabel: 'الكلية',
    selectCollege: '— اختر كلية —',
    deleteCollegeConfirm: 'هل تريد حذف هذه الكلية؟',
    deleteDeptConfirm: 'هل تريد حذف هذا القسم؟',
    cannotDeleteCollege: 'لا يمكن حذف الكلية لوجود أقسام مرتبطة بها',
    deleteFail: 'فشل الحذف',

    // excel import modal
    importModalTitle: 'استيراد بيانات من Excel',
    importModalDesc: 'حمّل نموذج الاستيراد الرسمي، عبّئه ببياناتك، ثم ارفعه هنا',
    downloadTemplate: 'تحميل نموذج الاكسل',
    dropFileHere: 'اسحب الملف هنا أو انقر للاختيار',
    acceptedFormats: 'الصيغ المدعومة: xlsx, xls, csv',
    selectedFile: 'الملف المحدد',

    // role permissions
    rolePermissions: 'صلاحيات الدور',
    rolePermissionsGuide: 'دليل الأدوار والصلاحيات',
    rolePermissionsGuideSub: 'الصلاحيات الممنوحة لكل دور وظيفي في النظام',
  },

  en: {
    // global
    appName: 'Accred-IQ',
    university: 'Sulaiman Alrajhi University',
    universityEn: 'Sulaiman Alrajhi University',
    langSwitch: 'العربية',
    logout: 'Logout',
    save: 'Save',
    cancel: 'Cancel',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    saving: 'Saving...',
    loading: 'Loading...',
    back: 'Back',
    backToPrograms: 'Back to Programs',
    backToCourses: 'Back to Courses',
    fillAll: 'Please fill all required fields',
    exportPdf: 'Export PDF Report',
    search: 'Search',
    refresh: 'Refresh',
    viewAll: 'View All',
    manage: 'Manage',
    noData: 'No data available',
    comingSoon: 'This module will be activated in upcoming phases',
    all: 'All',

    // landing
    loginBtn: 'Sign In',
    heroTitle1: 'Accred-IQ System',
    heroTitle2: 'Academic Management Platform',
    heroDesc: 'A smart platform for academic quality management, institutional accreditation, and competency-based learning outcome measurement',
    heroStandards: 'Compliant with NCAAA and ABET standards',
    getStarted: 'Get Started',
    systemComponents: 'System Components',
    systemDesc: 'An integrated architecture covering the full academic accreditation cycle',
    readyToStart: 'Ready to Start?',
    loginToProceed: 'Sign in to access your control panel',
    allRights: 'All rights reserved',
    devPhases: 'Development phases completed',
    apiRoutes: 'API routes',
    roles: 'Academic roles',

    feat1Title: 'Accreditation Management',
    feat1Text: 'Track institutional and program accreditation requirements per NCAAA standards',
    feat2Title: 'Learning Outcome Analytics',
    feat2Text: 'Measure CLO/PLO attainment using direct and indirect assessment algorithms',
    feat3Title: 'Professional PDF Reports',
    feat3Text: 'Auto-generate complete course files and accreditation reports instantly',
    feat4Title: 'Roles & Permissions',
    feat4Text: 'Complete hierarchy from University President to Course Instructor with precise permissions',
    feat5Title: 'Competency Levels',
    feat5Text: 'Link learning outcomes to five professional competency levels',
    feat6Title: 'Artificial Intelligence',
    feat6Text: 'Smart assistant for generating improvement reports and analyzing accreditation gaps',

    // login
    backToHome: 'Back to Home',
    systemSubtitle: 'Academic Accreditation System',
    loginTitle: 'Sign In',
    loginSubtitle: 'Enter your credentials to continue',
    emailLabel: 'Email Address',
    emailPlaceholder: 'example@sru.edu.sa',
    passwordLabel: 'Password',
    signinBtn: 'Sign In',
    verifying: 'Verifying...',
    loginFailed: 'Login failed',

    // admin sidebar
    navOverview: 'Dashboard',
    navPrograms: 'Academic Programs',
    navCourses: 'Courses',
    navStandards: 'Competency Standards',
    navReports: 'Accreditation Reports',
    navSettings: 'System Settings',
    adminPanel: 'Admin Panel',
    sysAdmin: 'System Administrator',

    // overview
    welcome: 'Welcome',
    overviewSubtitle: 'This is the Accred-IQ Academic Administration Dashboard',
    statPrograms: 'Academic Programs',
    statCourses: 'Courses',
    statAccredited: 'NCAAA Accredited',
    statPlos: 'Learning Outcome (PLO)',
    programsByStatus: 'Programs by Accreditation Status',
    recentPrograms: 'Recently Added Programs',
    quickActions: 'Quick Actions',
    managePrograms: 'Manage Programs',
    viewCourses: 'View Courses',
    accreditationReports: 'Accreditation Reports',
    systemSettings: 'System Settings',
    noPrograms: 'No programs yet',

    // accreditation status
    accredited: 'Accredited',
    candidate: 'Candidate',
    initial: 'Initial',
    none: 'Not Specified',

    // levels
    bachelor: 'Bachelor',
    master: 'Master',
    doctorate: 'Doctorate',
    diploma: 'Diploma',
    allLevels: 'All Levels',
    allStatuses: 'All Statuses',

    // programs tab
    addProgram: 'Add Program',
    addProgramTitle: 'Add New Academic Program',
    programSearch: 'Search by program name or code...',
    nameAr: 'Arabic Name',
    nameEn: 'English Name',
    deptAr: 'Department (Arabic)',
    deptEn: 'Department (English)',
    programCode: 'Program Code',
    level: 'Level',
    creditHours: 'Credit Hours',
    accreditationBody: 'Accreditation Body',
    department: 'Academic Department',
    loadingDepts: 'Loading departments...',
    manageProgram: 'Manage Program',
    coursesCount: 'course',
    hoursUnit: 'hours',
    noProgramsMatch: 'No programs match your search criteria',
    createProgramFail: 'Failed to create program',

    // courses tab
    addCourse: 'Add Course',
    addCourseTitle: 'Add New Course',
    courseSearch: 'Search by course name or code...',
    courseCode: 'Code',
    hours: 'Hours',
    semester: 'Semester',
    semesterPlaceholder: 'First',
    academicYear: 'Academic Year',
    academicYearPlaceholder: '2024-2025',
    academicProgram: 'Academic Program',
    noCoursesMatch: 'No courses match your search',
    createCourseFail: 'Failed to create course',
    program: 'Program',
    clos: 'CLOs',

    // program dashboard
    programs: 'Programs',
    modulePlos: 'Program Learning Outcomes PLO',
    moduleCoursesNav: 'Courses',
    moduleAssessment: 'Assessments',
    moduleAttainment: 'Outcome Attainment',
    moduleReports: 'Accreditation Reports',
    moduleEvidence: 'Academic Evidence',
    moduleUsers: 'Faculty Members',
    moduleOverview: 'Overview',
    creditHoursStat: 'Credit Hours',
    accreditationBodyStat: 'Accreditation Body',
    mainModules: 'Main Modules',
    addPlo: 'Add Outcome',
    addPloTitle: 'Add Program Learning Outcome (PLO)',
    ploCount: 'outcomes',
    programLOs: 'Program Learning Outcomes (PLOs)',
    noPlOs: 'No PLOs added yet',
    addCourseBtn: 'Add Course',
    coursesTitle: 'Courses',
    noCourses: 'No courses added yet',
    manageCourseBtn: 'Manage',
    coursesCountBadge: 'courses',
    createPloFail: 'Failed to create PLO',
    usersTitle: 'Faculty Members & Users',
    usersSubtitle: 'Users registered in Accred-IQ',
    userCount: 'user',
    noUsers: 'No users in the system yet',

    // domains
    domainKnowledge: 'Knowledge',
    domainSkill: 'Skill',
    domainAttitude: 'Attitude',
    domainCompetency: 'Competency',
    domainAttitudeForm: 'Values & Attitude',

    // CLO form
    cloCode: 'Code',
    domain: 'Domain',
    descAr: 'Arabic Description',
    descEn: 'English Description',
    descArPlaceholder: 'The student will be able to...',
    descEnPlaceholder: 'Student will be able to...',
    targetBenchmark: 'Target Mastery Rate',
    benchmarkMin: '50% — Minimum',
    benchmarkMid: '75% — Acceptable',
    benchmarkMax: '100%',
    targetBenchmarkStat: 'Target:',
    addCloTitle: 'Add Course Learning Outcome (CLO)',
    editCloTitle: 'Edit Learning Outcome',
    addCloBtn: 'Add CLO',
    saveCloBtn: 'Save Changes',
    noClos: 'No learning outcomes yet',
    noClosSub: 'Start by adding learning outcomes for this course',
    closCount: 'outcomes',
    closTitle: 'Course Learning Outcomes (CLOs)',
    closSubtitle: 'What students must achieve upon completing this course',
    addCloShort: 'Add CLO',
    saveFail: 'Save failed',

    // course overview
    courseInfo: 'Course Information',
    courseCode2: 'Code',
    courseSemester: 'Semester',
    courseYear: 'Academic Year',
    courseHours: 'Credit Hours',
    hoursUnit2: 'hours',
    cloDistribution: 'CLO Domain Distribution',
    noClosDist: 'No CLOs added yet',
    courseModules: 'Course Management Modules',
    moduleClos: 'Learning Outcomes CLOs',
    moduleRubrics: 'Competency Standards',

    // rubrics
    rubricsTitle: 'Competency Assessment Rubrics',
    rubricsSubtitle: 'Performance assessment matrix for each learning outcome in this course',
    addRubric: 'Add Criterion',
    addRubricTitle: 'Add New Competency Criterion',
    editRubricTitle: 'Edit Competency Criterion',
    criterionAr: 'Criterion (Arabic)',
    criterionEn: 'Criterion (English)',
    criterionArPh: 'Understanding core concepts',
    criterionEnPh: 'Understanding core concepts',
    linkedClo: 'Linked Learning Outcome',
    addCloFirst: '— Add a CLO first —',
    weight: 'Weight',
    perfLevels: 'Performance level descriptors for this criterion',
    perfLevelPh: 'Describe performance at',
    noRubrics: 'No competency criteria yet',
    noRubricsSub: 'Add assessment criteria linked to learning outcomes',
    totalWeight: 'Total Weight',
    weightComplete: '✓ Complete',
    addRubricBtn: 'Add Criterion',
    saveRubricBtn: 'Save Changes',
    totalRow: 'Total',
    criterion: 'Criterion',
    excellent: 'Excellent',
    good: 'Good',
    acceptable: 'Acceptable',
    poor: 'Poor',
    course: 'Course',

    // standards tab
    stdTitle: 'Academic Competency Assessment Standards',
    stdSubtitle: 'Set performance thresholds for each competency domain per NCAAA standards',
    cardView: 'Cards',
    matrixView: 'Matrix',
    resetAll: 'Reset All',
    resetDomain: 'Reset',
    savedBadge: 'Saved',
    domainCol: 'Competency Domain',
    sequenceWarning: 'Values must follow the correct order',
    stdNotice: 'These standards are based on the National Quality Framework of the National Commission for Academic Accreditation and Assessment (NCAAA). It is recommended to review thresholds with the program council before applying them to the annual assessment cycle.',

    // reports
    reportsSubtitle: 'Download automatic accreditation reports for each program or course',
    ploAttainmentReport: 'PLO Attainment Report',
    detailedView: 'Detailed View',
    noReports: 'No programs to display reports for',

    // settings
    settingsSubtitle: 'System settings (read-only in this version)',
    uniInfo: 'University Information',
    uniAr: 'University Name (Arabic)',
    uniEn: 'University Name (English)',
    mainAccredBody: 'Primary Accreditation Body',
    currentYear: 'Current Academic Year',
    algoSettings: 'Algorithm Settings',
    directCloWeight: 'Direct CLO Assessment Weight',
    indirectWeight: 'Indirect Assessment Weight',
    defaultPassRate: 'Default Pass Rate',
    minStudents: 'Minimum Students',
    security: 'System & Security',
    systemVersion: 'System Version',
    database: 'Database',
    authProvider: 'Auth Provider',
    lastBackup: 'Last Backup',

    // users & permissions module
    navUsers: 'Users & Permissions',
    usersPermTitle: 'Users & Permissions',
    usersPermSubtitle: 'Manage faculty members and system administrators, and assign roles',
    addUser: 'Add User',
    editUser: 'Edit User',
    userName: 'Full Name',
    userEmail: 'Email Address',
    userRole: 'Role / Permission',
    userDept: 'Department / Unit',
    userStatus: 'Status',
    statusActive: 'Active',
    statusInactive: 'Inactive',
    searchUsers: 'Search by name or email...',
    allRoles: 'All Roles',
    manageUsers: 'Users & Permissions',
    deleteUserConfirm: 'Delete this user?',
    noUsersMatch: 'No users match your search',
    assignRole: 'Assign Role',

    // excel import
    importExcel: 'Import from Excel',
    importingExcel: 'Importing...',
    importedRows: 'Data imported successfully',

    // PLO ↔ Course / CLO weight mapping
    ploCourseLink: 'Link Course to Program Outcomes (PLOs)',
    loadingPlos: 'Loading program outcomes...',
    noPlosForProgram: 'No PLOs for this program yet',
    selectProgramFirst: 'Select the academic program first',
    plosSelectedCount: 'outcomes selected',
    ploDetails: 'Outcome Details',
    hideDetails: 'Hide Details',
    closUnderPlo: 'Linked Course Learning Outcomes (CLOs)',
    addCloUnderPlo: 'Add CLO',
    academicWeight: 'Academic Weight (%)',
    totalWeightSum: 'Total Weight',
    weightWarning: 'Total CLO weight must equal exactly 100% to save the mapping',
    weightOk: '✓ Total is 100% — ready to save',
    saveMapping: 'Save Mapping',
    mappingSaved: '✓ Mapping saved',
    noClosForPlo: 'No linked learning outcomes yet',

    // courses table
    actions: 'Actions',
    ofCount: 'of',

    // settings tab
    studentsUnit: 'students',
    todayBackupTime: 'Today 03:00 AM',

    // college & department management
    collegeDeptMgmt: 'College & Department Management',
    collegeDeptSubtitle: 'Add or edit academic colleges and departments',
    addCollege: 'Add College',
    addCollegeTitle: 'Add New College',
    editCollege: 'Edit College',
    noColleges: 'No colleges added yet',
    noDepts: 'No departments in this college',
    deptUnit: 'dept.',
    deptShort: 'Dept',
    addDeptTitle: 'Add New Department',
    editDept: 'Edit Department',
    collegeLabel: 'College',
    selectCollege: '— Select College —',
    deleteCollegeConfirm: 'Delete this college?',
    deleteDeptConfirm: 'Delete this department?',
    cannotDeleteCollege: 'Cannot delete college — it has linked departments',
    deleteFail: 'Delete failed',

    // excel import modal
    importModalTitle: 'Import Data from Excel',
    importModalDesc: 'Download the official import template, fill it with your data, then upload it here',
    downloadTemplate: 'Download Excel Template',
    dropFileHere: 'Drag file here or click to browse',
    acceptedFormats: 'Supported formats: xlsx, xls, csv',
    selectedFile: 'Selected file',

    // role permissions
    rolePermissions: 'Role Permissions',
    rolePermissionsGuide: 'Roles & Permissions Guide',
    rolePermissionsGuideSub: 'Permissions granted to each functional role in the system',
  },
} as const;

export type TKey = keyof typeof TRANSLATIONS.ar;

// ── Context ──────────────────────────────────────────────────
interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
  dir: 'rtl' | 'ltr';
}

const LangContext = createContext<LangContextValue>({
  lang: 'ar',
  setLang: () => {},
  t: (k) => TRANSLATIONS.ar[k] as string,
  dir: 'rtl',
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar');

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== 'undefined') {
      localStorage.setItem('accrediq_lang', l);
      document.documentElement.lang = l;
      document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('accrediq_lang') as Lang | null;
    if (saved && (saved === 'ar' || saved === 'en')) {
      setLang(saved);
    }
  }, [setLang]);

  const t = useCallback(
    (key: TKey): string => (TRANSLATIONS[lang] as Record<TKey, string>)[key] ?? (TRANSLATIONS.ar as Record<TKey, string>)[key] ?? key,
    [lang],
  );

  const dir: 'rtl' | 'ltr' = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <LangContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
