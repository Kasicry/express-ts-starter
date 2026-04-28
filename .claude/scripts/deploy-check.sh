#!/bin/bash

# 배포 전 체크리스트 스크립트
# 사용: ./deploy-check.sh

set -e

echo "===== 배포 전 체크리스트 ====="
echo ""

PASSED=0
FAILED=0

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. TypeScript 컴파일 확인
echo -n "1. TypeScript 컴파일 확인... "
if npm run build > /dev/null 2>&1; then
  echo -e "${GREEN}✓ 통과${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ 실패${NC}"
  ((FAILED++))
fi

# 2. 환경변수 설정 확인
echo -n "2. 환경변수 설정 확인... "
if [ -f .env ]; then
  echo -e "${GREEN}✓ 통과${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ 실패${NC} (.env 파일 없음)"
  ((FAILED++))
fi

# 3. 불필요한 console.log 확인
echo -n "3. console.log 제거 확인... "
CONSOLE_COUNT=$(grep -r "console\.log" src/ 2>/dev/null | grep -v "node_modules" | wc -l || echo "0")
if [ "$CONSOLE_COUNT" -eq 0 ]; then
  echo -e "${GREEN}✓ 통과${NC}"
  ((PASSED++))
else
  echo -e "${YELLOW}⚠ 경고${NC} (console.log $CONSOLE_COUNT개 발견)"
  ((FAILED++))
fi

# 4. 보안 헤더 설정 확인
echo -n "4. Helmet 보안 헤더 설정 확인... "
if grep -q "helmet()" src/app.ts; then
  echo -e "${GREEN}✓ 통과${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ 실패${NC}"
  ((FAILED++))
fi

# 5. CORS 설정 확인
echo -n "5. CORS 설정 확인... "
if grep -q "cors(" src/app.ts; then
  echo -e "${GREEN}✓ 통과${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ 실패${NC}"
  ((FAILED++))
fi

# 6. 에러 처리 미들웨어 확인
echo -n "6. 에러 처리 미들웨어 확인... "
if grep -q "errorHandler" src/app.ts; then
  echo -e "${GREEN}✓ 통과${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ 실패${NC}"
  ((FAILED++))
fi

# 7. Rate Limiting 설정 확인
echo -n "7. Rate Limiting 설정 확인... "
if grep -q "rateLimit" src/app.ts; then
  echo -e "${GREEN}✓ 통과${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ 실패${NC}"
  ((FAILED++))
fi

# 8. 환경별 배포 설정 확인
echo -n "8. 환경변수 검증 설정 확인... "
if grep -q "EnvSchema" src/config/env.ts; then
  echo -e "${GREEN}✓ 통과${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ 실패${NC}"
  ((FAILED++))
fi

# 9. Git 변경사항 확인
echo -n "9. Git 변경사항 확인... "
if git diff-index --quiet HEAD --; then
  echo -e "${GREEN}✓ 통과${NC}"
  ((PASSED++))
else
  echo -e "${YELLOW}⚠ 경고${NC} (커밋되지 않은 변경사항 있음)"
  ((FAILED++))
fi

# 10. dist 폴더 존재 확인
echo -n "10. 빌드된 파일 존재 확인... "
if [ -d "dist" ]; then
  echo -e "${GREEN}✓ 통과${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ 실패${NC} (npm run build 실행 필요)"
  ((FAILED++))
fi

echo ""
echo "===== 체크 결과 ====="
echo -e "${GREEN}통과: $PASSED${NC}"
echo -e "${RED}실패: $FAILED${NC}"

if [ "$FAILED" -eq 0 ]; then
  echo -e "\n${GREEN}✓ 배포 준비 완료!${NC}"
  exit 0
else
  echo -e "\n${RED}✗ 배포 전에 위 항목들을 확인하세요.${NC}"
  exit 1
fi
