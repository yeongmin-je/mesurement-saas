-- ============================================================================
-- MetroAI Seed Data
-- 마스터 데이터 초기값 (KOLAS 카테고리, 제조사, 모델, 알림 템플릿)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. KOLAS 카테고리 시드 (Phase 1: 주요 50종, 전체 568종은 별도 작업)
-- ---------------------------------------------------------------------------

INSERT INTO kolas_categories (major_category, sub_category, standard_cycle_months, measure_unit) VALUES
-- 역학
('역학', '전자저울 1급', 12, 'g'),
('역학', '전자저울 2급', 12, 'g'),
('역학', '전자저울 3급', 12, 'kg'),
('역학', '전자저울 4급', 12, 'kg'),
('역학', '플랫폼 스케일', 12, 'kg'),
('역학', '트럭 스케일', 12, 'ton'),
('역학', '크레인 스케일', 12, 'kg'),
('역학', '분동 (1급)', 60, 'g'),
('역학', '분동 (2급)', 36, 'g'),
('역학', '로드셀', 12, 'kg'),

-- 길이
('길이', '디지털 캘리퍼', 12, 'mm'),
('길이', '버니어 캘리퍼', 12, 'mm'),
('길이', '디지털 마이크로미터', 6, 'mm'),
('길이', '아날로그 마이크로미터', 6, 'mm'),
('길이', '하이트 게이지', 12, 'mm'),
('길이', '다이얼 게이지', 12, 'mm'),
('길이', '게이지 블록', 36, 'mm'),
('길이', '레이저 측정기', 12, 'mm'),
('길이', '3차원 측정기 (CMM)', 12, 'mm'),

-- 온도
('온도', '디지털 온도계', 12, '°C'),
('온도', '백금저항온도계 (PRT)', 12, '°C'),
('온도', '열전대 (Thermocouple)', 12, '°C'),
('온도', '적외선 온도계', 12, '°C'),
('온도', '항온수조', 12, '°C'),
('온도', '온도 데이터로거', 12, '°C'),

-- 압력
('압력', '디지털 압력계', 12, 'bar'),
('압력', '부르돈 압력계', 12, 'bar'),
('압력', '진공계', 12, 'mbar'),
('압력', '차압계', 12, 'Pa'),

-- 전기
('전기', '디지털 멀티미터', 12, 'V'),
('전기', '클램프 미터', 12, 'A'),
('전기', '절연저항계', 12, 'MΩ'),
('전기', '접지저항계', 12, 'Ω'),
('전기', '오실로스코프', 12, 'V'),
('전기', '함수발생기', 12, 'Hz'),

-- 화학/물리화학
('화학', 'pH 미터', 6, 'pH'),
('화학', '전도도계', 12, 'µS/cm'),
('화학', '용존산소계', 12, 'mg/L'),
('화학', '굴절계', 12, 'Brix'),

-- 시간/주파수
('시간', '디지털 카운터', 12, 'Hz'),
('시간', '주파수 카운터', 12, 'Hz'),
('시간', '스톱워치', 12, 's'),

-- 음향/진동
('음향', '소음계', 12, 'dB'),
('음향', '진동계', 12, 'mm/s'),

-- 유량
('유량', '유량계 (액체)', 12, 'L/min'),
('유량', '유량계 (기체)', 12, 'Nm³/h'),

-- 가스
('가스', '가스 검지기', 6, 'ppm'),
('가스', 'CO2 측정기', 12, 'ppm'),

-- 광학
('광학', '조도계', 12, 'lux'),
('광학', '분광광도계', 12, 'nm'),

-- 환경
('환경', '온습도계', 12, '°C/%RH'),
('환경', '풍속계', 12, 'm/s');

-- ---------------------------------------------------------------------------
-- 2. 제조사 시드 (한국 주요 제조사 30곳)
-- ---------------------------------------------------------------------------

INSERT INTO manufacturers (name_ko, name_en, aliases, country, category_hint) VALUES
-- 저울 관련
('카스', 'CAS', ARRAY['CAS Corp', '카스코퍼레이션', '카스스케일'], 'KR', 'scale'),
('에이앤디', 'A&D', ARRAY['AND', 'A and D', 'AND Korea'], 'JP', 'scale'),
('메틀러 토레도', 'Mettler Toledo', ARRAY['Mettler-Toledo', 'METTLER'], 'CH', 'scale'),
('오하우스', 'OHAUS', ARRAY['Ohaus Corp'], 'US', 'scale'),
('사르토리우스', 'Sartorius', ARRAY['Sartorius AG'], 'DE', 'scale'),
('시마즈', 'Shimadzu', ARRAY['시마쯔', 'SHIMADZU'], 'JP', 'scale'),

-- 길이/정밀측정
('미츠토요', 'Mitutoyo', ARRAY['미쓰토요', 'MITUTOYO'], 'JP', 'caliper'),
('마르', 'Mahr', ARRAY['Mahr GmbH'], 'DE', 'caliper'),
('테사', 'Tesa', ARRAY['Tesa Technology', 'TESA'], 'CH', 'caliper'),
('인사이즈', 'Insize', ARRAY['INSIZE'], 'CN', 'caliper'),

-- 전기/계측
('플루크', 'Fluke', ARRAY['Fluke Corporation', 'FLUKE'], 'US', 'electrical'),
('히오키', 'Hioki', ARRAY['HIOKI', '히오끼'], 'JP', 'electrical'),
('요코가와', 'Yokogawa', ARRAY['YOKOGAWA', '요꼬가와'], 'JP', 'electrical'),
('키사이트', 'Keysight', ARRAY['Keysight Technologies', 'KEYSIGHT'], 'US', 'electrical'),
('테스토', 'Testo', ARRAY['TESTO', 'Testo SE'], 'DE', 'environmental'),

-- 압력
('위카', 'Wika', ARRAY['WIKA', 'Wika Alexander Wiegand'], 'DE', 'pressure'),
('드룩', 'Druck', ARRAY['GE Druck', 'DRUCK'], 'GB', 'pressure'),

-- 온도
('오메가', 'Omega', ARRAY['Omega Engineering', 'OMEGA'], 'US', 'temperature'),
('한나 인스트루먼츠', 'Hanna Instruments', ARRAY['HANNA', 'Hanna'], 'IT', 'chemistry'),

-- 화학
('호리바', 'Horiba', ARRAY['HORIBA', '호리바'], 'JP', 'chemistry'),

-- 기타 한국 제조사
('대성계기', 'Daesung Gauge', ARRAY['DSG', '대성'], 'KR', 'pressure'),
('한국교정계측기', 'Korea Calibration Instrument', ARRAY['KCI'], 'KR', 'general'),
('이노템', 'Inotem', ARRAY['INOTEM'], 'KR', 'general'),
('큐리오텍', 'Curiotec', ARRAY['CURIOTEC'], 'KR', 'general'),
('봉신', 'Bongshin', ARRAY['BS', '봉신로드셀'], 'KR', 'loadcell'),
('토요소키', 'Toyo Soki', ARRAY['TOYO', '토요'], 'JP', 'general'),

-- 글로벌 추가
('포스 마텍', 'Forsa Maetec', ARRAY['FORSA'], 'DE', 'force'),
('PCE 인스트루먼츠', 'PCE Instruments', ARRAY['PCE'], 'DE', 'general'),
('익스텍', 'Extech', ARRAY['EXTECH', 'FLIR Extech'], 'US', 'general'),
('루트론', 'Lutron', ARRAY['LUTRON', '루트론 일렉트로닉'], 'TW', 'general');

-- ---------------------------------------------------------------------------
-- 3. 모델 시드 (Phase 1: 주요 제조사별 대표 모델 5개씩, 총 약 100~150개)
-- ---------------------------------------------------------------------------

-- CAS (카스) - ID 조회 후 INSERT
DO $$
DECLARE
  cas_id INT;
  scale_2_id INT;
  scale_3_id INT;
BEGIN
  SELECT id INTO cas_id FROM manufacturers WHERE name_en = 'CAS';
  SELECT id INTO scale_2_id FROM kolas_categories WHERE sub_category = '전자저울 2급';
  SELECT id INTO scale_3_id FROM kolas_categories WHERE sub_category = '전자저울 3급';

  INSERT INTO models (manufacturer_id, kolas_category_id, model_name, model_family, measure_range_min, measure_range_max, measure_unit, accuracy_class, is_verified) VALUES
    (cas_id, scale_2_id, 'CBX-220H', 'CBX 시리즈', 0, 220, 'g', '1mg', TRUE),
    (cas_id, scale_2_id, 'CBX-320H', 'CBX 시리즈', 0, 320, 'g', '1mg', TRUE),
    (cas_id, scale_2_id, 'CBX-620H', 'CBX 시리즈', 0, 620, 'g', '10mg', TRUE),
    (cas_id, scale_3_id, 'SW-1', 'SW 시리즈', 0, 30, 'kg', '5g', TRUE),
    (cas_id, scale_3_id, 'SW-5', 'SW 시리즈', 0, 30, 'kg', '5g', TRUE),
    (cas_id, scale_3_id, 'DB-1H', 'DB 시리즈', 0, 60, 'kg', '20g', TRUE);
END $$;

-- A&D (에이앤디)
DO $$
DECLARE
  and_id INT;
  scale_1_id INT;
  scale_2_id INT;
BEGIN
  SELECT id INTO and_id FROM manufacturers WHERE name_en = 'A&D';
  SELECT id INTO scale_1_id FROM kolas_categories WHERE sub_category = '전자저울 1급';
  SELECT id INTO scale_2_id FROM kolas_categories WHERE sub_category = '전자저울 2급';

  INSERT INTO models (manufacturer_id, kolas_category_id, model_name, model_family, measure_range_min, measure_range_max, measure_unit, accuracy_class, is_verified) VALUES
    (and_id, scale_1_id, 'GR-200', 'GR 시리즈', 0, 210, 'g', '0.1mg', TRUE),
    (and_id, scale_1_id, 'GR-300', 'GR 시리즈', 0, 310, 'g', '0.1mg', TRUE),
    (and_id, scale_2_id, 'FX-200i', 'FX-i 시리즈', 0, 200, 'g', '1mg', TRUE),
    (and_id, scale_2_id, 'FX-300i', 'FX-i 시리즈', 0, 320, 'g', '1mg', TRUE);
END $$;

-- Mitutoyo (미츠토요)
DO $$
DECLARE
  mit_id INT;
  caliper_id INT;
  micro_id INT;
BEGIN
  SELECT id INTO mit_id FROM manufacturers WHERE name_en = 'Mitutoyo';
  SELECT id INTO caliper_id FROM kolas_categories WHERE sub_category = '디지털 캘리퍼';
  SELECT id INTO micro_id FROM kolas_categories WHERE sub_category = '디지털 마이크로미터';

  INSERT INTO models (manufacturer_id, kolas_category_id, model_name, model_family, measure_range_min, measure_range_max, measure_unit, accuracy_class, is_verified) VALUES
    (mit_id, caliper_id, 'CD-15APX', 'ABSOLUTE 시리즈', 0, 150, 'mm', '0.02mm', TRUE),
    (mit_id, caliper_id, 'CD-20APX', 'ABSOLUTE 시리즈', 0, 200, 'mm', '0.02mm', TRUE),
    (mit_id, caliper_id, 'CD-30APX', 'ABSOLUTE 시리즈', 0, 300, 'mm', '0.03mm', TRUE),
    (mit_id, micro_id, 'MDC-25PX', 'MDC-PX 시리즈', 0, 25, 'mm', '0.001mm', TRUE),
    (mit_id, micro_id, 'MDC-50PX', 'MDC-PX 시리즈', 25, 50, 'mm', '0.001mm', TRUE);
END $$;

-- Fluke (플루크)
DO $$
DECLARE
  fluke_id INT;
  dmm_id INT;
  clamp_id INT;
  insul_id INT;
BEGIN
  SELECT id INTO fluke_id FROM manufacturers WHERE name_en = 'Fluke';
  SELECT id INTO dmm_id FROM kolas_categories WHERE sub_category = '디지털 멀티미터';
  SELECT id INTO clamp_id FROM kolas_categories WHERE sub_category = '클램프 미터';
  SELECT id INTO insul_id FROM kolas_categories WHERE sub_category = '절연저항계';

  INSERT INTO models (manufacturer_id, kolas_category_id, model_name, model_family, measure_unit, is_verified) VALUES
    (fluke_id, dmm_id, '87V', '80 시리즈', 'V', TRUE),
    (fluke_id, dmm_id, '179', '170 시리즈', 'V', TRUE),
    (fluke_id, dmm_id, '289', '280 시리즈', 'V', TRUE),
    (fluke_id, clamp_id, '376 FC', '370 시리즈', 'A', TRUE),
    (fluke_id, insul_id, '1587 FC', '1500 시리즈', 'MΩ', TRUE);
END $$;

-- (추가 제조사·모델은 운영하면서 점진 확장)

-- ---------------------------------------------------------------------------
-- 4. 알림 템플릿 시드
-- ---------------------------------------------------------------------------

INSERT INTO notification_templates (code, channel, title_template, body_template) VALUES
('calibration_d30', 'push',
  '교정 30일 전 알림',
  '{{instrument.asset_code}} ({{instrument.model}})의 교정일이 30일 남았습니다.'),

('calibration_d14', 'kakao',
  '교정 14일 전 알림',
  '[MetroAI] 교정 일정 안내

{{user.name}}님, 다음 측정기의 교정 만료가 임박했습니다.

▸ 관리번호: {{instrument.asset_code}}
▸ 종류: {{instrument.category}} ({{instrument.manufacturer}} {{instrument.model}})
▸ 차기 교정일: {{instrument.next_calibration_at}} (D-14)
▸ 부서: {{instrument.department}}

지금 확인하기 → {{link}}'),

('calibration_d7', 'kakao',
  '교정 7일 전 알림',
  '[MetroAI] 교정 7일 전 안내

{{user.name}}님, 다음 측정기의 교정이 7일 후 만료됩니다.

▸ 관리번호: {{instrument.asset_code}}
▸ 차기 교정일: {{instrument.next_calibration_at}}

신속한 조치 부탁드립니다 → {{link}}'),

('calibration_d7', 'sms',
  null,
  '[MetroAI] {{instrument.asset_code}} 교정 D-7. 조치 필요. {{short_link}}'),

('calibration_overdue', 'kakao',
  '교정 만료 알림',
  '[MetroAI] ⚠️ 교정 만료

{{instrument.asset_code}}의 교정이 만료되었습니다.

▸ 만료일: {{instrument.next_calibration_at}}
▸ 경과일: {{days_overdue}}일

해당 측정기로 측정한 데이터는 법적 효력이 없습니다.
즉시 교정 또는 사용 중지 처리해주세요.

확인 → {{link}}');

-- ---------------------------------------------------------------------------
-- 5. 데모 사업장 (개발용)
-- ---------------------------------------------------------------------------

INSERT INTO tenants (id, name, business_no, address, plan) VALUES
('00000000-0000-0000-0000-000000000001', '데모 사업장', '123-45-67890', '대전광역시 유성구 대학로 99', 'pro');

INSERT INTO users (id, tenant_id, email, password_hash, name, role, email_verified) VALUES
('00000000-0000-0000-0000-000000000010',
 '00000000-0000-0000-0000-000000000001',
 'admin@demo.metroai.kr',
 '$2b$10$YOUR_BCRYPT_HASH_HERE',
 '관리자',
 'admin',
 TRUE);

INSERT INTO departments (id, tenant_id, name) VALUES
('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000001', '품질관리팀'),
('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', '생산1팀'),
('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', '연구개발팀');

-- ---------------------------------------------------------------------------
-- 완료
-- ---------------------------------------------------------------------------
SELECT 'Seed data loaded: ' ||
  (SELECT COUNT(*) FROM kolas_categories) || ' KOLAS categories, ' ||
  (SELECT COUNT(*) FROM manufacturers) || ' manufacturers, ' ||
  (SELECT COUNT(*) FROM models) || ' models, ' ||
  (SELECT COUNT(*) FROM notification_templates) || ' notification templates'
  AS status;
