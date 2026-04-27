import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { ConflictError, UnauthorizedError } from '../middleware/errorHandler';
import { JwtPayload, UserPublic } from '../types';

interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthResult {
  user: UserPublic;
  token: string;
}

export class AuthService {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) throw new ConflictError('이미 등록된 이메일');

    const hashedPassword = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        name: input.name,
      },
    });

    const token = this.generateToken(user);
    const { password: _, ...userPublic } = user;

    return { user: userPublic, token };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!user) throw new UnauthorizedError('잘못된 이메일 또는 비밀번호');

    const isValid = await bcrypt.compare(input.password, user.password);
    if (!isValid) throw new UnauthorizedError('잘못된 이메일 또는 비밀번호');

    const token = this.generateToken(user);
    const { password: _, ...userPublic } = user;

    return { user: userPublic, token };
  }

  private generateToken(user: { id: string; email: string; role: string }): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
  }
}

export const authService = new AuthService();
