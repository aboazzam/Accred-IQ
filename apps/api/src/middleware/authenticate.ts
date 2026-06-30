import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { JwtPayload } from '../auth/auth.types';

// توسيع نوع Request لإضافة بيانات المستخدم
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'التوثيق مطلوب' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    if (decoded.type !== 'access') {
      res.status(401).json({ success: false, message: 'نوع التوكن غير صحيح' });
      return;
    }
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, message: 'انتهت صلاحية الجلسة' });
    } else {
      res.status(401).json({ success: false, message: 'التوكن غير صالح' });
    }
  }
}

// =========================================================
// Middleware للتحقق من صلاحية محددة قبل الوصول لأي Route
// =========================================================
import type { Action, PermissionScope } from '@accred-iq/database';

export function requirePermission(
  resource: string,
  action: Action,
  scope?: PermissionScope
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'غير مصرح' });
      return;
    }

    const hasPermission = user.permissions.some(
      (p) =>
        p.resource === resource &&
        p.action === action &&
        (scope === undefined || p.scope === scope || isScopeHigherOrEqual(p.scope, scope))
    );

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        message: `ليس لديك صلاحية: ${action} على ${resource}`,
      });
      return;
    }

    next();
  };
}

// النطاق الأعلى يشمل الأدنى تلقائياً
function isScopeHigherOrEqual(userScope: PermissionScope, requiredScope: PermissionScope): boolean {
  const hierarchy: PermissionScope[] = ['OWN', 'DEPARTMENT', 'COLLEGE', 'UNIVERSITY'];
  return hierarchy.indexOf(userScope) >= hierarchy.indexOf(requiredScope);
}
