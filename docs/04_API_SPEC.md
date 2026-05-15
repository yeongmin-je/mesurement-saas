# 04. API Specification

## 개요

MetroAI 백엔드의 REST API 명세입니다. OpenAPI 3.0 스타일로 작성되었습니다.

- **Base URL**: `https://api.metroai.kr/v1` (운영) / `http://localhost:3001/v1` (개발)
- **인증**: JWT Bearer Token (`Authorization: Bearer <token>`)
- **응답 포맷**: JSON
- **에러 포맷**: `{ "error": { "code": "ERR_CODE", "message": "..." } }`

---

## 인증 (Authentication)

### POST `/auth/register`

회원가입.

**Request**:
```json
{
  "email": "test@example.com",
  "password": "secret1234",
  "name": "홍길동",
  "phone": "010-1234-5678",
  "tenantName": "테스트 사업장"
}
```

**Response 201**:
```json
{
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "name": "홍길동",
    "role": "admin",
    "tenantId": "uuid"
  },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

### POST `/auth/login`

로그인.

**Request**:
```json
{ "email": "test@example.com", "password": "secret1234" }
```

**Response 200**: `register`와 동일 형식

### POST `/auth/refresh`

Access 토큰 갱신.

**Request**:
```json
{ "refreshToken": "eyJ..." }
```

### POST `/auth/logout`

로그아웃 (Refresh 토큰 무효화).

---

## 측정기 (Instruments)

### GET `/instruments`

측정기 목록 조회.

**Query Parameters**:
- `q`: 검색어 (모델명, 시리얼, 관리번호)
- `status`: `active|calibrating|repairing|suspended|discarded`
- `departmentId`: UUID
- `kolasCategoryId`: integer
- `manufacturerId`: integer
- `calibrationStatus`: `normal|imminent|overdue`
- `sort`: `recent|next_calibration|name` (default: recent)
- `page`: integer (default: 1)
- `limit`: integer (default: 20, max: 100)

**Response 200**:
```json
{
  "data": [
    {
      "id": "uuid",
      "assetCode": "MA-20240315-0023",
      "serialNumber": "SN-20240315-A7821",
      "model": {
        "id": 12,
        "name": "CBX-220H",
        "manufacturer": "CAS"
      },
      "category": "전자저울 2급",
      "department": "품질관리팀",
      "status": "active",
      "nextCalibrationAt": "2026-06-14",
      "calibrationStatus": "imminent",
      "primaryPhotoUrl": "https://..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "totalPages": 8
  }
}
```

### POST `/instruments`

측정기 등록 (사진 등록 시 마지막 확정 단계).

**Request**:
```json
{
  "assetCode": "MA-20240315-0023",
  "serialNumber": "SN-20240315-A7821",
  "kolasCategoryId": 2,
  "manufacturerId": 1,
  "modelId": 12,
  "measureRangeMin": 0,
  "measureRangeMax": 220,
  "measureUnit": "g",
  "accuracyClass": "1mg",
  "departmentId": "uuid",
  "location": "1공장 QC실 A-3",
  "custodianId": "uuid",
  "acquiredAt": "2024-03-15",
  "acquiredCost": 1500000,
  "cycleMonths": 12,
  "photoIds": ["uuid1", "uuid2"],
  "aiRecognition": { /* AI 인식 결과 원본, 학습용 */ }
}
```

**Response 201**:
```json
{
  "id": "uuid",
  "assetCode": "MA-20240315-0023",
  "nextCalibrationAt": "2025-03-15",
  ...
}
```

### GET `/instruments/:id`

측정기 상세 조회.

**Response 200**:
```json
{
  "id": "uuid",
  "assetCode": "MA-20240315-0023",
  "serialNumber": "SN-...",
  "category": { "id": 2, "name": "전자저울 2급" },
  "manufacturer": { "id": 1, "name": "CAS" },
  "model": { "id": 12, "name": "CBX-220H" },
  "measureRange": { "min": 0, "max": 220, "unit": "g" },
  "accuracyClass": "1mg",
  "department": { "id": "uuid", "name": "품질관리팀" },
  "location": "1공장 QC실 A-3",
  "custodian": { "id": "uuid", "name": "김철수" },
  "status": "active",
  "acquiredAt": "2024-03-15",
  "acquiredCost": 1500000,
  "cycleMonths": 12,
  "lastCalibrationAt": "2024-06-15",
  "nextCalibrationAt": "2025-06-15",
  "daysUntilCalibration": 30,
  "calibrationStatus": "imminent",
  "photos": [
    { "id": "uuid", "url": "https://...", "isPrimary": true, "isNameplate": false }
  ],
  "calibrationHistory": [
    { /* 최근 5건 */ }
  ],
  "notes": "..."
}
```

### PATCH `/instruments/:id`

측정기 수정.

### DELETE `/instruments/:id`

측정기 폐기 (soft delete, status → discarded).

**Request**:
```json
{ "reason": "수리 불가, 정확도 회복 불가능" }
```

### POST `/instruments/:id/movements`

부서/위치 이동 기록.

**Request**:
```json
{
  "toDepartmentId": "uuid",
  "toLocation": "2공장 라인3",
  "reason": "공정 이관"
}
```

---

## AI 인식 (AI Recognition)

### POST `/ai/recognize-instrument`

측정기 사진 → AI 인식 결과 반환 (등록 전 단계).

**Request** (multipart/form-data):
```
files[]: <image1.jpg>
files[]: <image2.jpg>  (선택, 최대 3장)
photoTypes[]: "nameplate"  (선택, 사진별 타입 힌트)
```

**Response 200**:
```json
{
  "recognitionId": "uuid",
  "confidence": 94,
  "suggestions": {
    "category": {
      "value": { "id": 2, "name": "전자저울 2급" },
      "confidence": 96,
      "alternatives": [
        { "id": 1, "name": "전자저울 1급", "confidence": 0.12 },
        { "id": 3, "name": "전자저울 3급", "confidence": 0.05 }
      ]
    },
    "manufacturer": {
      "value": { "id": 1, "name": "CAS" },
      "confidence": 98,
      "alternatives": []
    },
    "model": {
      "value": { "id": 12, "name": "CBX-220H" },
      "confidence": 92,
      "alternatives": [
        { "id": 13, "name": "CBX-320H", "confidence": 0.05 }
      ]
    },
    "serialNumber": {
      "value": "SN-20240315-A7821",
      "confidence": 89,
      "alternatives": []
    },
    "measureRange": {
      "value": { "min": 0, "max": 220, "unit": "g" },
      "confidence": 95
    },
    "accuracyClass": {
      "value": "1mg",
      "confidence": 90
    }
  },
  "uploadedPhotos": [
    { "photoId": "uuid", "s3Key": "...", "previewUrl": "https://..." }
  ],
  "rawText": "CAS\nCBX-220H\nMAX: 220g\nd=1mg\nSN: 20240315-A7821",
  "rawAiResponse": { /* 원본 보관, 디버그용 */ }
}
```

**Error 400** — 사진 품질 불량:
```json
{
  "error": {
    "code": "POOR_IMAGE_QUALITY",
    "message": "측정기 명판이 잘 보이도록 다시 촬영해주세요",
    "details": {
      "issue": "blur",
      "suggestion": "조명이 충분한 곳에서 정면으로 촬영"
    }
  }
}
```

### POST `/ai/recognize-instrument/feedback`

사용자가 AI 추천을 수정한 경우 피드백 전송 (모델 개선용).

**Request**:
```json
{
  "recognitionId": "uuid",
  "corrections": {
    "manufacturer": { "predicted": 1, "actual": 2 }
  }
}
```

---

## 사진 (Photos)

### POST `/photos/upload`

사진 직접 업로드 (presigned URL 발급).

**Request**:
```json
{
  "fileName": "scale-front.jpg",
  "contentType": "image/jpeg",
  "instrumentId": "uuid"  (선택)
}
```

**Response 200**:
```json
{
  "uploadUrl": "https://s3.../presigned",
  "s3Key": "tenant-id/...",
  "expiresIn": 600
}
```

### GET `/photos/:id`

사진 다운로드 (presigned URL).

---

## 교정 이력 (Calibrations)

### GET `/instruments/:instrumentId/calibrations`

특정 측정기의 교정 이력.

### POST `/instruments/:instrumentId/calibrations`

교정 이력 추가.

**Request**:
```json
{
  "performedAt": "2026-05-14",
  "calibrationOrgId": "uuid",
  "performedByName": "이교정",
  "asFoundData": [
    { "point": 100, "measured": 100.02, "reference": 100, "error": 0.02 },
    { "point": 200, "measured": 200.05, "reference": 200, "error": 0.05 }
  ],
  "asLeftData": [
    { "point": 100, "measured": 100.00, "reference": 100, "error": 0.00 }
  ],
  "uncertainty": 0.01,
  "result": "pass",
  "certificateNo": "KOLAS-2026-A1234",
  "certificateS3Key": "...",
  "cost": 50000
}
```

**Response 201**: 등록된 이력 + 측정기의 next_calibration_at 자동 갱신

### GET `/calibrations/upcoming`

내 사업장 교정 임박 측정기 (대시보드용).

**Query**:
- `daysAhead`: integer (default: 30)

---

## 알림 (Notifications)

### GET `/notifications`

내 알림 목록.

**Query**:
- `unreadOnly`: boolean

### POST `/notifications/test`

테스트 알림 발송 (개발용).

### PATCH `/notifications/preferences`

알림 설정 변경.

**Request**:
```json
{
  "pushEnabled": true,
  "kakaoEnabled": true,
  "smsEnabled": true,
  "quietHoursStart": "22:00",
  "quietHoursEnd": "07:00"
}
```

---

## 부서 (Departments)

### GET `/departments`
### POST `/departments`
### PATCH `/departments/:id`
### DELETE `/departments/:id`

표준 CRUD.

---

## 사용자 (Users)

### GET `/users` — 같은 tenant 사용자 목록
### POST `/users/invite` — 사용자 초대
### PATCH `/users/:id/role` — 권한 변경 (admin만)
### DELETE `/users/:id` — 사용자 제거 (admin만)

---

## 보고서 (Reports)

### POST `/reports/generate`

보고서 생성.

**Request**:
```json
{
  "type": "iso9001",
  "parameters": {
    "dateFrom": "2026-01-01",
    "dateTo": "2026-12-31",
    "departmentIds": []
  }
}
```

**Response 202**:
```json
{
  "reportId": "uuid",
  "status": "generating",
  "estimatedSeconds": 15
}
```

### GET `/reports/:id`

보고서 상태 + 다운로드 URL.

**Response 200**:
```json
{
  "id": "uuid",
  "type": "iso9001",
  "status": "completed",
  "downloadUrl": "https://...",
  "expiresAt": "2026-05-15T10:00:00Z"
}
```

### GET `/reports`

생성된 보고서 목록.

---

## 마스터 데이터 (Master Data)

### GET `/master/kolas-categories`

KOLAS 카테고리 목록.

**Query**:
- `q`: 검색어
- `majorCategory`: 중분류

### GET `/master/manufacturers`

제조사 목록.

### GET `/master/models`

모델 목록.

**Query**:
- `manufacturerId`: integer
- `q`: 검색어

### POST `/master/models/suggest`

DB에 없는 모델 추가 요청 (운영자 검토).

---

## 대시보드 (Dashboard)

### GET `/dashboard/summary`

홈 화면 핵심 지표.

**Response 200**:
```json
{
  "totalInstruments": 247,
  "activeInstruments": 235,
  "calibrationsThisMonth": 18,
  "calibrationsImminent": 12,
  "calibrationsOverdue": 3,
  "statusDistribution": {
    "active": 235,
    "calibrating": 5,
    "repairing": 2,
    "suspended": 2,
    "discarded": 3
  },
  "departmentDistribution": [
    { "departmentId": "uuid", "name": "품질관리팀", "count": 120 }
  ],
  "recentActivities": [
    {
      "type": "instrument_registered",
      "instrumentId": "uuid",
      "userName": "홍길동",
      "at": "2026-05-15T09:30:00Z"
    }
  ]
}
```

---

## 에러 코드

| 코드 | HTTP | 의미 |
|---|---|---|
| `UNAUTHORIZED` | 401 | 토큰 누락/만료 |
| `FORBIDDEN` | 403 | 권한 부족 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `VALIDATION_ERROR` | 422 | 입력 검증 실패 |
| `POOR_IMAGE_QUALITY` | 400 | 사진 품질 불량 |
| `AI_SERVICE_ERROR` | 502 | AI API 호출 실패 |
| `RATE_LIMIT_EXCEEDED` | 429 | 요청 제한 초과 |
| `INTERNAL_ERROR` | 500 | 서버 내부 오류 |

---

## Rate Limiting

| 엔드포인트 | 제한 |
|---|---|
| `/auth/*` | IP당 분 5회 |
| `/ai/recognize-instrument` | 사용자당 분 20회 |
| 그 외 GET | 사용자당 분 100회 |
| 그 외 POST/PATCH/DELETE | 사용자당 분 60회 |

---

**다음 문서**: `05_UI_FLOW.md`에서 위 API를 호출하는 화면 흐름을 정의합니다.
