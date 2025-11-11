#!/bin/bash

# 학습자 코스 API 테스트 스크립트
# 사용: ./scripts/test-learner-api.sh

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 설정
API_BASE_URL="http://localhost:3000/api"
LEARNER_TOKEN="" # 학습자의 인증 토큰 (로그인 후 얻음)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}학습자 코스 API 테스트${NC}"
echo -e "${BLUE}========================================${NC}"

# 1. 공개 코스 목록 조회 (비인증)
echo -e "\n${YELLOW}[1] GET /api/learner/courses/available - 공개 코스 목록 조회 (비인증)${NC}"
curl -X GET \
  "${API_BASE_URL}/learner/courses/available?page=1&pageSize=10" \
  -H "Content-Type: application/json" \
  -s | jq '.'

# 2. 공개 코스 목록 조회 (페이지 2)
echo -e "\n${YELLOW}[2] GET /api/learner/courses/available?page=2 - 페이지 2 조회${NC}"
curl -X GET \
  "${API_BASE_URL}/learner/courses/available?page=2&pageSize=10" \
  -H "Content-Type: application/json" \
  -s | jq '.'

# 3. 수강신청한 코스 목록 (인증 필수)
if [ -n "$LEARNER_TOKEN" ]; then
  echo -e "\n${YELLOW}[3] GET /api/learner/courses/enrolled - 수강신청한 코스 목록${NC}"
  curl -X GET \
    "${API_BASE_URL}/learner/courses/enrolled" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${LEARNER_TOKEN}" \
    -s | jq '.'

  # 4. 코스 수강신청
  # 주의: COURSE_ID를 실제 공개 코스 ID로 변경하세요
  echo -e "\n${YELLOW}[4] POST /api/learner/courses/{courseId}/enroll - 코스 수강신청${NC}"
  echo -e "${RED}주의: COURSE_ID를 실제 공개 코스 ID로 변경하세요${NC}"
  read -p "수강신청할 코스 ID를 입력하세요: " COURSE_ID

  if [ -n "$COURSE_ID" ]; then
    curl -X POST \
      "${API_BASE_URL}/learner/courses/${COURSE_ID}/enroll" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${LEARNER_TOKEN}" \
      -s | jq '.'
  fi

  # 5. 수강신청 취소
  echo -e "\n${YELLOW}[5] DELETE /api/learner/courses/{courseId}/enroll - 수강신청 취소${NC}"
  echo -e "${RED}주의: 위에서 수강신청한 코스를 취소합니다${NC}"

  if [ -n "$COURSE_ID" ]; then
    curl -X DELETE \
      "${API_BASE_URL}/learner/courses/${COURSE_ID}/enroll" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${LEARNER_TOKEN}" \
      -s | jq '.'
  fi
else
  echo -e "\n${RED}경고: LEARNER_TOKEN이 설정되지 않았습니다.${NC}"
  echo -e "${YELLOW}인증이 필요한 엔드포인트를 테스트하려면 토큰을 설정하세요.${NC}"
  echo -e "${YELLOW}사용법: LEARNER_TOKEN='your-token' ./scripts/test-learner-api.sh${NC}"
fi

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}테스트 완료${NC}"
echo -e "${BLUE}========================================${NC}"
