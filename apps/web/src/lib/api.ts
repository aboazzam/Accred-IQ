import { getToken } from './auth';

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? `HTTP ${res.status}`);
  return data;
}

// Auth
export async function loginApi(email: string, password: string) {
  return request<{
    success: boolean;
    data: {
      accessToken: string; refreshToken: string;
      user: { id: string; name: string; email: string; roleCode: string; roleNameAr: string };
    };
  }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

// Programs
export async function fetchPrograms() {
  return request<{ success: boolean; data: Program[]; meta: unknown }>('/programs');
}

export async function fetchProgram(id: string) {
  return request<{ success: boolean; data: Program }>(`/programs/${id}`);
}

// Courses
export async function fetchCourses(programId?: string) {
  const q = programId ? `?programId=${programId}` : '';
  return request<{ success: boolean; data: Course[]; meta: unknown }>(`/courses${q}`);
}

// Outcomes
export async function fetchPlos(programId: string) {
  return request<{ success: boolean; data: PLO[] }>(`/outcomes/programs/${programId}/plos`);
}

export async function fetchClos(courseId: string) {
  return request<{ success: boolean; data: CLO[] }>(`/outcomes/courses/${courseId}/clos`);
}

export async function createProgram(data: {
  code: string; name: string; nameAr: string;
  level: string; totalCreditHours: number;
  accreditationBody?: string; departmentId?: string;
}) {
  return request<{ success: boolean; data: Program }>('/programs', {
    method: 'POST', body: JSON.stringify(data),
  });
}

export async function createCourse(data: {
  code: string; name: string; nameAr: string;
  creditHours: number; programId: string;
  semester?: string; academicYear?: string;
  ploIds?: string[];
}) {
  return request<{ success: boolean; data: Course }>('/courses', {
    method: 'POST', body: JSON.stringify(data),
  });
}

export async function createPlo(programId: string, data: {
  code: string; description: string; descriptionAr: string; domain: string;
}) {
  return request<{ success: boolean; data: PLO }>(`/outcomes/programs/${programId}/plos`, {
    method: 'POST', body: JSON.stringify(data),
  });
}

export async function fetchDepartments() {
  return request<{ success: boolean; data: Department[]; meta: unknown }>('/departments');
}

// Colleges
export async function fetchColleges() {
  return request<{ success: boolean; data: College[]; meta: unknown }>('/colleges');
}
export async function createCollegeApi(data: { name: string; nameAr: string; code: string }) {
  return request<{ success: boolean; data: College }>('/colleges', { method: 'POST', body: JSON.stringify(data) });
}
export async function updateCollegeApi(id: string, data: Partial<{ name: string; nameAr: string; code: string }>) {
  return request<{ success: boolean; data: College }>(`/colleges/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}
export async function deleteCollegeApi(id: string) {
  return request<{ success: boolean }>(`/colleges/${id}`, { method: 'DELETE' });
}

// Department CRUD
export async function createDepartmentApi(data: { name: string; nameAr: string; code: string; collegeId: string }) {
  return request<{ success: boolean; data: Department }>('/departments', { method: 'POST', body: JSON.stringify(data) });
}
export async function updateDepartmentApi(id: string, data: Partial<{ name: string; nameAr: string; code: string }>) {
  return request<{ success: boolean; data: Department }>(`/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}
export async function deleteDepartmentApi(id: string) {
  return request<{ success: boolean }>(`/departments/${id}`, { method: 'DELETE' });
}

export async function fetchUsers() {
  return request<{ success: boolean; data: User[] }>('/users');
}

export async function fetchCourse(courseId: string) {
  return request<{ success: boolean; data: Course }>(`/courses/${courseId}`);
}

export async function createClo(courseId: string, data: {
  code: string; description: string; descriptionAr: string;
  domain: string; targetBenchmark: number;
}) {
  return request<{ success: boolean; data: CLO }>(`/outcomes/courses/${courseId}/clos`, {
    method: 'POST', body: JSON.stringify(data),
  });
}

export async function updateClo(courseId: string, cloId: string, data: {
  code?: string; description?: string; descriptionAr?: string;
  domain?: string; targetBenchmark?: number;
}) {
  return request<{ success: boolean; data: CLO }>(`/outcomes/courses/${courseId}/clos/${cloId}`, {
    method: 'PATCH', body: JSON.stringify(data),
  });
}

// ── Types ───────────────────────────────────────────────────
export interface Program {
  id: string; code: string; name: string; nameAr: string;
  level: string; totalCreditHours: number;
  accreditationBody: string | null; accreditationStatus: string;
  departmentId: string; directorId: string | null;
  _count?: { courses: number; plos: number };
}

export interface Course {
  id: string; code: string; name: string; nameAr: string;
  creditHours: number; semester: string | null; academicYear: string | null;
  instructorId: string | null; programId: string;
  _count?: { clos: number; assessments: number };
}

export interface PLO {
  id: string; code: string; description: string; descriptionAr: string; domain: string;
}

export interface CLO {
  id: string; code: string; description: string; descriptionAr: string; domain: string;
  targetBenchmark: number;
}

export interface User {
  id: string; name: string; email: string;
  roleCode: string; roleNameAr: string;
}

export interface Department {
  id: string; name: string; nameAr: string; code: string; isActive: boolean;
  college: { id: string; name: string; nameAr: string; code: string };
}

export interface College {
  id: string; name: string; nameAr: string; code: string; isActive: boolean;
  dean: { id: string; name: string; email: string } | null;
  _count: { departments: number };
}
