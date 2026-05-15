# MetroAI — AI 계측기 관리 플랫폼

> 사진 한 장으로 측정기를 등록하고, AI가 KOLAS 표준주기로 교정 일정을 자동 관리하는 한국형 SaaS

## 📦 문서 인덱스

Claude Code에서 바로 작업 시작할 수 있도록 구성된 Phase 1 MVP 착수 패키지입니다.

### 읽는 순서

| # | 문서 | 목적 |
|---|---|---|
| 00 | README.md | 전체 인덱스 (지금 이 문서) |
| 01 | PRD.md | 제품 요구사항 — 왜 만드는가 |
| 02 | FUNCTIONAL_SPEC.md | 기능 요구서 — 무엇을 만드는가 |
| 03 | DATABASE_SCHEMA.sql | DB 스키마 (실행 가능) |
| 04 | API_SPEC.md | REST API 명세 |
| 05 | UI_FLOW.md | 화면 흐름 & 와이어프레임 |
| 06 | AI_INTEGRATION.md | Vision AI 연동 방식 |
| 07 | PROJECT_STRUCTURE.md | 폴더 구조 & 모노레포 구성 |
| 08 | DEV_ROADMAP.md | 주차별 작업 분할 (codex-work) |

## 🎯 Phase 1 MVP 범위

**구현할 것 (3대 핵심)**

1. **사진 등록**: Vision AI가 측정기 인식 → 드롭다운으로 사용자 확정
2. **자산 관리**: 등록된 측정기 CRUD, 검색, 필터, 상세 보기
3. **교정 주기 알림**: KOLAS 표준주기 자동 매칭, 만료 전 카카오톡/SMS 알림

**구현 안 할 것 (Phase 2 이후)**

- 교정기관 마켓플레이스
- 성적서 OCR (수동 업로드만 지원)
- 모바일 일일점검
- IoT 환경보상 모듈
- 다국어 지원 (한국어만)

## 🛠️ 기술 스택

```
Frontend Web  : Next.js 14 (App Router) + TypeScript + Tailwind
Mobile App    : React Native (Expo) + TypeScript
Backend API   : Node.js + NestJS + TypeScript
Database      : PostgreSQL 16
ORM           : Prisma
File Storage  : AWS S3 (또는 로컬 개발용 MinIO)
AI Vision     : Claude Vision API
Notification  : 카카오 알림톡 API + Twilio SMS
Auth          : NextAuth.js (Web) + JWT (Mobile/API)
Deployment    : Docker + Docker Compose
```

## 🔑 핵심 원칙

영민님의 SIMS 자산을 최대한 재활용하며, 다음 코딩 룰을 따릅니다.

1. **Plan-first**: 코드 작성 전 항상 계획 먼저
2. **Smallest unit**: 한 번에 하나의 관심사만 변경
3. **codex-work 브랜치**: 모든 AI 코딩 작업은 별도 브랜치에서
4. **TypeScript strict**: 타입 안정성 최우선
5. **No silent guessing**: 모르면 멈추고 질문
6. **Korean replies, English code comments**: 답변은 한국어, 코드 주석은 영어

## 📞 다음 단계

1. 이 폴더 전체를 GitHub repo로 푸시
2. Claude Code에서 `cd metroai && claude` 시작
3. `08_DEV_ROADMAP.md` Week 1부터 순서대로 진행

---

**버전**: 0.1.0 (2026-05-15)
