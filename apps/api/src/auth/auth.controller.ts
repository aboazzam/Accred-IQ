import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService, AuthError } from './auth.service';

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'الـ Refresh Token مطلوب'),
});

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = loginSchema.parse(req.body);
      const result = await authService.login(body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = refreshSchema.parse(req.body);
      const result = await authService.refresh(refreshToken);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as Request & { user?: { sub: string } }).user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, message: 'غير مصرح' });
        return;
      }
      const user = await authService.getMe(userId);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
