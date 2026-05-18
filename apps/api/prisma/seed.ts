import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Seed master data. Source of truth: docs/03b_SEED_DATA.sql ported to TS.
// Run via: pnpm --filter @metroai/api prisma:seed
const prisma = new PrismaClient();

// --- KOLAS categories (Phase 1: 51 of 568) -----------------------------------
const KOLAS_SEED: ReadonlyArray<{
  majorCategory: string;
  subCategory: string;
  standardCycleMonths: number;
  measureUnit: string;
}> = [
  // 역학 (mechanics)
  { majorCategory: '역학', subCategory: '전자저울 1급', standardCycleMonths: 12, measureUnit: 'g' },
  { majorCategory: '역학', subCategory: '전자저울 2급', standardCycleMonths: 12, measureUnit: 'g' },
  { majorCategory: '역학', subCategory: '전자저울 3급', standardCycleMonths: 12, measureUnit: 'kg' },
  { majorCategory: '역학', subCategory: '전자저울 4급', standardCycleMonths: 12, measureUnit: 'kg' },
  { majorCategory: '역학', subCategory: '플랫폼 스케일', standardCycleMonths: 12, measureUnit: 'kg' },
  { majorCategory: '역학', subCategory: '트럭 스케일', standardCycleMonths: 12, measureUnit: 'ton' },
  { majorCategory: '역학', subCategory: '크레인 스케일', standardCycleMonths: 12, measureUnit: 'kg' },
  { majorCategory: '역학', subCategory: '분동 (1급)', standardCycleMonths: 60, measureUnit: 'g' },
  { majorCategory: '역학', subCategory: '분동 (2급)', standardCycleMonths: 36, measureUnit: 'g' },
  { majorCategory: '역학', subCategory: '로드셀', standardCycleMonths: 12, measureUnit: 'kg' },
  // 길이 (length)
  { majorCategory: '길이', subCategory: '디지털 캘리퍼', standardCycleMonths: 12, measureUnit: 'mm' },
  { majorCategory: '길이', subCategory: '버니어 캘리퍼', standardCycleMonths: 12, measureUnit: 'mm' },
  { majorCategory: '길이', subCategory: '디지털 마이크로미터', standardCycleMonths: 6, measureUnit: 'mm' },
  { majorCategory: '길이', subCategory: '아날로그 마이크로미터', standardCycleMonths: 6, measureUnit: 'mm' },
  { majorCategory: '길이', subCategory: '하이트 게이지', standardCycleMonths: 12, measureUnit: 'mm' },
  { majorCategory: '길이', subCategory: '다이얼 게이지', standardCycleMonths: 12, measureUnit: 'mm' },
  { majorCategory: '길이', subCategory: '게이지 블록', standardCycleMonths: 36, measureUnit: 'mm' },
  { majorCategory: '길이', subCategory: '레이저 측정기', standardCycleMonths: 12, measureUnit: 'mm' },
  { majorCategory: '길이', subCategory: '3차원 측정기 (CMM)', standardCycleMonths: 12, measureUnit: 'mm' },
  // 온도 (temperature)
  { majorCategory: '온도', subCategory: '디지털 온도계', standardCycleMonths: 12, measureUnit: '°C' },
  { majorCategory: '온도', subCategory: '백금저항온도계 (PRT)', standardCycleMonths: 12, measureUnit: '°C' },
  { majorCategory: '온도', subCategory: '열전대 (Thermocouple)', standardCycleMonths: 12, measureUnit: '°C' },
  { majorCategory: '온도', subCategory: '적외선 온도계', standardCycleMonths: 12, measureUnit: '°C' },
  { majorCategory: '온도', subCategory: '항온수조', standardCycleMonths: 12, measureUnit: '°C' },
  { majorCategory: '온도', subCategory: '온도 데이터로거', standardCycleMonths: 12, measureUnit: '°C' },
  // 압력 (pressure)
  { majorCategory: '압력', subCategory: '디지털 압력계', standardCycleMonths: 12, measureUnit: 'bar' },
  { majorCategory: '압력', subCategory: '부르돈 압력계', standardCycleMonths: 12, measureUnit: 'bar' },
  { majorCategory: '압력', subCategory: '진공계', standardCycleMonths: 12, measureUnit: 'mbar' },
  { majorCategory: '압력', subCategory: '차압계', standardCycleMonths: 12, measureUnit: 'Pa' },
  // 전기 (electrical)
  { majorCategory: '전기', subCategory: '디지털 멀티미터', standardCycleMonths: 12, measureUnit: 'V' },
  { majorCategory: '전기', subCategory: '클램프 미터', standardCycleMonths: 12, measureUnit: 'A' },
  { majorCategory: '전기', subCategory: '절연저항계', standardCycleMonths: 12, measureUnit: 'MΩ' },
  { majorCategory: '전기', subCategory: '접지저항계', standardCycleMonths: 12, measureUnit: 'Ω' },
  { majorCategory: '전기', subCategory: '오실로스코프', standardCycleMonths: 12, measureUnit: 'V' },
  { majorCategory: '전기', subCategory: '함수발생기', standardCycleMonths: 12, measureUnit: 'Hz' },
  // 화학 (chemistry)
  { majorCategory: '화학', subCategory: 'pH 미터', standardCycleMonths: 6, measureUnit: 'pH' },
  { majorCategory: '화학', subCategory: '전도도계', standardCycleMonths: 12, measureUnit: 'µS/cm' },
  { majorCategory: '화학', subCategory: '용존산소계', standardCycleMonths: 12, measureUnit: 'mg/L' },
  { majorCategory: '화학', subCategory: '굴절계', standardCycleMonths: 12, measureUnit: 'Brix' },
  // 시간 (time)
  { majorCategory: '시간', subCategory: '디지털 카운터', standardCycleMonths: 12, measureUnit: 'Hz' },
  { majorCategory: '시간', subCategory: '주파수 카운터', standardCycleMonths: 12, measureUnit: 'Hz' },
  { majorCategory: '시간', subCategory: '스톱워치', standardCycleMonths: 12, measureUnit: 's' },
  // 음향
  { majorCategory: '음향', subCategory: '소음계', standardCycleMonths: 12, measureUnit: 'dB' },
  { majorCategory: '음향', subCategory: '진동계', standardCycleMonths: 12, measureUnit: 'mm/s' },
  // 유량
  { majorCategory: '유량', subCategory: '유량계 (액체)', standardCycleMonths: 12, measureUnit: 'L/min' },
  { majorCategory: '유량', subCategory: '유량계 (기체)', standardCycleMonths: 12, measureUnit: 'Nm³/h' },
  // 가스
  { majorCategory: '가스', subCategory: '가스 검지기', standardCycleMonths: 6, measureUnit: 'ppm' },
  { majorCategory: '가스', subCategory: 'CO2 측정기', standardCycleMonths: 12, measureUnit: 'ppm' },
  // 광학
  { majorCategory: '광학', subCategory: '조도계', standardCycleMonths: 12, measureUnit: 'lux' },
  { majorCategory: '광학', subCategory: '분광광도계', standardCycleMonths: 12, measureUnit: 'nm' },
  // 환경
  { majorCategory: '환경', subCategory: '온습도계', standardCycleMonths: 12, measureUnit: '°C/%RH' },
  { majorCategory: '환경', subCategory: '풍속계', standardCycleMonths: 12, measureUnit: 'm/s' },
];

// --- Manufacturers (30 Korean & global) --------------------------------------
const MANUFACTURER_SEED: ReadonlyArray<{
  nameKo: string;
  nameEn: string;
  aliases: string[];
  country: string;
  categoryHint: string;
}> = [
  { nameKo: '카스', nameEn: 'CAS', aliases: ['CAS Corp', '카스코퍼레이션', '카스스케일'], country: 'KR', categoryHint: 'scale' },
  { nameKo: '에이앤디', nameEn: 'A&D', aliases: ['AND', 'A and D', 'AND Korea'], country: 'JP', categoryHint: 'scale' },
  { nameKo: '메틀러 토레도', nameEn: 'Mettler Toledo', aliases: ['Mettler-Toledo', 'METTLER'], country: 'CH', categoryHint: 'scale' },
  { nameKo: '오하우스', nameEn: 'OHAUS', aliases: ['Ohaus Corp'], country: 'US', categoryHint: 'scale' },
  { nameKo: '사르토리우스', nameEn: 'Sartorius', aliases: ['Sartorius AG'], country: 'DE', categoryHint: 'scale' },
  { nameKo: '시마즈', nameEn: 'Shimadzu', aliases: ['시마쯔', 'SHIMADZU'], country: 'JP', categoryHint: 'scale' },
  { nameKo: '미츠토요', nameEn: 'Mitutoyo', aliases: ['미쓰토요', 'MITUTOYO'], country: 'JP', categoryHint: 'caliper' },
  { nameKo: '마르', nameEn: 'Mahr', aliases: ['Mahr GmbH'], country: 'DE', categoryHint: 'caliper' },
  { nameKo: '테사', nameEn: 'Tesa', aliases: ['Tesa Technology', 'TESA'], country: 'CH', categoryHint: 'caliper' },
  { nameKo: '인사이즈', nameEn: 'Insize', aliases: ['INSIZE'], country: 'CN', categoryHint: 'caliper' },
  { nameKo: '플루크', nameEn: 'Fluke', aliases: ['Fluke Corporation', 'FLUKE'], country: 'US', categoryHint: 'electrical' },
  { nameKo: '히오키', nameEn: 'Hioki', aliases: ['HIOKI', '히오끼'], country: 'JP', categoryHint: 'electrical' },
  { nameKo: '요코가와', nameEn: 'Yokogawa', aliases: ['YOKOGAWA', '요꼬가와'], country: 'JP', categoryHint: 'electrical' },
  { nameKo: '키사이트', nameEn: 'Keysight', aliases: ['Keysight Technologies', 'KEYSIGHT'], country: 'US', categoryHint: 'electrical' },
  { nameKo: '테스토', nameEn: 'Testo', aliases: ['TESTO', 'Testo SE'], country: 'DE', categoryHint: 'environmental' },
  { nameKo: '위카', nameEn: 'Wika', aliases: ['WIKA', 'Wika Alexander Wiegand'], country: 'DE', categoryHint: 'pressure' },
  { nameKo: '드룩', nameEn: 'Druck', aliases: ['GE Druck', 'DRUCK'], country: 'GB', categoryHint: 'pressure' },
  { nameKo: '오메가', nameEn: 'Omega', aliases: ['Omega Engineering', 'OMEGA'], country: 'US', categoryHint: 'temperature' },
  { nameKo: '한나 인스트루먼츠', nameEn: 'Hanna Instruments', aliases: ['HANNA', 'Hanna'], country: 'IT', categoryHint: 'chemistry' },
  { nameKo: '호리바', nameEn: 'Horiba', aliases: ['HORIBA', '호리바'], country: 'JP', categoryHint: 'chemistry' },
  { nameKo: '대성계기', nameEn: 'Daesung Gauge', aliases: ['DSG', '대성'], country: 'KR', categoryHint: 'pressure' },
  { nameKo: '한국교정계측기', nameEn: 'Korea Calibration Instrument', aliases: ['KCI'], country: 'KR', categoryHint: 'general' },
  { nameKo: '이노템', nameEn: 'Inotem', aliases: ['INOTEM'], country: 'KR', categoryHint: 'general' },
  { nameKo: '큐리오텍', nameEn: 'Curiotec', aliases: ['CURIOTEC'], country: 'KR', categoryHint: 'general' },
  { nameKo: '봉신', nameEn: 'Bongshin', aliases: ['BS', '봉신로드셀'], country: 'KR', categoryHint: 'loadcell' },
  { nameKo: '토요소키', nameEn: 'Toyo Soki', aliases: ['TOYO', '토요'], country: 'JP', categoryHint: 'general' },
  { nameKo: '포스 마텍', nameEn: 'Forsa Maetec', aliases: ['FORSA'], country: 'DE', categoryHint: 'force' },
  { nameKo: 'PCE 인스트루먼츠', nameEn: 'PCE Instruments', aliases: ['PCE'], country: 'DE', categoryHint: 'general' },
  { nameKo: '익스텍', nameEn: 'Extech', aliases: ['EXTECH', 'FLIR Extech'], country: 'US', categoryHint: 'general' },
  { nameKo: '루트론', nameEn: 'Lutron', aliases: ['LUTRON', '루트론 일렉트로닉'], country: 'TW', categoryHint: 'general' },
];

// --- Models (representative per manufacturer) --------------------------------
interface ModelSeed {
  manufacturerEn: string;
  kolasSubCategory: string;
  modelName: string;
  modelFamily?: string;
  measureRangeMin?: number;
  measureRangeMax?: number;
  measureUnit: string;
  accuracyClass?: string;
}

const MODEL_SEED: ReadonlyArray<ModelSeed> = [
  // CAS
  { manufacturerEn: 'CAS', kolasSubCategory: '전자저울 2급', modelName: 'CBX-220H', modelFamily: 'CBX 시리즈', measureRangeMin: 0, measureRangeMax: 220, measureUnit: 'g', accuracyClass: '1mg' },
  { manufacturerEn: 'CAS', kolasSubCategory: '전자저울 2급', modelName: 'CBX-320H', modelFamily: 'CBX 시리즈', measureRangeMin: 0, measureRangeMax: 320, measureUnit: 'g', accuracyClass: '1mg' },
  { manufacturerEn: 'CAS', kolasSubCategory: '전자저울 2급', modelName: 'CBX-620H', modelFamily: 'CBX 시리즈', measureRangeMin: 0, measureRangeMax: 620, measureUnit: 'g', accuracyClass: '10mg' },
  { manufacturerEn: 'CAS', kolasSubCategory: '전자저울 3급', modelName: 'SW-1', modelFamily: 'SW 시리즈', measureRangeMin: 0, measureRangeMax: 30, measureUnit: 'kg', accuracyClass: '5g' },
  { manufacturerEn: 'CAS', kolasSubCategory: '전자저울 3급', modelName: 'DB-1H', modelFamily: 'DB 시리즈', measureRangeMin: 0, measureRangeMax: 60, measureUnit: 'kg', accuracyClass: '20g' },
  // A&D
  { manufacturerEn: 'A&D', kolasSubCategory: '전자저울 1급', modelName: 'GR-200', modelFamily: 'GR 시리즈', measureRangeMin: 0, measureRangeMax: 210, measureUnit: 'g', accuracyClass: '0.1mg' },
  { manufacturerEn: 'A&D', kolasSubCategory: '전자저울 1급', modelName: 'GR-300', modelFamily: 'GR 시리즈', measureRangeMin: 0, measureRangeMax: 310, measureUnit: 'g', accuracyClass: '0.1mg' },
  { manufacturerEn: 'A&D', kolasSubCategory: '전자저울 2급', modelName: 'FX-200i', modelFamily: 'FX-i 시리즈', measureRangeMin: 0, measureRangeMax: 200, measureUnit: 'g', accuracyClass: '1mg' },
  { manufacturerEn: 'A&D', kolasSubCategory: '전자저울 2급', modelName: 'FX-300i', modelFamily: 'FX-i 시리즈', measureRangeMin: 0, measureRangeMax: 320, measureUnit: 'g', accuracyClass: '1mg' },
  // Mitutoyo
  { manufacturerEn: 'Mitutoyo', kolasSubCategory: '디지털 캘리퍼', modelName: 'CD-15APX', modelFamily: 'ABSOLUTE 시리즈', measureRangeMin: 0, measureRangeMax: 150, measureUnit: 'mm', accuracyClass: '0.02mm' },
  { manufacturerEn: 'Mitutoyo', kolasSubCategory: '디지털 캘리퍼', modelName: 'CD-20APX', modelFamily: 'ABSOLUTE 시리즈', measureRangeMin: 0, measureRangeMax: 200, measureUnit: 'mm', accuracyClass: '0.02mm' },
  { manufacturerEn: 'Mitutoyo', kolasSubCategory: '디지털 캘리퍼', modelName: 'CD-30APX', modelFamily: 'ABSOLUTE 시리즈', measureRangeMin: 0, measureRangeMax: 300, measureUnit: 'mm', accuracyClass: '0.03mm' },
  { manufacturerEn: 'Mitutoyo', kolasSubCategory: '디지털 마이크로미터', modelName: 'MDC-25PX', modelFamily: 'MDC-PX 시리즈', measureRangeMin: 0, measureRangeMax: 25, measureUnit: 'mm', accuracyClass: '0.001mm' },
  { manufacturerEn: 'Mitutoyo', kolasSubCategory: '디지털 마이크로미터', modelName: 'MDC-50PX', modelFamily: 'MDC-PX 시리즈', measureRangeMin: 25, measureRangeMax: 50, measureUnit: 'mm', accuracyClass: '0.001mm' },
  // Fluke
  { manufacturerEn: 'Fluke', kolasSubCategory: '디지털 멀티미터', modelName: '87V', modelFamily: '80 시리즈', measureUnit: 'V' },
  { manufacturerEn: 'Fluke', kolasSubCategory: '디지털 멀티미터', modelName: '179', modelFamily: '170 시리즈', measureUnit: 'V' },
  { manufacturerEn: 'Fluke', kolasSubCategory: '디지털 멀티미터', modelName: '289', modelFamily: '280 시리즈', measureUnit: 'V' },
  { manufacturerEn: 'Fluke', kolasSubCategory: '클램프 미터', modelName: '376 FC', modelFamily: '370 시리즈', measureUnit: 'A' },
  { manufacturerEn: 'Fluke', kolasSubCategory: '절연저항계', modelName: '1587 FC', modelFamily: '1500 시리즈', measureUnit: 'MΩ' },
];

// --- Notification templates --------------------------------------------------
const TEMPLATE_SEED: ReadonlyArray<{
  code: string;
  channel: string;
  titleTemplate: string;
  bodyTemplate: string;
}> = [
  {
    code: 'calibration_d30',
    channel: 'push',
    titleTemplate: '교정 30일 전 알림',
    bodyTemplate: '{{instrument.asset_code}} ({{instrument.model}})의 교정일이 30일 남았습니다.',
  },
  {
    code: 'calibration_d14',
    channel: 'kakao',
    titleTemplate: '교정 14일 전 알림',
    bodyTemplate:
      '[MetroAI] 교정 일정 안내\n\n{{user.name}}님, 다음 측정기의 교정 만료가 임박했습니다.\n\n▸ 관리번호: {{instrument.asset_code}}\n▸ 종류: {{instrument.category}} ({{instrument.manufacturer}} {{instrument.model}})\n▸ 차기 교정일: {{instrument.next_calibration_at}} (D-14)\n▸ 부서: {{instrument.department}}\n\n지금 확인하기 → {{link}}',
  },
  {
    code: 'calibration_d7',
    channel: 'kakao',
    titleTemplate: '교정 7일 전 알림',
    bodyTemplate:
      '[MetroAI] 교정 7일 전 안내\n\n{{user.name}}님, 다음 측정기의 교정이 7일 후 만료됩니다.\n\n▸ 관리번호: {{instrument.asset_code}}\n▸ 차기 교정일: {{instrument.next_calibration_at}}\n\n신속한 조치 부탁드립니다 → {{link}}',
  },
  {
    code: 'calibration_d1',
    channel: 'kakao',
    titleTemplate: '교정 1일 전 알림',
    bodyTemplate: '[MetroAI] {{instrument.asset_code}} 교정이 내일 만료됩니다.',
  },
  {
    code: 'calibration_overdue',
    channel: 'kakao',
    titleTemplate: '교정 만료 알림',
    bodyTemplate:
      '[MetroAI] ⚠️ 교정 만료\n\n{{instrument.asset_code}}의 교정이 만료되었습니다.\n\n▸ 만료일: {{instrument.next_calibration_at}}\n▸ 경과일: {{days_overdue}}일\n\n해당 측정기로 측정한 데이터는 법적 효력이 없습니다.\n즉시 교정 또는 사용 중지 처리해주세요.\n\n확인 → {{link}}',
  },
];

async function seedKolas(): Promise<Map<string, number>> {
  const idByKey = new Map<string, number>();
  for (const k of KOLAS_SEED) {
    const existing = await prisma.kolasCategory.findFirst({
      where: { majorCategory: k.majorCategory, subCategory: k.subCategory },
    });
    const row = existing
      ? await prisma.kolasCategory.update({ where: { id: existing.id }, data: k })
      : await prisma.kolasCategory.create({ data: k });
    idByKey.set(k.subCategory, row.id);
  }
  return idByKey;
}

async function seedManufacturers(): Promise<Map<string, number>> {
  const idByEn = new Map<string, number>();
  for (const m of MANUFACTURER_SEED) {
    const existing = await prisma.manufacturer.findFirst({ where: { nameEn: m.nameEn } });
    const row = existing
      ? await prisma.manufacturer.update({ where: { id: existing.id }, data: m })
      : await prisma.manufacturer.create({ data: m });
    idByEn.set(m.nameEn, row.id);
  }
  return idByEn;
}

async function seedModels(
  mfrIds: Map<string, number>,
  kolasIds: Map<string, number>,
): Promise<void> {
  for (const m of MODEL_SEED) {
    const manufacturerId = mfrIds.get(m.manufacturerEn);
    const kolasCategoryId = kolasIds.get(m.kolasSubCategory);
    if (!manufacturerId) {
      console.warn(`[seed] skip model ${m.modelName}: manufacturer ${m.manufacturerEn} missing`);
      continue;
    }
    await prisma.model.upsert({
      where: { manufacturerId_modelName: { manufacturerId, modelName: m.modelName } },
      update: {},
      create: {
        manufacturerId,
        kolasCategoryId,
        modelName: m.modelName,
        modelFamily: m.modelFamily,
        measureRangeMin: m.measureRangeMin,
        measureRangeMax: m.measureRangeMax,
        measureUnit: m.measureUnit,
        accuracyClass: m.accuracyClass,
        isVerified: true,
      },
    });
  }
}

async function seedTemplates(): Promise<void> {
  for (const t of TEMPLATE_SEED) {
    await prisma.notificationTemplate.upsert({
      where: { code: t.code },
      update: t,
      create: t,
    });
  }
}

async function seedDemoTenant(): Promise<void> {
  // Only run in non-production to avoid leaking demo accounts.
  if (process.env.NODE_ENV === 'production') return;

  const demoTenantId = '00000000-0000-0000-0000-000000000001';
  const demoUserId = '00000000-0000-0000-0000-000000000010';

  await prisma.tenant.upsert({
    where: { id: demoTenantId },
    update: {},
    create: {
      id: demoTenantId,
      name: '데모 사업장',
      businessNo: '123-45-67890',
      address: '대전광역시 유성구 대학로 99',
      plan: 'pro',
    },
  });

  const passwordHash = await bcrypt.hash('demo1234', 12);
  await prisma.user.upsert({
    where: { id: demoUserId },
    update: {},
    create: {
      id: demoUserId,
      tenantId: demoTenantId,
      email: 'admin@demo.metroai.kr',
      passwordHash,
      name: '관리자',
      role: 'admin',
      emailVerified: true,
    },
  });

  const depts = [
    { id: '00000000-0000-0000-0000-000000000100', name: '품질관리팀' },
    { id: '00000000-0000-0000-0000-000000000101', name: '생산1팀' },
    { id: '00000000-0000-0000-0000-000000000102', name: '연구개발팀' },
  ];
  for (const d of depts) {
    await prisma.department.upsert({
      where: { id: d.id },
      update: {},
      create: { id: d.id, tenantId: demoTenantId, name: d.name },
    });
  }
}

async function main(): Promise<void> {
  console.info('[seed] KOLAS categories...');
  const kolasIds = await seedKolas();
  console.info(`[seed]   ${kolasIds.size} categories`);

  console.info('[seed] manufacturers...');
  const mfrIds = await seedManufacturers();
  console.info(`[seed]   ${mfrIds.size} manufacturers`);

  console.info('[seed] models...');
  await seedModels(mfrIds, kolasIds);

  console.info('[seed] notification templates...');
  await seedTemplates();

  console.info('[seed] demo tenant (admin@demo.metroai.kr / demo1234)...');
  await seedDemoTenant();

  console.info('[seed] done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
