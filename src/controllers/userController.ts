import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { userService } from '../services/userService';
import { UnauthorizedError } from '../middleware/errorHandler';

export const userController = {
  async getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();

      const user = await userService.getUserById(req.user.userId);

      res.status(200).json({
        success: true,
        message: '사용자 정보 조회 성공',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  },
};
