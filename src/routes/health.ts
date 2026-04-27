import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      message: '서버 정상',
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
        uptime: process.uptime(),
      },
    });
  } catch {
    res.status(503).json({
      success: false,
      message: '서비스 이용 불가',
      data: { status: 'error', database: 'disconnected' },
    });
  }
});

export default router;
