-- ============================================================================
-- MetroAI Database Schema
-- PostgreSQL 16+
-- Version: 0.1.0 (Phase 1 MVP)
-- ============================================================================
-- 실행 방법:
--   psql -U postgres -d metroai -f 03_DATABASE_SCHEMA.sql
--   psql -U postgres -d metroai -f 03b_SEED_DATA.sql
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search

-- ============================================================================
-- 1. 사업장 (Tenant) 및 사용자
-- ============================================================================

CREATE TABLE tenants (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(200) NOT NULL,
  business_no     VARCHAR(20),                    -- 사업자등록번호
  address         TEXT,
  logo_url        TEXT,
  plan            VARCHAR(20) DEFAULT 'free',     -- free/basic/pro/enterprise
  settings        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  name            VARCHAR(100) NOT NULL,
  phone           VARCHAR(20),
  role            VARCHAR(20) DEFAULT 'operator', -- admin/manager/operator
  email_verified  BOOLEAN DEFAULT FALSE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE departments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  manager_id      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- ============================================================================
-- 2. 마스터 데이터 (제조사, 모델, KOLAS)
-- ============================================================================

-- KOLAS 568종 카테고리 마스터
CREATE TABLE kolas_categories (
  id                      SERIAL PRIMARY KEY,
  major_category          VARCHAR(50) NOT NULL,   -- 42개 중분류 (역학, 전기 등)
  sub_category            VARCHAR(100) NOT NULL,  -- 568종 세부 분류
  description             TEXT,
  standard_cycle_months   INT NOT NULL,           -- KOLAS 표준 교정주기
  measure_unit            VARCHAR(20),            -- 기본 단위
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kolas_major ON kolas_categories(major_category);
CREATE INDEX idx_kolas_sub_trgm ON kolas_categories USING gin(sub_category gin_trgm_ops);

-- 제조사 마스터 (글로벌, 모든 사업장 공유)
CREATE TABLE manufacturers (
  id              SERIAL PRIMARY KEY,
  name_ko         VARCHAR(100) NOT NULL,
  name_en         VARCHAR(100) NOT NULL,
  aliases         TEXT[],                         -- ["CAS Corp", "카스코퍼레이션"]
  logo_url        TEXT,
  country         VARCHAR(50),
  website         TEXT,
  category_hint   VARCHAR(50),                    -- "scale", "caliper" 등 주요 카테고리
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mfr_name_ko_trgm ON manufacturers USING gin(name_ko gin_trgm_ops);
CREATE INDEX idx_mfr_name_en_trgm ON manufacturers USING gin(name_en gin_trgm_ops);

-- 모델 마스터 (글로벌, 모든 사업장 공유)
CREATE TABLE models (
  id                  SERIAL PRIMARY KEY,
  manufacturer_id     INT NOT NULL REFERENCES manufacturers(id),
  kolas_category_id   INT REFERENCES kolas_categories(id),
  model_name          VARCHAR(100) NOT NULL,
  model_family        VARCHAR(100),               -- 시리즈명
  measure_range_min   DECIMAL(15, 6),
  measure_range_max   DECIMAL(15, 6),
  measure_unit        VARCHAR(20),
  accuracy_class      VARCHAR(50),
  spec_sheet_url      TEXT,
  image_url           TEXT,
  is_verified         BOOLEAN DEFAULT FALSE,      -- 운영자 검증 여부
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(manufacturer_id, model_name)
);

CREATE INDEX idx_models_mfr ON models(manufacturer_id);
CREATE INDEX idx_models_kolas ON models(kolas_category_id);
CREATE INDEX idx_models_name_trgm ON models USING gin(model_name gin_trgm_ops);

-- ============================================================================
-- 3. 측정기 (Instruments) - 사업장별 데이터
-- ============================================================================

CREATE TABLE instruments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- 식별
  asset_code            VARCHAR(50) NOT NULL,     -- 사내 관리번호 (MA-YYYYMMDD-####)
  serial_number         VARCHAR(100),

  -- 분류 (마스터 데이터 참조)
  kolas_category_id     INT REFERENCES kolas_categories(id),
  manufacturer_id       INT REFERENCES manufacturers(id),
  model_id              INT REFERENCES models(id),

  -- 백업용 텍스트 (모델이 마스터 DB에 없을 때)
  category_text         VARCHAR(100),
  manufacturer_text     VARCHAR(100),
  model_text            VARCHAR(100),

  -- 스펙
  measure_range_min     DECIMAL(15, 6),
  measure_range_max     DECIMAL(15, 6),
  measure_unit          VARCHAR(20),
  accuracy_class        VARCHAR(50),

  -- 운용 정보
  department_id         UUID REFERENCES departments(id),
  location              VARCHAR(200),             -- 보관 위치 (자유 텍스트)
  custodian_id          UUID REFERENCES users(id),
  usage_process         VARCHAR(200),             -- 사용 공정

  -- 상태
  status                VARCHAR(30) DEFAULT 'active', -- active/calibrating/repairing/suspended/discarded
  status_changed_at     TIMESTAMPTZ DEFAULT NOW(),

  -- 자산 정보
  acquired_at           DATE,
  acquired_cost         DECIMAL(15, 2),
  warranty_until        DATE,

  -- 교정 주기
  cycle_months          INT NOT NULL,             -- 적용 주기 (KOLAS 기본 또는 조정값)
  cycle_adjusted        BOOLEAN DEFAULT FALSE,
  cycle_adjusted_reason TEXT,
  last_calibration_at   DATE,
  next_calibration_at   DATE,

  -- 폐기 정보
  discarded_at          TIMESTAMPTZ,
  discarded_reason      TEXT,
  discarded_by          UUID REFERENCES users(id),

  -- 메타데이터
  notes                 TEXT,
  ai_recognition        JSONB,                    -- AI 인식 원본 데이터 보관
  created_by            UUID REFERENCES users(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id, asset_code)
);

CREATE INDEX idx_inst_tenant ON instruments(tenant_id);
CREATE INDEX idx_inst_dept ON instruments(department_id);
CREATE INDEX idx_inst_status ON instruments(tenant_id, status);
CREATE INDEX idx_inst_next_cal ON instruments(tenant_id, next_calibration_at)
  WHERE status = 'active';
CREATE INDEX idx_inst_serial ON instruments(tenant_id, serial_number);

-- 측정기 사진 (1개 측정기에 여러 장)
CREATE TABLE instrument_photos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instrument_id   UUID NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  s3_key          VARCHAR(500) NOT NULL,
  is_primary      BOOLEAN DEFAULT FALSE,          -- 대표 사진
  is_nameplate    BOOLEAN DEFAULT FALSE,          -- 명판 사진 (AI 인식용)
  uploaded_by     UUID REFERENCES users(id),
  uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_photos_inst ON instrument_photos(instrument_id);

-- 측정기 이동 이력 (부서/위치 변경)
CREATE TABLE instrument_movements (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instrument_id         UUID NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  from_department_id    UUID REFERENCES departments(id),
  to_department_id      UUID REFERENCES departments(id),
  from_location         VARCHAR(200),
  to_location           VARCHAR(200),
  moved_at              TIMESTAMPTZ DEFAULT NOW(),
  moved_by              UUID REFERENCES users(id),
  reason                TEXT
);

CREATE INDEX idx_moves_inst ON instrument_movements(instrument_id);

-- ============================================================================
-- 4. 교정 이력 (Calibrations)
-- ============================================================================

CREATE TABLE calibration_orgs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID REFERENCES tenants(id),    -- NULL이면 공용 (KOLAS 공인기관)
  name            VARCHAR(200) NOT NULL,
  is_kolas        BOOLEAN DEFAULT FALSE,
  kolas_no        VARCHAR(50),                    -- KOLAS 인정번호
  contact_phone   VARCHAR(20),
  contact_email   VARCHAR(255),
  address         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE calibrations (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instrument_id         UUID NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,

  -- 실시 정보
  performed_at          DATE NOT NULL,
  calibration_org_id    UUID REFERENCES calibration_orgs(id),
  calibration_org_text  VARCHAR(200),             -- 마스터 DB에 없는 기관
  performed_by_name     VARCHAR(100),

  -- 측정 데이터
  as_found_data         JSONB,                    -- 교정 전 측정값 [{point, measured, reference, error}]
  as_left_data          JSONB,                    -- 교정 후 측정값
  uncertainty           DECIMAL(15, 8),           -- 측정 불확도

  -- 결과
  result                VARCHAR(20),              -- pass/conditional/fail
  certificate_no        VARCHAR(100),
  certificate_s3_key    VARCHAR(500),             -- 성적서 PDF S3 경로
  cost                  DECIMAL(15, 2),

  -- 메타
  notes                 TEXT,
  created_by            UUID REFERENCES users(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ                -- soft delete
);

CREATE INDEX idx_cal_inst ON calibrations(instrument_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_cal_performed ON calibrations(performed_at);

-- ============================================================================
-- 5. 수리 이력 (Repairs)
-- ============================================================================

CREATE TABLE repairs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instrument_id   UUID NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  reported_at     DATE NOT NULL,
  completed_at    DATE,
  symptom         TEXT,
  action_taken    TEXT,
  cost            DECIMAL(15, 2),
  vendor_name     VARCHAR(200),
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_repair_inst ON repairs(instrument_id);

-- ============================================================================
-- 6. 알림 (Notifications)
-- ============================================================================

CREATE TABLE notification_templates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            VARCHAR(50) UNIQUE NOT NULL,    -- 'calibration_d30', 'calibration_d7' 등
  channel         VARCHAR(20) NOT NULL,           -- push/kakao/sms/email
  title_template  VARCHAR(200),
  body_template   TEXT,
  kakao_template_code VARCHAR(50),                -- 카카오 알림톡 템플릿 코드
  is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id),
  instrument_id   UUID REFERENCES instruments(id),

  template_code   VARCHAR(50),
  channel         VARCHAR(20) NOT NULL,
  recipient       VARCHAR(255),                   -- email, phone 등
  title           VARCHAR(200),
  body            TEXT,

  status          VARCHAR(20) DEFAULT 'pending',  -- pending/sent/failed/cancelled
  sent_at         TIMESTAMPTZ,
  error_message   TEXT,

  scheduled_at    TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notif_tenant ON notifications(tenant_id);
CREATE INDEX idx_notif_user ON notifications(user_id);
CREATE INDEX idx_notif_scheduled ON notifications(status, scheduled_at)
  WHERE status = 'pending';

-- 사용자별 알림 설정
CREATE TABLE notification_preferences (
  user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  push_enabled    BOOLEAN DEFAULT TRUE,
  kakao_enabled   BOOLEAN DEFAULT TRUE,
  sms_enabled     BOOLEAN DEFAULT TRUE,
  email_enabled   BOOLEAN DEFAULT TRUE,
  quiet_hours_start TIME,                          -- 야간 알림 차단
  quiet_hours_end TIME,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. 감사 로그 (Audit Log)
-- ============================================================================

CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID REFERENCES tenants(id),
  user_id         UUID REFERENCES users(id),
  entity_type     VARCHAR(50) NOT NULL,           -- 'instrument', 'calibration' 등
  entity_id       UUID NOT NULL,
  action          VARCHAR(20) NOT NULL,           -- 'create', 'update', 'delete'
  before_data     JSONB,
  after_data      JSONB,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id, created_at DESC);

-- ============================================================================
-- 8. 보고서 (Reports)
-- ============================================================================

CREATE TABLE reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  report_type     VARCHAR(50) NOT NULL,           -- 'inventory', 'calibration_history', 'iso9001' 등
  title           VARCHAR(200),
  parameters      JSONB,                          -- 보고서 생성 시 사용된 필터
  s3_key          VARCHAR(500),                   -- PDF S3 경로
  generated_by    UUID REFERENCES users(id),
  generated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_tenant ON reports(tenant_id, generated_at DESC);

-- ============================================================================
-- 9. 트리거 - updated_at 자동 갱신
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_instruments_updated BEFORE UPDATE ON instruments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_calibrations_updated BEFORE UPDATE ON calibrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 10. 뷰 (자주 쓰는 쿼리)
-- ============================================================================

-- 교정 임박 측정기 뷰
CREATE OR REPLACE VIEW v_instruments_upcoming_calibration AS
SELECT
  i.id,
  i.tenant_id,
  i.asset_code,
  i.serial_number,
  COALESCE(m.model_name, i.model_text) AS model_display,
  COALESCE(mfr.name_ko, i.manufacturer_text) AS manufacturer_display,
  COALESCE(kc.sub_category, i.category_text) AS category_display,
  d.name AS department_name,
  i.next_calibration_at,
  (i.next_calibration_at - CURRENT_DATE)::INT AS days_until_calibration,
  CASE
    WHEN i.next_calibration_at < CURRENT_DATE THEN 'overdue'
    WHEN i.next_calibration_at <= CURRENT_DATE + INTERVAL '30 days' THEN 'imminent'
    ELSE 'normal'
  END AS calibration_status
FROM instruments i
LEFT JOIN models m ON m.id = i.model_id
LEFT JOIN manufacturers mfr ON mfr.id = i.manufacturer_id
LEFT JOIN kolas_categories kc ON kc.id = i.kolas_category_id
LEFT JOIN departments d ON d.id = i.department_id
WHERE i.status = 'active';

-- ============================================================================
-- 완료
-- ============================================================================

-- 시드 데이터는 03b_SEED_DATA.sql 파일에 별도로 정의됨
