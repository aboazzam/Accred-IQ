-- CreateEnum
CREATE TYPE "Action" AS ENUM ('READ', 'WRITE', 'EDIT', 'APPROVE', 'AI_GENERATE');

-- CreateEnum
CREATE TYPE "PermissionScope" AS ENUM ('OWN', 'DEPARTMENT', 'COLLEGE', 'UNIVERSITY');

-- CreateEnum
CREATE TYPE "LearningDomain" AS ENUM ('KNOWLEDGE', 'SKILLS', 'VALUES', 'COMMUNICATION', 'CRITICAL_THINKING');

-- CreateEnum
CREATE TYPE "AlignmentLevel" AS ENUM ('DIRECT', 'PARTIAL', 'INDIRECT', 'NONE');

-- CreateEnum
CREATE TYPE "AccreditationStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'CONDITIONAL', 'ACCREDITED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ProgramLevel" AS ENUM ('DIPLOMA', 'BACHELOR', 'MASTER', 'DOCTORATE');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('MIDTERM', 'FINAL', 'QUIZ', 'ASSIGNMENT', 'PROJECT', 'PRESENTATION', 'LAB');

-- CreateEnum
CREATE TYPE "ArtifactCategory" AS ENUM ('HIGHEST', 'AVERAGE', 'LOWEST', 'RUBRIC', 'SOLUTION');

-- CreateEnum
CREATE TYPE "IndirectAssessmentType" AS ENUM ('STUDENT_SURVEY', 'ALUMNI_SURVEY', 'EMPLOYER_SURVEY', 'EXIT_SURVEY');

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" "Action" NOT NULL,
    "scope" "PermissionScope" NOT NULL DEFAULT 'OWN',
    "field" TEXT,
    "allowed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competency_levels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competency_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colleges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "deanId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "colleges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "headId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "level" "ProgramLevel" NOT NULL DEFAULT 'BACHELOR',
    "totalCreditHours" INTEGER NOT NULL,
    "departmentId" TEXT NOT NULL,
    "directorId" TEXT,
    "accreditationBody" TEXT,
    "accreditationStatus" "AccreditationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "accreditationExpiry" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "creditHours" INTEGER NOT NULL,
    "programId" TEXT NOT NULL,
    "instructorId" TEXT,
    "semester" TEXT,
    "academicYear" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_learning_outcomes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "domain" "LearningDomain" NOT NULL,
    "targetLevelId" TEXT,
    "programId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_learning_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_learning_outcomes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "domain" "LearningDomain" NOT NULL,
    "targetLevelId" TEXT,
    "courseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "targetBenchmark" DOUBLE PRECISION NOT NULL DEFAULT 70,
    "achievementThreshold" DOUBLE PRECISION NOT NULL DEFAULT 60,

    CONSTRAINT "course_learning_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plo_clo_mapping" (
    "id" TEXT NOT NULL,
    "ploId" TEXT NOT NULL,
    "cloId" TEXT NOT NULL,
    "alignmentLevel" "AlignmentLevel" NOT NULL DEFAULT 'NONE',
    "alignmentWeight" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plo_clo_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_methods" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "type" "AssessmentType" NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "semester" TEXT,
    "academicYear" TEXT,
    "conductedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_items" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "cloId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_grades" (
    "id" TEXT NOT NULL,
    "assessmentItemId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_artifacts" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "category" "ArtifactCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSizeKb" INTEGER,
    "studentId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "academicYear" TEXT,
    "semester" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indirect_assessments" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "type" "IndirectAssessmentType" NOT NULL,
    "title" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "responseCount" INTEGER NOT NULL DEFAULT 0,
    "conductedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indirect_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indirect_assessment_items" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "cloId" TEXT,
    "question" TEXT NOT NULL,
    "questionAr" TEXT,
    "averageScore" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indirect_assessment_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clo_attainment_results" (
    "id" TEXT NOT NULL,
    "cloId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "studentCount" INTEGER NOT NULL,
    "studentsAchieving" INTEGER NOT NULL,
    "directAttainment" DOUBLE PRECISION NOT NULL,
    "indirectAttainment" DOUBLE PRECISION,
    "overallAttainment" DOUBLE PRECISION NOT NULL,
    "achievementThreshold" DOUBLE PRECISION NOT NULL,
    "targetBenchmark" DOUBLE PRECISION NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calculatedById" TEXT,

    CONSTRAINT "clo_attainment_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "targetTable" TEXT NOT NULL,
    "targetId" TEXT,
    "targetComponent" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_nameAr_key" ON "roles"("nameAr");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_roleId_idx" ON "users"("roleId");

-- CreateIndex
CREATE INDEX "permissions_roleId_idx" ON "permissions"("roleId");

-- CreateIndex
CREATE INDEX "permissions_resource_action_idx" ON "permissions"("resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_roleId_resource_action_scope_field_key" ON "permissions"("roleId", "resource", "action", "scope", "field");

-- CreateIndex
CREATE UNIQUE INDEX "competency_levels_code_key" ON "competency_levels"("code");

-- CreateIndex
CREATE INDEX "competency_levels_order_idx" ON "competency_levels"("order");

-- CreateIndex
CREATE INDEX "competency_levels_isActive_idx" ON "competency_levels"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "colleges_code_key" ON "colleges"("code");

-- CreateIndex
CREATE INDEX "colleges_code_idx" ON "colleges"("code");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE INDEX "departments_collegeId_idx" ON "departments"("collegeId");

-- CreateIndex
CREATE UNIQUE INDEX "programs_code_key" ON "programs"("code");

-- CreateIndex
CREATE INDEX "programs_departmentId_idx" ON "programs"("departmentId");

-- CreateIndex
CREATE INDEX "programs_accreditationStatus_idx" ON "programs"("accreditationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- CreateIndex
CREATE INDEX "courses_programId_idx" ON "courses"("programId");

-- CreateIndex
CREATE INDEX "courses_instructorId_idx" ON "courses"("instructorId");

-- CreateIndex
CREATE INDEX "program_learning_outcomes_programId_idx" ON "program_learning_outcomes"("programId");

-- CreateIndex
CREATE INDEX "program_learning_outcomes_domain_idx" ON "program_learning_outcomes"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "program_learning_outcomes_programId_code_key" ON "program_learning_outcomes"("programId", "code");

-- CreateIndex
CREATE INDEX "course_learning_outcomes_courseId_idx" ON "course_learning_outcomes"("courseId");

-- CreateIndex
CREATE INDEX "course_learning_outcomes_domain_idx" ON "course_learning_outcomes"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "course_learning_outcomes_courseId_code_key" ON "course_learning_outcomes"("courseId", "code");

-- CreateIndex
CREATE INDEX "plo_clo_mapping_ploId_idx" ON "plo_clo_mapping"("ploId");

-- CreateIndex
CREATE INDEX "plo_clo_mapping_cloId_idx" ON "plo_clo_mapping"("cloId");

-- CreateIndex
CREATE UNIQUE INDEX "plo_clo_mapping_ploId_cloId_key" ON "plo_clo_mapping"("ploId", "cloId");

-- CreateIndex
CREATE INDEX "assessment_methods_courseId_idx" ON "assessment_methods"("courseId");

-- CreateIndex
CREATE INDEX "assessment_methods_type_idx" ON "assessment_methods"("type");

-- CreateIndex
CREATE INDEX "assessment_items_assessmentId_idx" ON "assessment_items"("assessmentId");

-- CreateIndex
CREATE INDEX "assessment_items_cloId_idx" ON "assessment_items"("cloId");

-- CreateIndex
CREATE INDEX "student_grades_assessmentItemId_idx" ON "student_grades"("assessmentItemId");

-- CreateIndex
CREATE INDEX "student_grades_studentId_idx" ON "student_grades"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "student_grades_assessmentItemId_studentId_key" ON "student_grades"("assessmentItemId", "studentId");

-- CreateIndex
CREATE INDEX "course_artifacts_courseId_idx" ON "course_artifacts"("courseId");

-- CreateIndex
CREATE INDEX "course_artifacts_assessmentId_idx" ON "course_artifacts"("assessmentId");

-- CreateIndex
CREATE INDEX "course_artifacts_category_idx" ON "course_artifacts"("category");

-- CreateIndex
CREATE INDEX "indirect_assessments_courseId_idx" ON "indirect_assessments"("courseId");

-- CreateIndex
CREATE INDEX "indirect_assessments_type_idx" ON "indirect_assessments"("type");

-- CreateIndex
CREATE INDEX "indirect_assessment_items_surveyId_idx" ON "indirect_assessment_items"("surveyId");

-- CreateIndex
CREATE INDEX "indirect_assessment_items_cloId_idx" ON "indirect_assessment_items"("cloId");

-- CreateIndex
CREATE INDEX "clo_attainment_results_courseId_idx" ON "clo_attainment_results"("courseId");

-- CreateIndex
CREATE INDEX "clo_attainment_results_academicYear_semester_idx" ON "clo_attainment_results"("academicYear", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "clo_attainment_results_cloId_semester_academicYear_key" ON "clo_attainment_results"("cloId", "semester", "academicYear");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_targetTable_targetId_idx" ON "audit_logs"("targetTable", "targetId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colleges" ADD CONSTRAINT "colleges_deanId_fkey" FOREIGN KEY ("deanId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "colleges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_headId_fkey" FOREIGN KEY ("headId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_learning_outcomes" ADD CONSTRAINT "program_learning_outcomes_targetLevelId_fkey" FOREIGN KEY ("targetLevelId") REFERENCES "competency_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_learning_outcomes" ADD CONSTRAINT "program_learning_outcomes_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_learning_outcomes" ADD CONSTRAINT "course_learning_outcomes_targetLevelId_fkey" FOREIGN KEY ("targetLevelId") REFERENCES "competency_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_learning_outcomes" ADD CONSTRAINT "course_learning_outcomes_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plo_clo_mapping" ADD CONSTRAINT "plo_clo_mapping_ploId_fkey" FOREIGN KEY ("ploId") REFERENCES "program_learning_outcomes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plo_clo_mapping" ADD CONSTRAINT "plo_clo_mapping_cloId_fkey" FOREIGN KEY ("cloId") REFERENCES "course_learning_outcomes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_methods" ADD CONSTRAINT "assessment_methods_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_items" ADD CONSTRAINT "assessment_items_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessment_methods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_items" ADD CONSTRAINT "assessment_items_cloId_fkey" FOREIGN KEY ("cloId") REFERENCES "course_learning_outcomes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_assessmentItemId_fkey" FOREIGN KEY ("assessmentItemId") REFERENCES "assessment_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_artifacts" ADD CONSTRAINT "course_artifacts_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_artifacts" ADD CONSTRAINT "course_artifacts_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_artifacts" ADD CONSTRAINT "course_artifacts_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indirect_assessments" ADD CONSTRAINT "indirect_assessments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indirect_assessment_items" ADD CONSTRAINT "indirect_assessment_items_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "indirect_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indirect_assessment_items" ADD CONSTRAINT "indirect_assessment_items_cloId_fkey" FOREIGN KEY ("cloId") REFERENCES "course_learning_outcomes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clo_attainment_results" ADD CONSTRAINT "clo_attainment_results_cloId_fkey" FOREIGN KEY ("cloId") REFERENCES "course_learning_outcomes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clo_attainment_results" ADD CONSTRAINT "clo_attainment_results_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clo_attainment_results" ADD CONSTRAINT "clo_attainment_results_calculatedById_fkey" FOREIGN KEY ("calculatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
