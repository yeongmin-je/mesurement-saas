# MetroAI 프로토타입 배포 가이드 (폰 테스트용)

> Vercel(웹) + Railway(API+DB+Redis) + Cloudflare R2(사진) + Anthropic(AI 인식)
> 폰에서 `https://your-app.vercel.app`으로 접속해서 바로 사용 가능.
>
> 예상 소요: 30~45분 · 예상 비용: $0 (모두 무료 티어)

---

## 0. 준비물 체크리스트

- [ ] GitHub 저장소 (`yeongmin-je/mesurement-saas`) ✅ 이미 있음
- [ ] [Vercel 계정](https://vercel.com/signup) (GitHub 로그인 가능)
- [ ] [Railway 계정](https://railway.app/login) ($5 무료 크레딧)
- [ ] [Cloudflare 계정](https://dash.cloudflare.com/sign-up) (R2 사용)
- [ ] [Anthropic 콘솔](https://console.anthropic.com/) API 키
  - 좌측 메뉴 **API Keys** → **Create Key** → 복사
  - 첫 가입 시 $5 무료 크레딧 (사진 100~200장 인식 가능)

> R2 안 쓰고 AWS S3로 가도 됨. 무료 12개월이라 처음엔 부담 없음.

---

## 1. Railway에 API + Postgres + Redis 배포 (15분)

### 1-1. 프로젝트 만들기

1. <https://railway.app/new> → **Deploy from GitHub repo** 선택
2. `yeongmin-je/mesurement-saas` 선택
3. 처음 prompt: **Add variables later** 클릭 (env는 곧 추가)
4. 자동으로 `infra/docker/api.Dockerfile` 빌드 시작

### 1-2. Postgres 추가

1. 프로젝트 대시보드 → **+ New** → **Database** → **Add PostgreSQL**
2. 생성되면 좌측에 `Postgres` 서비스 표시
3. **Connect** 탭 → `DATABASE_URL` 복사

### 1-3. Redis 추가

1. **+ New** → **Database** → **Add Redis**
2. **Connect** 탭 → `REDIS_URL` 복사

### 1-4. API 서비스 환경 변수 설정

API 서비스 클릭 → **Variables** 탭 → **Raw Editor** 모드 → 아래 붙여넣기:

```bash
NODE_ENV=production
PORT=3001

# Postgres / Redis (Railway 자동 주입 가능 — 위에서 복사한 값 또는 참조)
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# JWT — openssl rand -base64 32 또는 1Password로 강한 secret 2개 생성
JWT_ACCESS_SECRET=<openssl rand -base64 32로 생성>
JWT_REFRESH_SECRET=<위와 다른 값>
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=14d

# Anthropic
ANTHROPIC_API_KEY=sk-ant-api03-...

# S3 / Cloudflare R2 (Section 2에서 값 채움)
AWS_REGION=auto
AWS_ACCESS_KEY_ID=<R2 access key>
AWS_SECRET_ACCESS_KEY=<R2 secret>
S3_BUCKET_NAME=metroai-uploads
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com

# 시드 데이터 자동 적재 (첫 부팅에만 true, 이후 false로 바꿔도 됨)
SEED_ON_BOOT=true

# CORS (Section 3에서 Vercel URL 채움)
CORS_ORIGINS=https://your-app.vercel.app

# 알림 채널 stub 동작 (실 발송은 Week 11에 NHN/SES 연동)
EMAIL_FROM=no-reply@metroai.kr
LOG_LEVEL=info
```

### 1-5. 도메인 노출

1. API 서비스 → **Settings** → **Networking** → **Generate Domain**
2. `https://metroai-api-production.up.railway.app` 같은 URL 받음
3. 헬스체크: `curl https://<your-railway-url>/v1/health` → `{ "status": "ok", "db": "up" }`

> 처음 빌드는 5~8분. `npx prisma db push`가 자동 실행되어 테이블이 생기고, `SEED_ON_BOOT=true`라면 KOLAS/제조사/모델/데모 사업장이 자동 적재됩니다.

---

## 2. Cloudflare R2에 사진 버킷 만들기 (5분)

R2는 10GB까지 무료. S3 호환이라 코드 수정 없음.

1. <https://dash.cloudflare.com/> → 좌측 **R2** → **Create bucket**
   - 이름: `metroai-uploads`
   - 리전: `auto`
2. 생성된 버킷 → 우측 상단 **R2 API Tokens** → **Create API Token**
   - 권한: **Admin Read & Write**
   - **Bucket** 선택: `metroai-uploads`만 체크
3. 발급된 `Access Key ID` + `Secret Access Key` + `endpoint URL`을 Railway 변수에 채움:
   ```bash
   AWS_ACCESS_KEY_ID=<Access Key ID>
   AWS_SECRET_ACCESS_KEY=<Secret>
   S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
   S3_BUCKET_NAME=metroai-uploads
   ```
4. CORS 설정 (브라우저/모바일 PUT 허용):
   - 버킷 → **Settings** → **CORS Policy** → 아래 붙여넣기
   ```json
   [
     {
       "AllowedOrigins": ["*"],
       "AllowedMethods": ["GET", "PUT", "HEAD"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
5. **공개 액세스 활성화**: 버킷 → **Settings** → **Public Access** → R2.dev 서브도메인 활성화
   - 또는 짧은 만료 presigned URL만 쓰면 비활성도 OK (코드가 그렇게 동작)

---

## 3. Vercel에 웹 배포 (10분)

### 3-1. 프로젝트 import

1. <https://vercel.com/new>
2. `yeongmin-je/mesurement-saas` 선택 → **Import**
3. **Configure Project**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `apps/web` 클릭 → 선택
   - **Build & Output Settings** 펼치기:
     - Build Command: `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @metroai/web build`
     - Install Command: `echo skip`
     - Output Directory: `.next`

### 3-2. 환경 변수

```bash
NEXT_PUBLIC_API_URL=https://<your-railway-url>/v1
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

> Vercel URL은 첫 배포 후 자동 할당. 우선 placeholder로 넣고 배포 후 수정해도 됨.

### 3-3. 배포

**Deploy** 클릭 → 3~5분 대기.

성공하면 `https://mesurement-saas.vercel.app` 같은 URL 받음.

### 3-4. CORS 갱신

배포 끝난 URL을 Railway API의 `CORS_ORIGINS` 변수에 다시 넣고 API 재배포(자동).

---

## 4. 폰에서 접속하기

### 4-1. 웹 (가장 빠름)

1. 폰 브라우저에서 `https://your-app.vercel.app/` 열기
2. **가입하기** → 이메일/사업장 이름/비밀번호 입력
3. 또는 시드된 데모 계정 사용:
   - 이메일: `admin@demo.metroai.kr`
   - 비밀번호: `demo1234`

### 4-2. 폰 홈 화면에 추가 (PWA 느낌)

- **Safari (iOS)**: 공유 버튼 → **홈 화면에 추가**
- **Chrome (Android)**: 메뉴 → **앱 설치**

이러면 풀스크린으로 열리고 네이티브 앱 비슷한 느낌.

---

## 5. 테스트 시나리오 (5분)

1. **로그인** → 대시보드에서 통계 카드 4개 (보유 0/임박 0/만료 0/이번달 0) 확인
2. **측정기 → + 측정기 등록** → 부서/모델/측정범위 입력 → 등록
3. 측정기 상세에서 **교정 이력** 빈 상태 확인
4. **캘린더** 메뉴에서 차기 교정일 위치 확인 (도입일 + 12개월 자동 계산됨)
5. **보고서** 메뉴 → **ISO 심사** 선택 → 기간 선택 → **보고서 생성** → 30초 후 PDF 다운로드
6. **알림** 메뉴 빈 상태 확인 (스케줄러가 매일 06:00 KST 스캔)

### AI 사진 인식 테스트

웹에서는 사진 등록 플로우가 아직 없음 (모바일 전용). 대신 cURL로 직접 호출:

```bash
# 1) 로그인 토큰 받기
TOKEN=$(curl -s -X POST https://<railway-url>/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.metroai.kr","password":"demo1234"}' | jq -r .accessToken)

# 2) presigned URL 받기
RESP=$(curl -s -X POST https://<railway-url>/v1/photos/upload \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"fileName":"scale.jpg","contentType":"image/jpeg"}')
echo "$RESP" | jq

# 3) S3에 PUT (jpg 파일 준비)
UPLOAD_URL=$(echo "$RESP" | jq -r .uploadUrl)
PHOTO_ID=$(echo "$RESP" | jq -r .photoId)
curl -X PUT "$UPLOAD_URL" -H "Content-Type: image/jpeg" --data-binary @scale.jpg

# 4) AI 인식
curl -X POST https://<railway-url>/v1/ai/recognize-instrument \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"photoIds\":[\"$PHOTO_ID\"]}" | jq
```

---

## 6. 문제 해결

| 증상 | 원인 / 해결 |
|---|---|
| Railway 빌드 실패 — pnpm not found | `infra/docker/api.Dockerfile`이 `corepack enable pnpm` 함. 자동 해결됨 |
| `prisma db push` 실패 — extension 권한 | Railway Postgres는 `pg_trgm`, `uuid-ossp` 기본 제공. 만약 권한 오류 시 PG 콘솔에서 `CREATE EXTENSION` 수동 실행 |
| Vercel 빌드 OOM | apps/web/next.config.js의 `output: 'standalone'`은 Vercel에서 무시됨. 문제 없음 |
| 로그인 시 CORS 에러 | Railway API의 `CORS_ORIGINS`에 Vercel 도메인 정확히 넣었는지 확인 (https://, 슬래시 X) |
| 사진 업로드 403 | R2 CORS 정책 + Public Access 확인. presigned URL은 10분 유효 |
| AI 인식 503 | `ANTHROPIC_API_KEY` 확인. 크레딧 잔액 https://console.anthropic.com/settings/billing |
| 알림 안 옴 | 정상. Phase 1은 stub. NHN 비즈메시지 사업자 등록 후 Week 11에 실 발송 연결 |

---

## 7. 비용 모니터링

- **Railway**: 무료 $5 크레딧. API + Postgres + Redis 합쳐 월 $3~5 예상 → 1개월 무료, 그 후 종량
- **Vercel**: Hobby 플랜 무료 (월 100GB 대역폭 — 충분)
- **Cloudflare R2**: 10GB 저장 + 무료 송신 → 사진 1000장 정도까지 무료
- **Anthropic**: $5 무료 크레딧 → 사진 100~200장 인식 가능. 그 후 종량 (사진당 $0.05)

총 1개월 무료 → 그 후 월 $10~15면 베타 100개사까지 운영 가능.

---

## 8. 다음 단계

- 도메인 연결: Vercel + Railway 모두 커스텀 도메인 무료
- 이메일 발송: AWS SES 또는 Resend 키 추가 (Week 11)
- 카카오 알림톡: NHN 비즈메시지 사업자 등록 (영민님 별도 진행)
- 모바일 앱 배포: `pnpm --filter @metroai/mobile start --tunnel` + Expo Go 또는 EAS Build

## 9. 청소 / 종료

- Railway: 프로젝트 → Settings → Delete project
- Vercel: 프로젝트 → Settings → Delete
- R2: 버킷 비우고 Delete
- Anthropic: 키 회수 (콘솔에서 Revoke)
