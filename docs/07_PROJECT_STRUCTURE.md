# 07. 프로젝트 구조

> 모노레포 구조, 폴더별 책임, 모듈 분할 원칙

## 1. 전체 구조 결정

### 모노레포 채택 (pnpm + Turborepo)

**이유**:
- 웹·모바일이 동일한 백엔드와 타입을 공유
- 한 번의 PR로 풀스택 변경 가능
- 공통 패키지 (types, utils, ai-prompts) 한 곳 관리
- Claude Code에서 전체 컨텍스트 보기 쉬움

**대안 검토 결과**:
- 폴리레포: 초기 설정 복잡, 타입 공유 어려움 ❌
- Nx: 학습 곡선 가파름, Turborepo로 충분 ❌
- Yarn workspaces: pnpm이 더 빠름 ❌

---

## 2. 폴더 구조

```
metroai/
├── apps/
│   ├── web/                          # Next.js 14 웹 클라이언트
│   │   ├── src/
│   │   │   ├── app/                  # App Router
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login/
│   │   │   │   │   └── register/
│   │   │   │   ├── (dashboard)/
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── page.tsx       # 대시보드 홈
│   │   │   │   │   ├── instruments/
│   │   │   │   │   ├── calibrations/
│   │   │   │   │   ├── reports/
│   │   │   │   │   ├── notifications/
│   │   │   │   │   └── settings/
│   │   │   │   ├── api/               # Route Handlers (proxy 등)
│   │   │   │   └── layout.tsx
│   │   │   ├── components/
│   │   │   │   ├── ui/                # shadcn/ui 베이스
│   │   │   │   ├── instruments/
│   │   │   │   ├── calibrations/
│   │   │   │   ├── notifications/
│   │   │   │   └── shared/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   │   ├── api-client.ts      # fetch 래퍼
│   │   │   │   ├── auth.ts
│   │   │   │   └── utils.ts
│   │   │   ├── store/                 # Zustand
│   │   │   └── styles/
│   │   ├── public/
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   ├── mobile/                       # React Native (Expo)
│   │   ├── src/
│   │   │   ├── screens/
│   │   │   │   ├── auth/
│   │   │   │   ├── home/
│   │   │   │   ├── instruments/
│   │   │   │   │   ├── ListScreen.tsx
│   │   │   │   │   ├── DetailScreen.tsx
│   │   │   │   │   └── PhotoRegisterScreen.tsx  # ⭐ 핵심
│   │   │   │   ├── calibrations/
│   │   │   │   ├── notifications/
│   │   │   │   └── profile/
│   │   │   ├── components/
│   │   │   ├── navigation/            # React Navigation
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── store/
│   │   │   └── utils/
│   │   ├── assets/
│   │   ├── app.json
│   │   └── package.json
│   │
│   └── api/                          # NestJS 백엔드
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   │   ├── auth.controller.ts
│       │   │   │   ├── auth.service.ts
│       │   │   │   ├── auth.module.ts
│       │   │   │   ├── strategies/
│       │   │   │   │   ├── jwt.strategy.ts
│       │   │   │   │   └── refresh.strategy.ts
│       │   │   │   └── dto/
│       │   │   ├── organizations/
│       │   │   ├── users/
│       │   │   ├── departments/
│       │   │   ├── instruments/
│       │   │   │   ├── instruments.controller.ts
│       │   │   │   ├── instruments.service.ts
│       │   │   │   ├── instruments.module.ts
│       │   │   │   ├── dto/
│       │   │   │   └── entities/
│       │   │   ├── calibrations/
│       │   │   ├── notifications/
│       │   │   │   ├── notifications.service.ts
│       │   │   │   ├── kakao.service.ts        # 카카오 알림톡
│       │   │   │   ├── email.service.ts
│       │   │   │   └── scheduler.service.ts    # cron job
│       │   │   ├── reports/
│       │   │   │   ├── reports.service.ts
│       │   │   │   ├── generators/
│       │   │   │   │   ├── iso-audit.generator.ts
│       │   │   │   │   ├── department.generator.ts
│       │   │   │   │   └── monthly.generator.ts
│       │   │   │   └── pdf.service.ts          # Puppeteer
│       │   │   ├── ai/
│       │   │   │   ├── ai.controller.ts
│       │   │   │   ├── vision.service.ts       # Claude Vision
│       │   │   │   ├── matching.service.ts     # DB 매칭
│       │   │   │   ├── orchestrator.service.ts # 통합
│       │   │   │   └── prompts/
│       │   │   │       ├── instrument.prompt.ts
│       │   │   │       └── certificate.prompt.ts
│       │   │   ├── master/
│       │   │   │   ├── manufacturers.service.ts
│       │   │   │   ├── models.service.ts
│       │   │   │   └── kolas.service.ts
│       │   │   ├── uploads/
│       │   │   │   ├── uploads.controller.ts
│       │   │   │   └── s3.service.ts
│       │   │   └── audit/
│       │   ├── common/
│       │   │   ├── decorators/
│       │   │   ├── filters/             # 글로벌 에러 핸들러
│       │   │   ├── guards/
│       │   │   ├── interceptors/
│       │   │   ├── pipes/
│       │   │   └── types/
│       │   ├── config/
│       │   │   ├── database.config.ts
│       │   │   ├── jwt.config.ts
│       │   │   └── aws.config.ts
│       │   ├── database/
│       │   │   ├── migrations/
│       │   │   │   ├── 001_init.sql
│       │   │   │   └── 002_seed.sql
│       │   │   └── data-source.ts        # TypeORM
│       │   ├── jobs/                     # Bull queues
│       │   │   ├── notification.processor.ts
│       │   │   └── report.processor.ts
│       │   ├── app.module.ts
│       │   └── main.ts
│       ├── test/
│       └── package.json
│
├── packages/
│   ├── types/                        # 공유 TypeScript 타입
│   │   ├── src/
│   │   │   ├── api/                  # API 요청·응답 타입
│   │   │   ├── domain/               # 도메인 모델
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── ui/                           # 공유 React 컴포넌트 (선택, Phase 2)
│   │   └── ...
│   │
│   ├── config/                       # 공유 ESLint, TSConfig 등
│   │   ├── eslint-preset.js
│   │   ├── tsconfig.base.json
│   │   └── tailwind-preset.js
│   │
│   └── utils/                        # 공유 유틸 (validators, formatters)
│       └── ...
│
├── infra/                            # 인프라 (Phase 2)
│   ├── docker/
│   │   ├── api.Dockerfile
│   │   ├── web.Dockerfile
│   │   └── docker-compose.yml
│   └── terraform/                    # AWS 인프라 코드 (Phase 2)
│
├── scripts/                          # 개발 보조 스크립트
│   ├── seed-master-data.ts           # 마스터 DB 채우기
│   ├── import-models-csv.ts          # CSV → DB
│   └── generate-test-photos.ts
│
├── docs/                             # 본 개발문서들
│   ├── 00_README.md
│   ├── 01_PRD.md
│   └── ...
│
├── .env.example
├── .gitignore
├── package.json                      # 루트 (workspaces)
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
└── README.md
```

---

## 3. 패키지별 책임

### `apps/web`
- 데스크톱·태블릿 사용자용 풀 기능 UI
- 관리자(Admin) 작업 중심: 보고서, 설정, 마스터 등록
- 서버 컴포넌트(RSC) 적극 활용

### `apps/mobile`
- 현장 사용자용
- 핵심 기능: 사진 등록, 빠른 조회, 알림 받기
- 오프라인 큐잉 필수

### `apps/api`
- 단일 백엔드 (웹·모바일 공유)
- NestJS 모듈 기반 분리
- TypeORM + PostgreSQL

### `packages/types`
- API 요청·응답 타입
- 도메인 모델 (Instrument, Calibration, ...)
- 웹·모바일·API 모두 import

```typescript
// packages/types/src/domain/instrument.ts
export interface Instrument {
  id: string;
  assetCode: string;
  serialNo: string | null;
  status: InstrumentStatus;
  nextCalibrationDate: string; // ISO date
  // ...
}

export type InstrumentStatus =
  | 'active'
  | 'calibrating'
  | 'repairing'
  | 'suspended'
  | 'discarded';
```

### `packages/config`
- 모든 앱이 공유하는 설정
- ESLint, Prettier, TSConfig 베이스

---

## 4. 모듈 분할 원칙 (백엔드)

### 4.1 도메인 중심 모듈
- 각 모듈은 하나의 도메인 책임 (Instruments, Calibrations 등)
- 모듈 간 의존성은 단방향 (Calibrations → Instruments OK, 역방향 ❌)

### 4.2 모듈 내부 구조
```
modules/instruments/
├── instruments.module.ts        # @Module 정의
├── instruments.controller.ts    # HTTP 핸들러
├── instruments.service.ts       # 비즈니스 로직
├── instruments.repository.ts    # DB 접근 (optional)
├── entities/
│   └── instrument.entity.ts     # TypeORM 엔티티
├── dto/
│   ├── create-instrument.dto.ts
│   ├── update-instrument.dto.ts
│   └── query-instruments.dto.ts
└── instruments.spec.ts          # 단위 테스트
```

### 4.3 공통 모듈
- `common/` — 데코레이터, 가드, 필터, 파이프
- `config/` — 환경설정
- `database/` — 마이그레이션, 시드

---

## 5. 환경 변수

### `.env.example`
```bash
# === API Server ===
NODE_ENV=development
PORT=3001
APP_URL=http://localhost:3000

# === Database ===
DATABASE_URL=postgresql://metroai:password@localhost:5432/metroai_db
DATABASE_POOL_SIZE=20

# === JWT ===
JWT_ACCESS_SECRET=replace-me-strong-secret
JWT_REFRESH_SECRET=replace-me-another-strong-secret
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=14d

# === Anthropic ===
ANTHROPIC_API_KEY=sk-ant-...

# === AWS / S3 ===
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=metroai-uploads

# === Kakao Alimtalk (NHN 비즈메시지) ===
KAKAO_APP_ID=...
KAKAO_API_KEY=...
KAKAO_SENDER_KEY=...

# === Email (SendGrid or AWS SES) ===
EMAIL_PROVIDER=ses
EMAIL_FROM=no-reply@metroai.kr

# === Redis (캐시·큐) ===
REDIS_URL=redis://localhost:6379

# === Logging ===
LOG_LEVEL=debug
SENTRY_DSN=
```

### 모바일 (`apps/mobile/.env.example`)
```bash
EXPO_PUBLIC_API_URL=http://localhost:3001/v1
EXPO_PUBLIC_S3_BUCKET=metroai-uploads
```

### 웹 (`apps/web/.env.example`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 6. 의존성 (package.json 핵심)

### `apps/api/package.json`
```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/swagger": "^7.0.0",
    "@nestjs/bull": "^10.0.0",
    "@nestjs/schedule": "^4.0.0",
    "typeorm": "^0.3.0",
    "pg": "^8.11.0",
    "bcrypt": "^5.1.0",
    "passport-jwt": "^4.0.0",
    "@anthropic-ai/sdk": "^0.30.0",
    "aws-sdk": "^2.1500.0",
    "sharp": "^0.33.0",
    "puppeteer": "^21.0.0",
    "bull": "^4.11.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0",
    "@metroai/types": "workspace:*"
  }
}
```

### `apps/web/package.json`
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "tailwindcss": "^3.4.0",
    "lucide-react": "^0.300.0",
    "@radix-ui/react-*": "...",
    "@metroai/types": "workspace:*"
  }
}
```

### `apps/mobile/package.json`
```json
{
  "dependencies": {
    "expo": "~50.0.0",
    "react-native": "0.73.0",
    "expo-camera": "~14.0.0",
    "expo-image-manipulator": "~11.8.0",
    "expo-secure-store": "~12.8.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/native-stack": "^6.9.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0",
    "@metroai/types": "workspace:*"
  }
}
```

---

## 7. 빌드 & 실행 (Turborepo)

### 루트 `turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {}
  }
}
```

### 명령어
```bash
# 전체 개발 모드 (API + 웹 + 모바일 동시)
pnpm dev

# 백엔드만
pnpm --filter api dev

# 웹만
pnpm --filter web dev

# 모바일만
pnpm --filter mobile start

# 빌드
pnpm build

# 테스트
pnpm test

# DB 마이그레이션
pnpm --filter api migration:run
pnpm --filter api seed:run
```

---

## 8. Git 워크플로우 (영민님 룰 반영)

### 브랜치 전략
```
main           ← 안정 (배포 가능)
  ↑
codex-work     ← Claude Code 작업 (영민님 룰)
  ↑
feature/*      ← 개별 기능 (선택)
```

### 커밋 규칙
```
feat(instruments): 사진 등록 시 GPS 자동 저장
fix(auth): 리프레시 토큰 만료 처리 오류 수정
refactor(ai): vision 서비스 매칭 로직 분리
docs: API 명세 업데이트
chore: 의존성 업데이트
```

### Claude Code 작업 전 체크
1. `git status` 깨끗한지 확인
2. `git checkout codex-work`
3. 백업 커밋: `git commit -am "WIP: before [작업명]"`
4. 작업 진행
5. `git status`, diff 확인
6. 빌드·테스트 통과 확인
7. 커밋

---

## 9. 인프라 (Phase 1 단순화)

### 개발 환경
- 로컬 PostgreSQL (영민님 SIMS와 같은 머신, DB만 분리)
- 로컬 MinIO (S3 호환)
- 로컬 Redis

### 스테이징/프로덕션 (Phase 1)
- **API**: AWS EC2 t3.medium 1대 또는 Vercel (서버리스 검토)
- **DB**: AWS RDS PostgreSQL db.t3.small
- **Storage**: AWS S3
- **CDN**: CloudFront
- **DNS**: Route 53
- **모니터링**: Sentry (에러), CloudWatch (메트릭)

### 예상 월 인프라 비용 (Phase 1)
- EC2: $30
- RDS: $25
- S3 + CloudFront: $10
- Sentry Free: $0
- **합계 약 $65~75/월**

---

## 10. 다음 단계

→ `08_DEV_ROADMAP.md`에서 위 구조를 실제 코드로 채워나갈 주차별 계획 확인
