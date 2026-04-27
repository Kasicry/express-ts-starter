import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/authService';

const RegisterSchema = z.object({
  email: z.string().email('유효한 이메일 형식이 아님'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상'),
  name: z.string().min(1).max(100).optional(),
});

const LoginSchema = z.object({
  email: z.string().email('유효한 이메일 형식이 아님'),
  password: z.string().min(1, '비밀번호는 필수'),
});

export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = RegisterSchema.parse(req.body);
      const result = await authService.register(input);

      res.status(201).json({
        success: true,
        message: '회원가입 성공',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = LoginSchema.parse(req.body);
      const result = await authService.login(input);

      res.status(200).json({
        success: true,
        message: '로그인 성공',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
