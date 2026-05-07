# Repository Guidelines

## 프로젝트 구조 및 모듈 구성

이 저장소는 Express + TypeScript 기반 API 스타터입니다. 런타임 소스는 `src/`에 있으며, `src/app.ts`가 서버 진입점입니다. 라우트는 `src/routes/`, HTTP 핸들러는 `src/controllers/`, 비즈니스 로직은 `src/services/`, 공통 Express 미들웨어는 `src/middleware/`에 둡니다. 환경 변수, 데이터베이스, 로거 설정은 `src/config/`, 공유 타입은 `src/types/`를 사용합니다. Prisma 스키마와 마이그레이션은 `prisma/`에 있습니다. `dist/`는 빌드 결과물이므로 직접 수정하지 마세요. `api.http`는 REST Client 기반 수동 API 확인 예시입니다.

## 빌드, 테스트, 개발 명령

- `npm run dev`: `src/app.ts`를 기준으로 개발 서버를 실행하고 변경 시 자동 재시작합니다.
- `npm run build`: TypeScript를 컴파일해 `dist/`에 출력합니다.
- `npm start`: 컴파일된 `dist/app.js`로 서버를 실행합니다.
- `npm run prisma:generate`: Prisma 스키마 변경 후 클라이언트를 재생성합니다.
- `npm run prisma:migrate`: 개발 환경 마이그레이션을 생성하고 적용합니다.
- `npm run prisma:studio`: 로컬 데이터베이스 확인용 Prisma Studio를 실행합니다.

현재 `npm test` 스크립트는 정의되어 있지 않습니다. 변경 전 최소 검증으로 `npm run build`를 실행하세요.

## 코딩 스타일 및 명명 규칙

TypeScript `strict` 설정을 기준으로 작성하고, 컨트롤러, 미들웨어, 서비스처럼 외부 경계에 가까운 코드에는 타입을 명확히 둡니다. 기존 스타일에 맞춰 2칸 들여쓰기, 작은따옴표, 세미콜론, named export를 사용합니다. 변수와 함수는 `camelCase`, 클래스와 타입, Zod 스키마는 `PascalCase`를 사용합니다. 예시는 `RegisterSchema`, `authController.ts`입니다. 컨트롤러는 요청 파싱과 응답 처리에 집중하고, 비즈니스 규칙과 데이터베이스 접근은 서비스에 둡니다. 요청 입력값은 가능한 경우 Zod로 검증합니다.

## 테스트 지침

아직 프로젝트 테스트 프레임워크와 테스트 파일은 없습니다. 테스트를 추가할 때는 대상 코드 가까이에 배치하거나 향후 `tests/` 디렉터리를 사용하고, 파일명은 `*.test.ts` 또는 `*.spec.ts`를 따르세요. 신규 엔드포인트는 서비스 로직, 인증 미들웨어, 오류 처리, 라우트 동작을 함께 검증하는 것이 좋습니다. 테스트 러너가 추가되기 전까지는 `api.http`로 엔드포인트를 확인하고 `npm run build`를 실행하세요.

## 커밋 및 Pull Request 지침

최근 커밋 기록은 짧고 설명적인 한국어 요약을 사용합니다. 커밋 메시지는 간결하고 작업 중심으로 작성하세요. Pull Request에는 변경 요약, 관련 이슈, 설정 또는 마이그레이션 안내, 엔드포인트 변경 시 API 요청/응답 예시를 포함하세요. 스크린샷은 Prisma Studio 같은 도구 화면이나 UI 관련 변경에만 첨부하면 충분합니다.

## 보안 및 설정 팁

로컬 개발 시 `.env.example`을 `.env`로 복사해 사용하세요. 실제 비밀값은 커밋하지 않습니다. 필수 설정에는 `DATABASE_URL`과 최소 32자 이상의 `JWT_SECRET`이 포함됩니다. 프로덕션에서는 CORS가 제한되므로 `ALLOWED_ORIGINS`를 명시하세요.

## Git 훅

이 저장소는 `.githooks/pre-commit`으로 staged 파일의 민감정보를 검사합니다. 처음 클론한 뒤 아래 명령으로 훅 경로를 설정하세요.

```bash
git config core.hooksPath .githooks
```

훅은 `.env` 파일, `JWT_SECRET`, `SECRET_KEY`, `API_KEY`, `DATABASE_URL` 형태의 값, private key 헤더를 감지하면 커밋을 중단합니다. `.env.example`은 예외로 허용됩니다.

## Cursor MCP

프로젝트별 Cursor MCP 설정은 `.cursor/mcp.json`에 있습니다. `postgres-readonly` 서버는 `.env`의 `DATABASE_URL`을 사용해 PostgreSQL 상태와 `public` 스키마 정보를 읽기 전용으로 조회합니다.

Cursor에서 프로젝트를 다시 열거나 MCP 설정을 새로고침한 뒤 `db_health`, `list_tables`, `describe_table` 도구로 연결을 확인하세요. 로컬 DB가 꺼져 있으면 `db_health`는 연결 실패를 반환합니다.
