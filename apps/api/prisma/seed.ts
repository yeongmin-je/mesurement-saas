import { PrismaClient } from '@prisma/client';

// Minimal seed for Week 0/1: KOLAS categories (Phase 1 subset) + a handful of manufacturers.
// Full master data (30 KOLAS / 20 manufacturers / 10 models) lives in docs/03b_SEED_DATA.sql
// and will be ported here in Week 1.

const prisma = new PrismaClient();

const KOLAS_SEED = [
  { majorCategory: '역학', subCategory: '전자저울 1급', standardCycleMonths: 12, measureUnit: 'g' },
  { majorCategory: '역학', subCategory: '전자저울 2급', standardCycleMonths: 12, measureUnit: 'g' },
  { majorCategory: '역학', subCategory: '전자저울 3급', standardCycleMonths: 12, measureUnit: 'g' },
  { majorCategory: '길이', subCategory: '버니어캘리퍼스', standardCycleMonths: 12, measureUnit: 'mm' },
  { majorCategory: '길이', subCategory: '마이크로미터', standardCycleMonths: 12, measureUnit: 'mm' },
  { majorCategory: '온도', subCategory: '디지털 온도계', standardCycleMonths: 12, measureUnit: '°C' },
  { majorCategory: '압력', subCategory: '디지털 압력계', standardCycleMonths: 12, measureUnit: 'bar' },
];

const MANUFACTURER_SEED = [
  { nameKo: '카스', nameEn: 'CAS', country: 'KR', categoryHint: 'scale' },
  { nameKo: '사토리우스', nameEn: 'Sartorius', country: 'DE', categoryHint: 'scale' },
  { nameKo: '메틀러 톨레도', nameEn: 'Mettler Toledo', country: 'CH', categoryHint: 'scale' },
  { nameKo: '미츠토요', nameEn: 'Mitutoyo', country: 'JP', categoryHint: 'caliper' },
  { nameKo: '플루크', nameEn: 'Fluke', country: 'US', categoryHint: 'electrical' },
];

async function main(): Promise<void> {
  console.info('[seed] KOLAS categories...');
  for (const k of KOLAS_SEED) {
    await prisma.kolasCategory.upsert({
      where: { id: KOLAS_SEED.indexOf(k) + 1 },
      update: {},
      create: k,
    });
  }

  console.info('[seed] manufacturers...');
  for (const m of MANUFACTURER_SEED) {
    const existing = await prisma.manufacturer.findFirst({ where: { nameEn: m.nameEn } });
    if (!existing) {
      await prisma.manufacturer.create({ data: { ...m, aliases: [] } });
    }
  }

  console.info('[seed] notification templates...');
  const templates = [
    { code: 'calibration_d30', channel: 'kakao', titleTemplate: '교정 D-30 알림' },
    { code: 'calibration_d14', channel: 'kakao', titleTemplate: '교정 D-14 알림' },
    { code: 'calibration_d7', channel: 'kakao', titleTemplate: '교정 D-7 알림' },
    { code: 'calibration_d1', channel: 'kakao', titleTemplate: '교정 D-1 알림' },
    { code: 'calibration_overdue', channel: 'kakao', titleTemplate: '교정 만료 경고' },
  ];
  for (const t of templates) {
    await prisma.notificationTemplate.upsert({
      where: { code: t.code },
      update: {},
      create: t,
    });
  }

  console.info('[seed] done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
