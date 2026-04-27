import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = '요청이 잘못됨') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '인증이 필요함') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = '권한이 없음') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '요청한 리소스를 찾을 수 없음') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = '리소스 중복') {
    super(message, 409);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: '유효성 검사 실패',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  logger.error('처리되지 않은 오류', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    message: '서버 내부 오류',
  });
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new NotFoundError(`라우트 ${req.method} ${req.url}를 찾을 수 없음`));
};
