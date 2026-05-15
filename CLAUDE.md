# Claude Code 작업 가이드 (MetroAI)

이 저장소에서 작업할 때 반드시 따라야 할 규칙입니다.

## 작업 원칙 (영민님 룰)

1. **Plan-first** — 코드 작성 전 항상 계획부터 보여줄 것
2. **Smallest unit** — 한 번에 하나의 관심사만 변경
3. **codex-work 브랜치** — 모든 AI 코딩 작업은 별도 브랜치 (`claude/*`, `codex-work` 등)
4. **TypeScript strict** — `any` 금지, `as` 캐스팅 최소화
5. **No silent guessing** — 모르면 멈추고 질문
6. **Korean replies, English code comments** — 답변/PR 본문은 한국어, 코드 주석은 영어

## 모노레포 명령어

```bash
pnpm install                                 # 전체 의존성
pnpm dev                                     # 전체 dev (api + web)
pnpm --filter @metroai/api dev               # API만
pnpm --filter @metroai/web dev               # Web만
pnpm --filter @metroai/mobile start          # Mobile (Expo)
pnpm --filter @metroai/api prisma:migrate    # DB 마이그레이션
pnpm --filter @metroai/api prisma:seed       # 시드 데이터
pnpm typecheck                               # 전체 타입 검증
pnpm lint                                    # 전체 린트
pnpm test                                    # 전체 테스트
```

## 작업 전 체크리스트

1. `git status` 깨끗한지 확인
2. 작업 브랜치 확인 (`claude/*` 또는 `codex-work`)
3. `pnpm typecheck` 통과 상태 확인
4. 변경 5개 파일 이상이면 단계 분할 제안

## 커밋 규칙

```
feat(instruments): 사진 등록 시 GPS 자동 저장
fix(auth): 리프레시 토큰 만료 처리 오류 수정
refactor(ai): vision 서비스 매칭 로직 분리
docs: API 명세 업데이트
chore: 의존성 업데이트
```

스코프: `auth`, `instruments`, `calibrations`, `ai`, `notifications`, `reports`, `master`, `db`, `web`, `mobile`, `api`, `types`, `infra`

## 코드 위치 가이드

| 작업 | 위치 |
|---|---|
| 새 API 엔드포인트 | `apps/api/src/modules/<domain>/` |
| 공유 타입 | `packages/types/src/{domain,api}/` |
| 공유 유틸 (asset code 등) | `packages/utils/src/` |
| 웹 페이지 | `apps/web/src/app/(dashboard)/<route>/page.tsx` |
| 모바일 화면 | `apps/mobile/src/screens/<domain>/<Screen>.tsx` |
| DB 스키마 변경 | `apps/api/prisma/schema.prisma` + `pnpm --filter @metroai/api prisma:migrate` |
| 시드 데이터 | `apps/api/prisma/seed.ts` |

## 새 도메인 모듈 추가 시

NestJS 모듈은 다음 구조를 따릅니다:

```
modules/<domain>/
├── <domain>.module.ts
├── <domain>.controller.ts
├── <domain>.service.ts
├── dto/
│   ├── create-<domain>.dto.ts
│   ├── update-<domain>.dto.ts
│   └── query-<domain>.dto.ts
└── <domain>.service.spec.ts
```

`app.module.ts`의 `imports`에 추가하는 것을 잊지 마세요.

## 진행 로드맵

`docs/08_DEV_ROADMAP.md` 참고. Week 0 완료 → Week 1 (DB + 인증) → Week 2 (인증 시스템) → ...

## 알면 도움 되는 것

- ORM: **Prisma** (07_PROJECT_STRUCTURE.md는 TypeORM이라고 적혀 있지만 이 저장소는 Prisma로 진행 중)
- DB 확장: `uuid-ossp`, `pg_trgm` 필수
- 시간/날짜: 백엔드에서는 `Date` 객체, API 응답에서는 ISO 8601 문자열
- 멀티 테넌시: 모든 사업장 스코프 데이터는 `tenantId` 컬럼으로 격리. 서비스 메서드는 `tenantId`를 항상 받아야 함

---

이 가이드가 작업 도중 갱신되면 PR에 반영해주세요.
