import { PrismaClient, Action, PermissionScope } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// =========================================================
// ROLES DEFINITIONS
// =========================================================
const ROLES = [
  {
    code: 'UNIVERSITY_PRESIDENT',
    name: 'University President',
    nameAr: 'رئيس الجامعة',
    description: 'أعلى سلطة أكاديمية وإدارية في الجامعة',
    isSystem: true,
  },
  {
    code: 'VP_ACADEMIC',
    name: 'VP Academic Affairs',
    nameAr: 'نائب رئيس الجامعة للشؤون الأكاديمية',
    description: 'مسؤول عن جميع الشؤون الأكاديمية على مستوى الجامعة',
    isSystem: true,
  },
  {
    code: 'DEAN',
    name: 'College Dean',
    nameAr: 'عميد الكلية',
    description: 'مسؤول عن الكلية وبرامجها الأكاديمية',
    isSystem: true,
  },
  {
    code: 'PROGRAM_DIRECTOR',
    name: 'Academic Program Director',
    nameAr: 'مدير البرنامج الأكاديمي',
    description: 'مسؤول عن إدارة وتطوير البرنامج الأكاديمي',
    isSystem: true,
  },
  {
    code: 'STANDARD_OFFICER',
    name: 'Standard Officer',
    nameAr: 'مسؤول المعيار',
    description: 'مسؤول عن إدارة معيار اعتماد محدد',
    isSystem: true,
  },
  {
    code: 'COURSE_INSTRUCTOR',
    name: 'Course Instructor',
    nameAr: 'أستاذ المقرر',
    description: 'عضو هيئة التدريس المسؤول عن تدريس المقرر',
    isSystem: true,
  },
  {
    code: 'QUALITY_COORDINATOR',
    name: 'Quality Coordinator',
    nameAr: 'منسق الجودة',
    description: 'منسق عمليات الجودة والاعتماد الأكاديمي',
    isSystem: true,
  },
];

// =========================================================
// PERMISSIONS MATRIX PER ROLE
// =========================================================
type PermissionDef = {
  resource: string;
  action: Action;
  scope: PermissionScope;
  field?: string;
  allowed: boolean;
};

// جميع موارد النظام (المرحلتان الأولى والثانية والثالثة)
const ALL_RESOURCES = [
  'standard', 'course', 'program', 'report', 'user', 'competency',
  'accreditation', 'college', 'department', 'plo', 'clo', 'mapping',
  'assessment', 'grade', 'artifact', 'indirect_assessment',
] as const;

const PHASE2_RESOURCES = ['college', 'department', 'plo', 'clo', 'mapping'] as const;
const PHASE3_RESOURCES = ['assessment', 'grade', 'artifact', 'indirect_assessment'] as const;

const PERMISSIONS: Record<string, PermissionDef[]> = {
  UNIVERSITY_PRESIDENT: [
    // صلاحيات كاملة على جميع الموارد على مستوى الجامعة
    ...(ALL_RESOURCES).flatMap(
      (resource) =>
        ([Action.READ, Action.WRITE, Action.EDIT, Action.APPROVE, Action.AI_GENERATE] as Action[]).map(
          (action): PermissionDef => ({
            resource,
            action,
            scope: PermissionScope.UNIVERSITY,
            allowed: true,
          })
        )
    ),
  ],

  VP_ACADEMIC: [
    ...(['standard', 'course', 'program', 'report', 'accreditation', ...PHASE2_RESOURCES, ...PHASE3_RESOURCES] as const).flatMap(
      (resource) =>
        ([Action.READ, Action.WRITE, Action.EDIT, Action.APPROVE, Action.AI_GENERATE] as Action[]).map(
          (action): PermissionDef => ({
            resource,
            action,
            scope: PermissionScope.UNIVERSITY,
            allowed: true,
          })
        )
    ),
    { resource: 'user', action: Action.READ, scope: PermissionScope.UNIVERSITY, allowed: true },
  ],

  DEAN: [
    ...(['standard', 'course', 'program', 'report', 'accreditation', 'department', 'plo', 'clo', 'mapping', ...PHASE3_RESOURCES] as const).flatMap(
      (resource) =>
        ([Action.READ, Action.WRITE, Action.EDIT, Action.APPROVE, Action.AI_GENERATE] as Action[]).map(
          (action): PermissionDef => ({
            resource,
            action,
            scope: PermissionScope.COLLEGE,
            allowed: true,
          })
        )
    ),
    { resource: 'user', action: Action.READ, scope: PermissionScope.COLLEGE, allowed: true },
  ],

  PROGRAM_DIRECTOR: [
    ...(['standard', 'course', 'program', 'report', 'accreditation', 'plo', 'clo', 'mapping'] as const).flatMap(
      (resource) =>
        ([Action.READ, Action.WRITE, Action.EDIT, Action.AI_GENERATE] as Action[]).map(
          (action): PermissionDef => ({
            resource,
            action,
            scope: PermissionScope.DEPARTMENT,
            allowed: true,
          })
        )
    ),
    { resource: 'accreditation', action: Action.APPROVE, scope: PermissionScope.DEPARTMENT, allowed: true },
    // صلاحيات المرحلة الثالثة — مدير البرنامج يقرأ ويوافق على التقييمات
    { resource: 'assessment', action: Action.READ, scope: PermissionScope.DEPARTMENT, allowed: true },
    { resource: 'assessment', action: Action.WRITE, scope: PermissionScope.DEPARTMENT, allowed: true },
    { resource: 'grade', action: Action.READ, scope: PermissionScope.DEPARTMENT, allowed: true },
    { resource: 'grade', action: Action.WRITE, scope: PermissionScope.DEPARTMENT, allowed: true },
    { resource: 'artifact', action: Action.READ, scope: PermissionScope.DEPARTMENT, allowed: true },
    { resource: 'artifact', action: Action.WRITE, scope: PermissionScope.DEPARTMENT, allowed: true },
    { resource: 'indirect_assessment', action: Action.READ, scope: PermissionScope.DEPARTMENT, allowed: true },
  ],

  STANDARD_OFFICER: [
    { resource: 'standard', action: Action.READ, scope: PermissionScope.DEPARTMENT, allowed: true },
    { resource: 'standard', action: Action.WRITE, scope: PermissionScope.OWN, allowed: true },
    { resource: 'standard', action: Action.EDIT, scope: PermissionScope.OWN, allowed: true },
    { resource: 'standard', action: Action.AI_GENERATE, scope: PermissionScope.OWN, allowed: true },
    { resource: 'report', action: Action.READ, scope: PermissionScope.DEPARTMENT, allowed: true },
    { resource: 'report', action: Action.WRITE, scope: PermissionScope.OWN, allowed: true },
    { resource: 'course', action: Action.READ, scope: PermissionScope.DEPARTMENT, allowed: true },
    { resource: 'assessment', action: Action.READ, scope: PermissionScope.DEPARTMENT, allowed: true },
  ],

  COURSE_INSTRUCTOR: [
    { resource: 'course', action: Action.READ, scope: PermissionScope.OWN, allowed: true },
    { resource: 'course', action: Action.WRITE, scope: PermissionScope.OWN, allowed: true },
    { resource: 'course', action: Action.EDIT, scope: PermissionScope.OWN, allowed: true },
    { resource: 'course', action: Action.AI_GENERATE, scope: PermissionScope.OWN, allowed: true },
    { resource: 'standard', action: Action.READ, scope: PermissionScope.DEPARTMENT, allowed: true },
    { resource: 'plo', action: Action.READ, scope: PermissionScope.DEPARTMENT, allowed: true },
    { resource: 'clo', action: Action.READ, scope: PermissionScope.OWN, allowed: true },
    { resource: 'clo', action: Action.WRITE, scope: PermissionScope.OWN, allowed: true },
    { resource: 'clo', action: Action.EDIT, scope: PermissionScope.OWN, allowed: true },
    // صلاحيات المرحلة الثالثة — أستاذ المقرر
    { resource: 'assessment', action: Action.READ, scope: PermissionScope.OWN, allowed: true },
    { resource: 'assessment', action: Action.WRITE, scope: PermissionScope.OWN, allowed: true },
    { resource: 'assessment', action: Action.EDIT, scope: PermissionScope.OWN, allowed: true },
    { resource: 'grade', action: Action.READ, scope: PermissionScope.OWN, allowed: true },
    { resource: 'grade', action: Action.WRITE, scope: PermissionScope.OWN, allowed: true },
    { resource: 'artifact', action: Action.READ, scope: PermissionScope.OWN, allowed: true },
    { resource: 'artifact', action: Action.WRITE, scope: PermissionScope.OWN, allowed: true },
    { resource: 'artifact', action: Action.EDIT, scope: PermissionScope.OWN, allowed: true },
    { resource: 'indirect_assessment', action: Action.READ, scope: PermissionScope.OWN, allowed: true },
    { resource: 'indirect_assessment', action: Action.WRITE, scope: PermissionScope.OWN, allowed: true },
  ],

  QUALITY_COORDINATOR: [
    ...([
      'standard', 'course', 'program', 'report', 'accreditation', 'competency',
      'plo', 'clo', 'mapping', 'assessment', 'artifact', 'indirect_assessment',
    ] as const).flatMap(
      (resource) =>
        ([Action.READ, Action.WRITE, Action.EDIT, Action.AI_GENERATE] as Action[]).map(
          (action): PermissionDef => ({
            resource,
            action,
            scope: PermissionScope.COLLEGE,
            allowed: true,
          })
        )
    ),
    { resource: 'grade', action: Action.READ, scope: PermissionScope.COLLEGE, allowed: true },
  ],
};

// =========================================================
// DEFAULT COMPETENCY LEVELS
// =========================================================
const COMPETENCY_LEVELS = [
  {
    code: 'BEGINNER',
    name: 'Beginner',
    nameAr: 'مبتدئ',
    weight: 10.0,
    description: 'المستوى الأولي — يمتلك المعرفة النظرية الأساسية',
    order: 1,
    color: '#EF4444',
  },
  {
    code: 'DEVELOPING',
    name: 'Developing',
    nameAr: 'نامٍ',
    weight: 25.0,
    description: 'في طريق التطور — يطبق المعرفة بتوجيه مستمر',
    order: 2,
    color: '#F97316',
  },
  {
    code: 'PROFICIENT',
    name: 'Proficient',
    nameAr: 'متمكن',
    weight: 50.0,
    description: 'مستوى الكفاءة — يعمل باستقلالية وفاعلية',
    order: 3,
    color: '#EAB308',
  },
  {
    code: 'ADVANCED',
    name: 'Advanced',
    nameAr: 'متقدم',
    weight: 75.0,
    description: 'مستوى متقدم — يرشد الآخرين ويحل مشكلات معقدة',
    order: 4,
    color: '#22C55E',
  },
  {
    code: 'EXPERT',
    name: 'Expert',
    nameAr: 'خبير',
    weight: 100.0,
    description: 'مستوى الخبرة — مرجع في المجال يُسهم في تطوير المعايير',
    order: 5,
    color: '#3B82F6',
  },
];

// =========================================================
// SEED FUNCTION
// =========================================================
async function main() {
  console.log('🌱 بدء زرع البيانات الأولية...');

  // 1. Roles
  console.log('📋 إنشاء الأدوار الأكاديمية...');
  const createdRoles: Record<string, string> = {};
  for (const role of ROLES) {
    const created = await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name, nameAr: role.nameAr, description: role.description },
      create: role,
    });
    createdRoles[role.code] = created.id;
    console.log(`  ✅ ${role.nameAr}`);
  }

  // 2. Permissions
  // نستخدم findFirst + create/update بدلاً من upsert لأن Prisma
  // لا يدعم null في compound unique where clause بشكل موثوق
  console.log('🔐 إنشاء مصفوفة الصلاحيات...');
  for (const [roleCode, perms] of Object.entries(PERMISSIONS)) {
    const roleId = createdRoles[roleCode];
    for (const perm of perms) {
      const fieldValue = perm.field ?? null;
      const existing = await prisma.permission.findFirst({
        where: {
          roleId,
          resource: perm.resource,
          action: perm.action,
          scope: perm.scope,
          field: fieldValue,
        },
      });

      if (existing) {
        await prisma.permission.update({
          where: { id: existing.id },
          data: { allowed: perm.allowed },
        });
      } else {
        await prisma.permission.create({
          data: { roleId, ...perm, field: fieldValue },
        });
      }
    }
    console.log(`  ✅ صلاحيات دور: ${roleCode}`);
  }

  // 3. Competency Levels
  console.log('🎯 إنشاء مستويات الجدارة...');
  for (const level of COMPETENCY_LEVELS) {
    await prisma.competencyLevel.upsert({
      where: { code: level.code },
      update: level,
      create: level,
    });
    console.log(`  ✅ ${level.nameAr}`);
  }

  // 4. System Admin User
  console.log('👤 إنشاء مستخدم المدير...');
  const adminEmail = process.env.ADMIN_EMAIL ?? 'malmohaimeed@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@123456';
  const adminName = process.env.ADMIN_NAME ?? 'System Administrator';
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const presidentRoleId = createdRoles['UNIVERSITY_PRESIDENT'];
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      roleId: presidentRoleId,
    },
  });
  console.log(`  ✅ المستخدم: ${adminEmail}`);

  // 5. Sample Academic Structure (Phase 2)
  console.log('🏛️  إنشاء الهيكل الأكاديمي التجريبي...');

  const college = await prisma.college.upsert({
    where: { code: 'CS-COLLEGE' },
    update: {},
    create: { name: 'College of Computer Science', nameAr: 'كلية علوم الحاسب', code: 'CS-COLLEGE' },
  });
  console.log(`  ✅ كلية: ${college.nameAr}`);

  const department = await prisma.department.upsert({
    where: { code: 'CS-DEPT' },
    update: {},
    create: { name: 'Computer Science Department', nameAr: 'قسم علوم الحاسب', code: 'CS-DEPT', collegeId: college.id },
  });
  console.log(`  ✅ قسم: ${department.nameAr}`);

  const program = await prisma.program.upsert({
    where: { code: 'BSCS' },
    update: {},
    create: {
      name: 'Bachelor of Science in Computer Science',
      nameAr: 'بكالوريوس علوم الحاسب',
      code: 'BSCS',
      totalCreditHours: 132,
      departmentId: department.id,
      accreditationBody: 'NCAAA',
    },
  });
  console.log(`  ✅ برنامج: ${program.nameAr}`);

  const course = await prisma.course.upsert({
    where: { code: 'CS101' },
    update: {},
    create: {
      code: 'CS101',
      name: 'Introduction to Programming',
      nameAr: 'مقدمة في البرمجة',
      creditHours: 3,
      programId: program.id,
      semester: 'الفصل الأول',
      academicYear: '2024-2025',
    },
  });
  console.log(`  ✅ مقرر: ${course.nameAr}`);

  const plo = await prisma.programLearningOutcome.upsert({
    where: { programId_code: { programId: program.id, code: 'PLO-1' } },
    update: {},
    create: {
      code: 'PLO-1',
      description: 'Apply fundamental programming concepts to solve computational problems',
      descriptionAr: 'تطبيق مفاهيم البرمجة الأساسية لحل المسائل الحسابية',
      domain: 'SKILLS',
      programId: program.id,
      order: 1,
    },
  });
  console.log(`  ✅ PLO: ${plo.code}`);

  const clo = await prisma.courseLearningOutcome.upsert({
    where: { courseId_code: { courseId: course.id, code: 'CLO-1' } },
    update: {},
    create: {
      code: 'CLO-1',
      description: 'Write correct programs using variables, conditions, and loops',
      descriptionAr: 'كتابة برامج صحيحة باستخدام المتغيرات والشروط والحلقات',
      domain: 'SKILLS',
      courseId: course.id,
      order: 1,
    },
  });
  console.log(`  ✅ CLO: ${clo.code}`);

  await prisma.ploCloPloMapping.upsert({
    where: { ploId_cloId: { ploId: plo.id, cloId: clo.id } },
    update: {},
    create: { ploId: plo.id, cloId: clo.id, alignmentLevel: 'DIRECT', alignmentWeight: 3 },
  });
  console.log(`  ✅ ربط: ${plo.code} ↔ ${clo.code} (DIRECT)`);

  console.log('\n✅ اكتملت عملية زرع البيانات بنجاح!');
}

main()
  .catch((e) => {
    console.error('❌ خطأ في زرع البيانات:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
