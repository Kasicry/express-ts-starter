# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Express + TypeScript API 스타터킷으로, REST API 서버를 위한 완벽한 기초 구조를 제공합니다. 인증, 데이터베이스 연동, 에러 처리, 로깅 등 필수 기능이 구현되어 있습니다.

## 개발 명령어

```bash
npm run dev              # 개발 서버 실행 (자동 리로드)
npm run build           # TypeScript 컴파일
npm start               # 빌드된 앱 실행
npm run prisma:migrate  # DB 마이그레이션 실행
npm run prisma:generate # Prisma 클라이언트 재생성
npm run prisma:studio   # Prisma Studio UI 실행
```

## 프로젝트 구조

### 핵심 디렉토리

- **`src/app.ts`** — Express 애플리케이션 진입점. 미들웨어 설정, 라우터 연결, 서버 시작/종료 로직 포함
- **`src/routes/`** — API 라우트 정의 (`health.ts`, `auth.ts`, `users.ts`)
- **`src/controllers/`** — HTTP 요청 핸들러. 비즈니스 로직은 서비스 레이어로 위임
- **`src/services/`** — 비즈니스 로직 계층. DB 접근, 인증, 유효성 검사 등 처리
- **`src/middleware/`** — Express 미들웨어 (에러 처리, 인증, 요청 로깅)
- **`src/config/`** — 환경변수, DB 연결, 로거 설정
- **`src/types/`** — TypeScript 인터페이스 및 타입 정의
- **`prisma/schema.prisma`** — Prisma ORM 데이터베이스 스키마

### 계층 구조

```
Request → Router → Controller → Service → Prisma Client → Database
           ↓
      Middleware (에러 처리, 인증, 로깅)
```

컨트롤러는 요청 파싱과 응답 포맷팅만 담당하고, 실제 비즈니스 로직은 서비스 레이어에서 처리합니다.

## 환경설정

`.env` 파일 필수 변수 (`.env.example` 참조):

- `NODE_ENV` — `development` | `production` | `test`
- `PORT` — API 서버 포트 (기본값: 3000)
- `DATABASE_URL` — PostgreSQL 연결 문자열 (필수)
- `JWT_SECRET` — JWT 서명용 비밀키 (최소 32자)
- `JWT_EXPIRES_IN` — JWT 만료 시간 (기본값: 7d)
- `BCRYPT_ROUNDS` — 비밀번호 해싱 라운드 (10-14)

환경변수는 `src/config/env.ts`에서 Zod를 이용해 검증되며, 설정 오류 시 서버가 시작되지 않습니다.

## 핵심 기능

### 에러 처리

`src/middleware/errorHandler.ts`에 정의된 커스텀 에러 클래스들:

- `AppError` — 기본 에러 (상태코드, 메시지 포함)
- `BadRequestError` (400), `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404), `ConflictError` (409)

컨트롤러에서 이 에러들을 throw하면 자동으로 에러 핸들러가 처리합니다. Zod 유효성 검사 실패도 자동으로 400 응답으로 변환됩니다.

```typescript
if (!user) {
  throw new NotFoundError('사용자를 찾을 수 없음');
}
```

### 데이터베이스

Prisma ORM을 사용하여 PostgreSQL과 연동합니다:

- 마이그레이션: `npm run prisma:migrate`
- 스키마 수정 후 클라이언트 재생성: `npm run prisma:generate`
- 현재 사용자 모델 (`User`) — id, email, password, name, role, createdAt, updatedAt

### 인증

JWT 토큰 기반 인증:

- `src/services/authService.ts` — 토큰 생성, 검증
- `src/middleware/authMiddleware.ts` — 요청 헤더에서 토큰 추출 및 검증
- `src/types/index.ts` — `JwtPayload`, `AuthRequest` 타입 정의

JWT 검증 미들웨어는 `Authorization: Bearer <token>` 형식의 헤더를 기대합니다.

### 로깅

Winston 라이브러리를 통한 구조화된 로깅:

- `src/config/logger.ts` — 로거 설정
- `src/middleware/logger.ts` — 요청/응답 로깅 미들웨어

### 보안

- **Helmet** — HTTP 보안 헤더 설정
- **CORS** — 개발 환경에서는 모든 오리진 허용, 프로덕션에서는 `ALLOWED_ORIGINS` 환경변수로 제한
- **Rate Limiting** — `/api` 엔드포인트에 15분당 100 요청 제한
- **bcryptjs** — 비밀번호 해싱

## 타입 안전성

- `strict: true`로 TypeScript 설정
- Zod 스키마를 이용한 런타임 유효성 검사
- `any` 타입 사용 금지

## 코딩 규칙

- **들여쓰기**: 2칸
- **네이밍**: camelCase (함수, 변수), PascalCase (클래스, 타입, 컴포넌트)
- **주석**: 필요시 한국어로 작성 (WHY가 명확하지 않은 경우만)
