import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(65535))
    .default('3000'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z
    .string()
    .transform(Number)
    .pipe(z.number().min(10).max(14))
    .default('12'),
});

const parseResult = EnvSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('환경변수 설정 오류:');
  console.error(parseResult.error.format());
  process.exit(1);
}

export const env = parseResult.data;
export type Env = z.infer<typeof EnvSchema>;
