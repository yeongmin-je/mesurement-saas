# 08. 개발 로드맵 (Phase 1 MVP)

> 24주(6개월) 계획. 영민님 codex-work 브랜치에서 주차별로 진행.
> 각 주차는 **"이번 주 목표 → 작업 단위 → 커밋 시점 → 검증 방법 → 완료 조건"** 구조.

---

## 전체 일정 요약

| 주차 | 범위 | 산출물 |
|---|---|---|
| **Week 0** | 환경 셋업 | 모노레포 + DB + 인증 골격 |
| **Week 1~2** | DB & 백엔드 코어 | 마이그레이션 + 인증 + 조직/유저 |
| **Week 3~4** | 측정기 CRUD | 등록(수동) + 목록 + 상세 + 수정 |
| **Week 5~7** | AI 사진 등록 | Claude Vision 통합 + 매칭 + 모바일 화면 |
| **Week 8~9** | 교정 관리 | 이력 등록 + 자동 주기 계산 |
| **Week 10~11** | 알림 시스템 | 카카오 알림톡 + 스케줄러 |
| **Week 12~14** | 성적서 OCR | OCR + 디지털 저장 + 검색 |
| **Week 15~17** | 보고서 | ISO 심사 PDF + 부서별 + 월간 |
| **Week 18~19** | 대시보드·캘린더 | 통계 위젯 + 캘린더 |
| **Week 20** | 마스터 데이터 확장 | 모델 1,000개 추가 |
| **Week 21~22** | 통합 테스트 | E2E + 베타 사용자 모집 |
| **Week 23~24** | 베타 런칭 | 100개사 온보딩 |

---

## Week 0: 환경 셋업 (5일)

### 목표
모노레포 + 빈 앱 3개 + DB 연결 + 첫 API 응답까지

### 작업 단위
1. **Day 1**: 루트 모노레포 (`pnpm init`, `turbo`, `tsconfig.base.json`)
2. **Day 2**: `apps/api` NestJS 골격 + DB 연결
3. **Day 3**: `apps/web` Next.js 14 + Tailwind + shadcn/ui
4. **Day 4**: `apps/mobile` Expo SDK 50
5. **Day 5**: `packages/types`, `packages/config` + 정리

### 커밋 단위
- `chore: monorepo init with turbo and pnpm workspaces`
- `feat(api): NestJS skeleton with PostgreSQL connection`
- `feat(api): healthcheck endpoint and global error filter`
- `feat(web): Next.js 14 app router with tailwind`
- `feat(mobile): Expo SDK 50 with react-navigation`
- `feat(types): shared API/domain types package`

### 검증 방법
```bash
pnpm dev
# - API: http://localhost:3001/v1/health → 200 OK
# - Web: http://localhost:3000 → 빈 페이지 렌더
# - Mobile: expo go에서 빈 앱 열림
```

### 완료 조건
- [ ] `pnpm dev` 3개 앱 동시 실행
- [ ] API에서 PostgreSQL 연결 성공 로그
- [ ] 타입 패키지를 다른 앱에서 import 가능
- [ ] Lint·Format 통과

---

## Week 1~2: DB 마이그레이션 + 인증 (10일)

### Week 1: DB 셋업

**작업 단위**:
1. `001_init.sql` 작성 (03_DATABASE_SCHEMA.sql 참조)
2. TypeORM data-source 설정
3. 마이그레이션 실행 스크립트
4. `002_seed.sql` (KOLAS 30종, 제조사 20곳, 모델 10개)
5. 시드 실행 스크립트

**커밋 단위**:
- `feat(db): initial schema migration (15 tables)`
- `feat(db): seed master data for kolas/manufacturers/models`
- `chore(db): migration runner script`

**검증**:
```bash
pnpm --filter api migration:run
pnpm --filter api seed:run
psql metroai_db -c "SELECT count(*) FROM kolas_categories;" # 30
psql metroai_db -c "SELECT count(*) FROM manufacturers;"    # 20
```

### Week 2: 인증 시스템

**작업 단위**:
1. JWT 전략 (access + refresh)
2. `Auth` 모듈: register, login, refresh, logout
3. `Organizations` 모듈: 생성 (가입 시 자동)
4. `Users` 모듈: CRUD + 역할 가드
5. 휴대폰 OTP (Twilio or NHN)
6. 웹·모바일 로그인 화면

**커밋 단위**:
- `feat(auth): JWT access/refresh token strategy`
- `feat(auth): register endpoint with org creation`
- `feat(auth): login/logout/refresh endpoints`
- `feat(auth): phone OTP verification`
- `feat(web): login and register pages`
- `feat(mobile): login screen with secure token storage`

**검증**:
- POST /auth/register → 사용자·조직 동시 생성
- POST /auth/login → 토큰 쌍 받음
- 보호된 엔드포인트 GET /users → 인증 필요
- 토큰 만료 시 refresh 자동 동작

**완료 조건**:
- [ ] 회원가입부터 로그인까지 풀 플로우 동작
- [ ] 토큰 만료·갱신 동작
- [ ] Rate limit 적용
- [ ] 단위 테스트 작성

---

## Week 3~4: 측정기 CRUD (수동 등록) (10일)

### Week 3: 백엔드

**작업 단위**:
1. `Instruments` 모듈 + 엔티티
2. POST /instruments (수동 등록)
3. GET /instruments (목록 + 페이지·필터)
4. GET /instruments/:id (상세)
5. PATCH /instruments/:id (수정)
6. asset_code 자동 생성 (`{prefix}-{date}-{seq}`)
7. KOLAS 카테고리 자동 매칭 + 차기교정일 계산

**커밋 단위**:
- `feat(instruments): entity and module skeleton`
- `feat(instruments): create endpoint with auto asset code`
- `feat(instruments): list endpoint with filter/sort/pagination`
- `feat(instruments): detail and update endpoints`
- `feat(instruments): auto next_calibration_date computation`
- `test(instruments): unit tests for service`

### Week 4: 프론트엔드

**작업 단위**:
1. 웹: 측정기 목록 페이지 (TanStack Table)
2. 웹: 측정기 상세 페이지
3. 웹: 수동 등록 폼 (React Hook Form + Zod)
4. 모바일: 목록 화면
5. 모바일: 상세 화면
6. API 클라이언트 (axios + 인터셉터)
7. React Query 설정

**완료 조건**:
- [ ] 수동으로 측정기 50개 등록 가능
- [ ] 검색·필터·정렬 동작
- [ ] 모바일에서 목록·상세 조회 가능
- [ ] 차기교정일 자동 계산 정확

---

## Week 5~7: AI 사진 등록 ⭐ (15일)

### Week 5: Vision API PoC

**작업 단위**:
1. Anthropic SDK 통합
2. `VisionService.recognizeInstrument` 구현
3. 프롬프트 작성·튜닝
4. 응답 파싱 + 에러 핸들링
5. **PoC 테스트 100건** (영민님 사진 수집 필요)

**중요**: 이 단계에서 **PoC 인식률 측정**. 90% 미만이면 프롬프트 개선·전처리 강화.

**커밋 단위**:
- `feat(ai): Anthropic SDK integration`
- `feat(ai): vision service with instrument prompt`
- `feat(ai): response parser with validation`
- `test(ai): integration tests with 100 sample photos`

### Week 6: 매칭 + 신뢰도

**작업 단위**:
1. `MatchingService`: 제조사·모델·KOLAS 매칭
2. PostgreSQL pg_trgm 활용
3. Levenshtein distance 계산
4. 신뢰도 계산 알고리즘
5. `RecognitionOrchestrator` 통합
6. POST /ai/recognize-instrument 엔드포인트
7. AI 사용량 로깅 (비용 추적)

**커밋 단위**:
- `feat(ai): manufacturer/model matching with pg_trgm`
- `feat(ai): confidence calculation algorithm`
- `feat(ai): recognition orchestrator`
- `feat(ai): usage logging for cost tracking`

### Week 7: 모바일 사진 등록 화면 ⭐

**작업 단위**:
1. Expo Camera 통합
2. 가이드 박스 오버레이
3. 이미지 압축·업로드 (S3 presigned URL)
4. AI 호출 → 진행 상태 표시
5. 결과 화면 (드롭다운 + 후보 + 신뢰도 배지)
6. 신뢰도별 UI 분기
7. 등록 완료 → 상세 화면 이동
8. 오프라인 큐잉

**커밋 단위**:
- `feat(mobile): camera screen with guide overlay`
- `feat(mobile): image upload with presigned URL`
- `feat(mobile): AI recognition flow`
- `feat(mobile): dropdown confirmation UI with confidence`
- `feat(mobile): offline queue with AsyncStorage`

**완료 조건**:
- [ ] 사진 1장으로 등록까지 1분 이내
- [ ] 신뢰도 90% 이상 케이스에서 사용자 클릭 1회로 완료
- [ ] 신뢰도 낮을 때 후보 드롭다운 동작
- [ ] 오프라인에서도 사진 등록 가능

---

## Week 8~9: 교정 이력 관리 (10일)

### 작업 단위
1. `Calibrations` 모듈
2. POST /calibrations
3. GET /calibrations + 측정기별 조회
4. 합격 시 측정기 상태·차기교정일 자동 갱신
5. 불합격 시 상태 → "사용중지"
6. 웹: 교정 등록 화면 (수동)
7. 웹·모바일: 교정 이력 타임라인

**완료 조건**:
- [ ] 교정 이력 등록 → 차기교정일 자동 변경 확인
- [ ] 측정기 상태 머신 정상 동작

---

## Week 10~11: 알림 시스템 (10일)

### Week 10: 알림 엔진

**작업 단위**:
1. `Notifications` 모듈
2. 알림 템플릿 시스템
3. 카카오 알림톡 통합 (NHN 비즈메시지 API)
4. 이메일 발송 (AWS SES)
5. 사업자 등록 신청 (영민님 별도 진행)
6. 발송 이력 기록

### Week 11: 스케줄러

**작업 단위**:
1. Bull queue + Redis 설정
2. `@nestjs/schedule` cron job: 매일 06:00
3. 임박 측정기 스캔 → 알림 큐 적재
4. 큐 컨슈머: 채널별 발송
5. 에스컬레이션 로직
6. 알림 센터 UI (웹·모바일)

**커밋 단위**:
- `feat(notifications): module with template system`
- `feat(notifications): kakao alimtalk service`
- `feat(notifications): email service via AWS SES`
- `feat(scheduler): daily cron for due calibrations`
- `feat(scheduler): bull queue for async delivery`
- `feat(web): notification center UI`

**완료 조건**:
- [ ] D-30, D-14, D-7, D-1, D-day 단계별 발송
- [ ] 카톡 발송 성공률 99%
- [ ] 에스컬레이션 동작 (D+1에 부서장)

---

## Week 12~14: 성적서 OCR (15일)

### Week 12: OCR PoC

**작업 단위**:
1. 성적서 OCR 프롬프트 작성
2. PoC 테스트 30건
3. 필드별 신뢰도 계산
4. 낮은 신뢰도 필드 표시

### Week 13: 통합

**작업 단위**:
1. POST /ai/recognize-certificate 엔드포인트
2. As-Found 데이터 추출 (표 형식)
3. 측정 불확도 추출
4. 원본 파일 S3 저장 + 메타데이터

### Week 14: 프론트엔드

**작업 단위**:
1. 웹: 성적서 사진 업로드 화면
2. OCR 결과 표 표시 + 인라인 수정
3. 신뢰도 낮은 필드 노란색 강조
4. 성적서 검색 화면

**완료 조건**:
- [ ] KOLAS 표준 양식 성적서 80% 이상 자동 추출
- [ ] 수정 가능한 결과 UI
- [ ] 검색 기능

---

## Week 15~17: 보고서 자동 생성 (15일)

### Week 15: PDF 생성 엔진

**작업 단위**:
1. Puppeteer 통합
2. HTML 템플릿 → PDF 변환
3. 한글 폰트 임베딩 (Pretendard)
4. 비동기 큐 처리

### Week 16: ISO 심사 보고서

**작업 단위**:
1. 보고서 데이터 수집 서비스
2. 표지·요약·상세 섹션 템플릿
3. 차트 (도넛, 막대) 임베딩
4. 첨부 PDF 합치기 (성적서)

### Week 17: 부서별·월간 보고서

**작업 단위**:
1. 부서별 현황 보고서 템플릿
2. 월간 요약 보고서 + 이메일 자동 발송 옵션
3. 보고서 생성 화면 (웹)
4. 생성 이력·다운로드

**완료 조건**:
- [ ] ISO 심사 보고서 30초 이내 생성
- [ ] 한글 깨짐 없음
- [ ] 100대 이상 측정기 보고서 정상 생성

---

## Week 18~19: 대시보드 & 캘린더 (10일)

### Week 18: 대시보드
1. GET /dashboard/summary 엔드포인트 (캐싱)
2. 위젯 4개 (보유, 초과, D-7, D-30)
3. 부서별 도넛 차트
4. 최근 활동 타임라인

### Week 19: 캘린더
1. 월별 캘린더 컴포넌트
2. 색상별 분류
3. 날짜 클릭 → 상세 패널
4. 모바일에서는 리스트 뷰

---

## Week 20: 마스터 데이터 확장 (5일)

### 작업 단위
1. CSV import 스크립트
2. 한국 시장 주요 모델 1,000개 수집·정리
3. 시리얼 패턴 등록
4. 백오피스 관리 화면 (영민님 전용)
5. 사용자 모델 등록 요청 처리 흐름

**데이터 수집 출처**:
- 제조사 공식 카탈로그
- KOLAS 교정 인정 범위 문서
- 영민님 SIMS 고객사 보유 측정기

---

## Week 21~22: 통합 테스트 (10일)

### Week 21: E2E 테스트
1. Playwright 셋업 (웹)
2. Detox 셋업 (모바일)
3. 시나리오 10개 작성
4. CI에 통합

### Week 22: 베타 사용자 모집
1. 랜딩 페이지 (`metroai.kr`)
2. 베타 신청 폼
3. 온보딩 가이드 (PDF·영상)
4. SIMS 고객사 대상 직접 영업

---

## Week 23~24: 베타 런칭 (10일)

### Week 23: 프로덕션 배포
1. AWS 인프라 셋업
2. CI/CD (GitHub Actions)
3. 도메인·SSL
4. 모니터링 (Sentry)
5. 백업·복구 테스트

### Week 24: 베타 운영
1. 첫 10개사 온보딩 (영민님 직접 지원)
2. 피드백 수집
3. 핫픽스 대응
4. Phase 2 우선순위 결정

---

## Phase 1 종료 시 점검 체크리스트

### 제품 완성도
- [ ] 사진 등록 정확도 95%↑ (저울 기준)
- [ ] 등록 1건당 60초 이내
- [ ] 카카오 알림톡 발송 99%
- [ ] ISO 심사 보고서 10초 이내
- [ ] 100대 동시 등록 부하 통과

### 비즈니스
- [ ] 베타 가입 100개사
- [ ] 등록 측정기 5,000대
- [ ] 유료 전환 후보 30개사

### 기술
- [ ] API 평균 응답 시간 < 500ms
- [ ] 가용성 99%
- [ ] 보안 점검 통과 (OWASP Top 10)
- [ ] 단위 테스트 커버리지 70%↑

---

## Phase 2 예고 (Week 25~)

- 교정기관 마켓플레이스
- 결제 시스템
- IoT 연동 (SIMS 저울)
- 의료기기·HACCP SKU
- 모바일 비전 OCR 일일점검

---

## Claude Code 작업 시작 시 매주 첫 메시지 템플릿

```
이번 주는 [Week N: 주차 제목]입니다.

Phase 1 MVP 진행 상황:
- 완료: Week 1~[N-1]
- 이번 주: Week N
- 목표: [이번 주 핵심 산출물]

현재 git 상태:
- 브랜치: codex-work
- 최근 커밋: [git log -1]

이번 주 첫 작업: [구체적 작업 단위]

작업 시작 전 plan을 먼저 보여주세요.
```

---

## 영민님께 드리는 진행 팁

1. **PoC 우선**: Week 5 시작 전에 측정기 사진 100장 미리 수집해두세요. 인식률 검증이 가장 큰 리스크입니다.

2. **카카오 사업자 등록**: Week 10 시작 전에 NHN 비즈메시지 사업자 등록 신청해두세요. 승인까지 1~2주 걸립니다.

3. **베타 사용자 사전 확보**: Week 22 전에 SIMS 고객사 10곳 정도와 미리 이야기해두세요.

4. **주차별 plan-first**: 매주 시작 시 Claude Code에 plan부터 요청. 5개 파일 이상 변경되면 단계 분할.

5. **롤백 준비**: 매 작업 전 backup 커밋. `git reflog`로 복구 가능.

---

## 다음 액션

이 문서를 다 읽으셨으면:

1. `00_README.md`로 돌아가서 전체 정리
2. Week 0 셋업 시작 → Claude Code 열어서 "Week 0 Day 1 작업 시작" 요청
3. 의문점은 `docs/QUESTIONS.md` 만들어서 모아두기
