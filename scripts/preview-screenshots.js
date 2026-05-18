#!/usr/bin/env node
/**
 * Preview screenshots for the web app.
 *
 * Spawns Next.js dev, opens each route in a mobile-sized viewport, intercepts
 * /v1/* API calls and returns hardcoded mock data so the pages render fully
 * styled without a real backend.
 *
 * Usage: node scripts/preview-screenshots.js
 * Output: ./preview-screenshots/*.png
 */
const { spawn } = require('node:child_process');
const { mkdir } = require('node:fs/promises');
const path = require('node:path');
// puppeteer lives under apps/api in this pnpm workspace — resolve explicitly.
const puppeteer = require(path.resolve(
  __dirname,
  '..',
  'node_modules',
  '.pnpm',
  'puppeteer@22.15.0_typescript@5.9.3',
  'node_modules',
  'puppeteer',
));

const PORT = 3000;
const OUT_DIR = path.resolve(__dirname, '..', 'preview-screenshots');

// --- Mock data ---------------------------------------------------------------
const NOW_ISO = new Date().toISOString();
const TOMORROW = new Date(Date.now() + 86_400_000).toISOString();
const IN_5_DAYS = new Date(Date.now() + 5 * 86_400_000).toISOString();
const IN_20_DAYS = new Date(Date.now() + 20 * 86_400_000).toISOString();
const PAST = new Date(Date.now() - 3 * 86_400_000).toISOString();

const MOCK_DASHBOARD = {
  totalInstruments: 247,
  activeInstruments: 235,
  calibrationsThisMonth: 18,
  calibrationsImminent: 12,
  calibrationsOverdue: 3,
  statusDistribution: { active: 235, calibrating: 5, repairing: 2, suspended: 2, discarded: 3 },
  departmentDistribution: [
    { departmentId: 'd1', name: '품질관리팀', count: 120 },
    { departmentId: 'd2', name: '생산1팀', count: 78 },
    { departmentId: 'd3', name: '연구개발팀', count: 49 },
  ],
  recentActivities: [
    { type: 'instrument_registered', instrumentId: 'i1', assetCode: 'MA-20260515-0001', userName: '홍길동', at: NOW_ISO },
    { type: 'instrument_registered', instrumentId: 'i2', assetCode: 'MA-20260515-0002', userName: '김철수', at: NOW_ISO },
  ],
};

const MOCK_INSTRUMENT_DETAIL = {
  id: 'i1',
  tenantId: 't1',
  assetCode: 'MA-20260515-0023',
  serialNumber: 'SN-20240315-A7821',
  category: { id: 2, name: '전자저울 2급' },
  manufacturer: { id: 1, name: 'CAS' },
  model: { id: 12, name: 'CBX-220H' },
  measureRange: { min: 0, max: 220, unit: 'g' },
  accuracyClass: '1mg',
  department: { id: 'd1', name: '품질관리팀' },
  location: '1공장 QC실 A-3',
  custodian: { id: 'u1', name: '김철수' },
  status: 'active',
  acquiredAt: '2024-03-15',
  acquiredCost: 1500000,
  cycleMonths: 12,
  cycleAdjusted: false,
  cycleAdjustedReason: null,
  lastCalibrationAt: '2025-03-15',
  nextCalibrationAt: '2026-06-14',
  daysUntilCalibration: 30,
  calibrationStatus: 'imminent',
  photos: [],
  notes: '월 1회 청결 점검 필수.',
  createdAt: NOW_ISO,
  updatedAt: NOW_ISO,
};

const MOCK_INSTRUMENTS_LIST = {
  data: [
    { id: 'i1', assetCode: 'MA-20260515-0023', serialNumber: 'SN-A7821', model: { id: 12, name: 'CBX-220H', manufacturer: 'CAS' }, category: '전자저울 2급', department: '품질관리팀', status: 'active', nextCalibrationAt: '2026-06-14', calibrationStatus: 'imminent', primaryPhotoUrl: null },
    { id: 'i2', assetCode: 'MA-20260514-0022', serialNumber: 'SN-B2451', model: { id: 15, name: 'CD-15APX', manufacturer: 'Mitutoyo' }, category: '디지털 캘리퍼', department: '생산1팀', status: 'active', nextCalibrationAt: '2026-09-01', calibrationStatus: 'normal', primaryPhotoUrl: null },
    { id: 'i3', assetCode: 'MA-20260512-0021', serialNumber: 'SN-C9128', model: { id: 30, name: '87V', manufacturer: 'Fluke' }, category: '디지털 멀티미터', department: '연구개발팀', status: 'active', nextCalibrationAt: '2026-05-10', calibrationStatus: 'overdue', primaryPhotoUrl: null },
    { id: 'i4', assetCode: 'MA-20260510-0020', serialNumber: 'SN-D4412', model: { id: 17, name: 'MDC-25PX', manufacturer: 'Mitutoyo' }, category: '디지털 마이크로미터', department: '품질관리팀', status: 'active', nextCalibrationAt: '2026-11-22', calibrationStatus: 'normal', primaryPhotoUrl: null },
    { id: 'i5', assetCode: 'MA-20260508-0019', serialNumber: 'SN-E2204', model: { id: 8, name: 'GR-200', manufacturer: 'A&D' }, category: '전자저울 1급', department: '연구개발팀', status: 'calibrating', nextCalibrationAt: '2026-05-30', calibrationStatus: 'imminent', primaryPhotoUrl: null },
  ],
  pagination: { page: 1, limit: 20, total: 5, totalPages: 1 },
};

const MOCK_CALIBRATIONS = [
  { id: 'c1', instrumentId: 'i1', performedAt: '2025-03-15', calibrationOrgId: null, calibrationOrgText: '한국교정시험기관', performedByName: '이교정', asFoundData: null, asLeftData: null, uncertainty: 0.01, result: 'pass', certificateNo: 'KOLAS-2025-A0123', certificateUrl: null, cost: 50000, notes: null, createdAt: NOW_ISO },
  { id: 'c2', instrumentId: 'i1', performedAt: '2024-03-15', calibrationOrgId: null, calibrationOrgText: '한국교정시험기관', performedByName: '이교정', asFoundData: null, asLeftData: null, uncertainty: 0.015, result: 'pass', certificateNo: 'KOLAS-2024-A0099', certificateUrl: null, cost: 50000, notes: null, createdAt: NOW_ISO },
];

const MOCK_UPCOMING = [
  { id: 'i1', assetCode: 'MA-20260515-0023', nextCalibrationAt: TOMORROW, model: { modelName: 'CBX-220H', manufacturer: { nameKo: 'CAS' } }, department: { name: '품질관리팀' } },
  { id: 'i3', assetCode: 'MA-20260512-0021', nextCalibrationAt: PAST, model: { modelName: '87V', manufacturer: { nameKo: 'Fluke' } }, department: { name: '연구개발팀' } },
  { id: 'i5', assetCode: 'MA-20260508-0019', nextCalibrationAt: IN_5_DAYS, model: { modelName: 'GR-200', manufacturer: { nameKo: 'A&D' } }, department: { name: '연구개발팀' } },
  { id: 'i2', assetCode: 'MA-20260514-0022', nextCalibrationAt: IN_20_DAYS, model: { modelName: 'CD-15APX', manufacturer: { nameKo: 'Mitutoyo' } }, department: { name: '생산1팀' } },
];

const MOCK_NOTIFICATIONS = [
  { id: 'n1', tenantId: 't1', userId: 'u1', instrumentId: 'i3', templateCode: 'calibration_overdue', channel: 'kakao', recipient: '010-1234-5678', title: '교정 만료 알림', body: '[MetroAI] ⚠️ 교정 만료\n\nMA-20260512-0021의 교정이 만료되었습니다.\n\n▸ 만료일: 2026-05-10\n▸ 경과일: 3일\n\n즉시 교정 또는 사용 중지 처리해주세요.', status: 'sent', sentAt: NOW_ISO, scheduledAt: NOW_ISO, createdAt: NOW_ISO },
  { id: 'n2', tenantId: 't1', userId: 'u1', instrumentId: 'i1', templateCode: 'calibration_d30', channel: 'kakao', recipient: '010-1234-5678', title: '교정 30일 전 알림', body: 'MA-20260515-0023 (CBX-220H)의 교정일이 30일 남았습니다.', status: 'sent', sentAt: NOW_ISO, scheduledAt: NOW_ISO, createdAt: NOW_ISO },
  { id: 'n3', tenantId: 't1', userId: 'u1', instrumentId: 'i5', templateCode: 'calibration_d7', channel: 'kakao', recipient: '010-1234-5678', title: '교정 7일 전 알림', body: '[MetroAI] 교정 7일 전 안내\n\n관리번호 MA-20260508-0019의 교정이 7일 후 만료됩니다.', status: 'pending', sentAt: null, scheduledAt: NOW_ISO, createdAt: NOW_ISO },
];

const MOCK_REPORTS = [
  { id: 'r1', reportType: 'iso9001', title: 'ISO 심사 보고서 — 데모 사업장', s3Key: 'demo/r1.pdf', generatedAt: NOW_ISO },
  { id: 'r2', reportType: 'monthly', title: '월간 보고서 — 2026년 5월', s3Key: 'demo/r2.pdf', generatedAt: NOW_ISO },
];

const MOCK_KOLAS = [
  { id: 1, majorCategory: '역학', subCategory: '전자저울 1급', standardCycleMonths: 12, measureUnit: 'g' },
  { id: 2, majorCategory: '역학', subCategory: '전자저울 2급', standardCycleMonths: 12, measureUnit: 'g' },
  { id: 3, majorCategory: '길이', subCategory: '디지털 캘리퍼', standardCycleMonths: 12, measureUnit: 'mm' },
  { id: 4, majorCategory: '전기', subCategory: '디지털 멀티미터', standardCycleMonths: 12, measureUnit: 'V' },
];
const MOCK_MFRS = [
  { id: 1, nameKo: '카스', nameEn: 'CAS' },
  { id: 2, nameKo: '에이앤디', nameEn: 'A&D' },
  { id: 3, nameKo: '미츠토요', nameEn: 'Mitutoyo' },
  { id: 4, nameKo: '플루크', nameEn: 'Fluke' },
];
const MOCK_DEPTS = [
  { id: 'd1', name: '품질관리팀' },
  { id: 'd2', name: '생산1팀' },
  { id: 'd3', name: '연구개발팀' },
];

function mockResponse(url) {
  // Match on pathname so query params don't break matching.
  let pathname;
  try {
    pathname = new URL(url).pathname;
  } catch {
    pathname = url;
  }
  if (pathname === '/v1/dashboard/summary') return MOCK_DASHBOARD;
  if (pathname === '/v1/instruments') return MOCK_INSTRUMENTS_LIST;
  if (/^\/v1\/instruments\/[^/]+$/.test(pathname)) return MOCK_INSTRUMENT_DETAIL;
  if (/^\/v1\/instruments\/[^/]+\/calibrations$/.test(pathname)) return MOCK_CALIBRATIONS;
  if (pathname === '/v1/calibrations/upcoming') return MOCK_UPCOMING;
  if (pathname === '/v1/notifications') return MOCK_NOTIFICATIONS;
  if (pathname === '/v1/reports') return MOCK_REPORTS;
  if (/^\/v1\/reports\/[^/]+$/.test(pathname)) return { id: 'r1', type: 'iso9001', title: 'ISO 심사 보고서', status: 'completed', downloadUrl: 'about:blank', expiresAt: null };
  if (pathname === '/v1/master/kolas-categories') return MOCK_KOLAS;
  if (pathname === '/v1/master/manufacturers') return MOCK_MFRS;
  if (pathname === '/v1/departments') return MOCK_DEPTS;
  return null;
}

// --- Run ---------------------------------------------------------------------
function waitForServer(url, timeoutMs = 60_000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = async () => {
      try {
        const res = await fetch(url);
        if (res.ok) return resolve();
      } catch {}
      if (Date.now() - start > timeoutMs) return reject(new Error(`Timeout waiting for ${url}`));
      setTimeout(tick, 1000);
    };
    tick();
  });
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  console.log('[preview] starting Next.js dev...');
  const next = spawn(
    'pnpm',
    ['--filter', '@metroai/web', 'dev'],
    {
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, NEXT_PUBLIC_API_URL: 'http://localhost:9999/v1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  next.stdout.on('data', (d) => process.stdout.write(`[next] ${d}`));
  next.stderr.on('data', (d) => process.stderr.write(`[next] ${d}`));

  try {
    await waitForServer(`http://localhost:${PORT}`);
    console.log('[preview] Next.js ready');

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    // iPhone 14-ish viewport
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/v1/')) {
        const data = mockResponse(url);
        if (data) {
          console.log(`  [mock 200] ${url}`);
          req.respond({
            status: 200,
            contentType: 'application/json',
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': '*',
            },
            body: JSON.stringify(data),
          });
        } else {
          console.log(`  [mock 404] ${url}`);
          req.respond({ status: 404, contentType: 'application/json', body: '{"error":{"code":"NOT_FOUND","message":"mock miss"}}' });
        }
        return;
      }
      req.continue();
    });
    page.on('console', (msg) => {
      if (['error', 'warning'].includes(msg.type())) {
        console.log(`  [page ${msg.type()}] ${msg.text()}`);
      }
    });
    page.on('pageerror', (err) => console.log(`  [pageerror] ${err.message}`));

    // Pre-seed auth state so dashboard pages render without login.
    await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      localStorage.setItem(
        'metroai-auth',
        JSON.stringify({
          state: {
            user: { id: 'u1', email: 'admin@demo.metroai.kr', name: '관리자', role: 'admin', tenantId: 't1' },
            accessToken: 'fake-access-token',
            refreshToken: 'fake-refresh-token',
          },
          version: 0,
        }),
      );
    });

    const routes = [
      { name: '01-landing', path: '/' },
      { name: '02-login', path: '/login' },
      { name: '03-register', path: '/register' },
      { name: '04-dashboard', path: '/dashboard' },
      { name: '05-instruments-list', path: '/instruments' },
      { name: '06-instrument-detail', path: '/instruments/i1' },
      { name: '07-instrument-new', path: '/instruments/new' },
      { name: '08-calendar', path: '/calendar' },
      { name: '09-notifications', path: '/notifications' },
      { name: '10-reports', path: '/reports' },
    ];

    for (const r of routes) {
      const url = `http://localhost:${PORT}${r.path}`;
      console.log(`[preview] ${r.name} → ${url}`);
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      } catch (err) {
        console.warn(`  navigate timeout, capturing anyway: ${err.message}`);
      }
      // Give React Query time to fetch mocked data + render.
      await new Promise((r) => setTimeout(r, 2500));
      await page.screenshot({
        path: path.join(OUT_DIR, `${r.name}.png`),
        fullPage: true,
      });
    }

    await browser.close();
    console.log(`[preview] done. screenshots in ${OUT_DIR}`);
  } finally {
    next.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
