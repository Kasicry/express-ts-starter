import { prisma } from '../config/database';
import { NotFoundError } from '../middleware/errorHandler';
import { UserPublic } from '../types';

export class UserService {
  async getUserById(id: string): Promise<UserPublic> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundError('사용자를 찾을 수 없음');
    return user;
  }
}

export const userService = new UserService();
