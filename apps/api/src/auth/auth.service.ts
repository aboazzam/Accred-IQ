import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, Prisma } from '@accred-iq/database';
import { env } from '../config/env';
import type { JwtPayload, LoginRequest, LoginResponse, PermissionToken } from './auth.types';

export class AuthService {
  // =========================================================
  // تسجيل الدخول
  // =========================================================
  async login(body: LoginRequest): Promise<LoginResponse> {
    const { email, password } = body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        role: {
          include: {
            permissions: {
              where: { allowed: true },
              select: {
                resource: true,
                action: true,
                scope: true,
                field: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new AuthError('بيانات الدخول غير صحيحة', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await this.recordAudit(user.id, 'LOGIN_FAILED', 'users', user.id, 'auth');
      throw new AuthError('بيانات الدخول غير صحيحة', 401);
    }

    const permissions: PermissionToken[] = user.role.permissions.map((p) => ({
      resource: p.resource,
      action: p.action,
      scope: p.scope,
      field: p.field,
    }));

    const payload: Omit<JwtPayload, 'type'> = {
      sub: user.id,
      email: user.email,
      name: user.name,
      roleId: user.roleId,
      roleCode: user.role.code,
      roleNameAr: user.role.nameAr,
      permissions,
    };

    const accessToken = jwt.sign(
      { ...payload, type: 'access' },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );

    const refreshToken = jwt.sign(
      { sub: user.id, type: 'refresh' },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );

    await this.recordAudit(user.id, 'LOGIN', 'users', user.id, 'auth', {
      roleCode: user.role.code,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: env.JWT_EXPIRES_IN,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: {
          id: user.role.id,
          code: user.role.code,
          name: user.role.name,
          nameAr: user.role.nameAr,
        },
      },
    };
  }

  // =========================================================
  // تجديد الـ Token
  // =========================================================
  async refresh(refreshToken: string): Promise<{ accessToken: string; expiresIn: string }> {
    let decoded: Pick<JwtPayload, 'sub' | 'type'>;
    try {
      decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as Pick<JwtPayload, 'sub' | 'type'>;
    } catch {
      throw new AuthError('الجلسة منتهية، يرجى تسجيل الدخول مجدداً', 401);
    }

    if (decoded.type !== 'refresh') {
      throw new AuthError('التوكن غير صالح', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: {
        role: {
          include: {
            permissions: { where: { allowed: true } },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new AuthError('المستخدم غير موجود أو معطل', 401);
    }

    const permissions: PermissionToken[] = user.role.permissions.map((p) => ({
      resource: p.resource,
      action: p.action,
      scope: p.scope,
      field: p.field,
    }));

    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        roleId: user.roleId,
        roleCode: user.role.code,
        roleNameAr: user.role.nameAr,
        permissions,
        type: 'access',
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );

    return { accessToken, expiresIn: env.JWT_EXPIRES_IN };
  }

  // =========================================================
  // جلب بيانات المستخدم الحالي
  // =========================================================
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            code: true,
            name: true,
            nameAr: true,
            permissions: {
              where: { allowed: true },
              select: { resource: true, action: true, scope: true, field: true },
            },
          },
        },
      },
    });

    if (!user) throw new AuthError('المستخدم غير موجود', 404);
    return user;
  }

  // =========================================================
  // مساعد: تسجيل العمليات في Audit Trail
  // =========================================================
  private async recordAudit(
    userId: string,
    action: string,
    targetTable: string,
    targetId: string,
    targetComponent: string,
    metadata?: Record<string, unknown>
  ) {
    await prisma.auditLog.create({
      data: { userId, action, targetTable, targetId, targetComponent, metadata: metadata as Prisma.InputJsonValue | undefined },
    });
  }
}

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export const authService = new AuthService();
