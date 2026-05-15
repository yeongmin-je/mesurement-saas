# MetroAI

> AI 계측기 관리 플랫폼 — 사진 한 장으로 측정기를 등록하고, KOLAS 표준주기로 교정 일정을 자동 관리하는 한국형 SaaS

## 빠른 시작

```bash
# 1. 의존성 설치
pnpm install

# 2. 환경 변수 설정
cp .env.example .env
# (DATABASE_URL, ANTHROPIC_API_KEY 등을 채워주세요)

# 3. 인프라 기동 (PostgreSQL + Redis + MinIO)
docker compose -f infra/docker/docker-compose.yml up -d

# 4. DB 마이그레이션 + 시드
pnpm --filter @metroai/api prisma:migrate
pnpm --filter @metroai/api prisma:seed

# 5. 개발 서버 (API + Web 동시 실행)
pnpm dev
```

접근 URL:

- Web: <http://localhost:3000>
- API: <http://localhost:3001/v1/health>
- Mobile: `pnpm --filter @metroai/mobile start` 후 Expo Go 앱으로 QR 스캔

## 모노레포 구조

```
metroai/
├── apps/
│   ├── api/      # NestJS + Prisma 백엔드
│   ├── web/      # Next.js 14 App Router
│   └── mobile/   # Expo (React Native)
├── packages/
│   ├── types/    # 공유 도메인/API 타입
│   ├── config/   # 공유 ESLint/TSConfig/Tailwind
│   └── utils/    # 공유 유틸 (validators, formatters)
├── infra/docker/ # 로컬 개발용 컨테이너
├── scripts/      # 시드/임포트 스크립트
└── docs/         # 제품·설계 문서
```

자세한 내용은 [`docs/00_README.md`](docs/00_README.md) 부터 시작하세요.

## 기술 스택

| 영역 | 선택 |
|---|---|
| Frontend Web | Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui |
| Mobile App | React Native (Expo SDK 50) + TypeScript |
| Backend API | NestJS 10 + TypeScript |
| Database | PostgreSQL 16 + pg_trgm |
| ORM | Prisma 5 |
| File Storage | AWS S3 (개발은 MinIO) |
| AI Vision | Claude Vision API (Anthropic SDK) |
| Notification | NHN 비즈메시지 카카오 알림톡 + AWS SES |
| Queue | Bull + Redis |
| Auth | JWT (access + refresh) |

## 핵심 원칙

1. **Plan-first**: 코드 작성 전 항상 계획 먼저
2. **Smallest unit**: 한 번에 하나의 관심사만 변경
3. **codex-work 브랜치**: 모든 AI 코딩 작업은 별도 브랜치
4. **TypeScript strict**: 타입 안정성 최우선
5. **No silent guessing**: 모르면 멈추고 질문
6. **Korean replies, English code comments**

## 로드맵

24주 Phase 1 MVP 계획 — [`docs/08_DEV_ROADMAP.md`](docs/08_DEV_ROADMAP.md) 참조.

---

**버전**: 0.1.0 (Phase 1 MVP scaffold)
