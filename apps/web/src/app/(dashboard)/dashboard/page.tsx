'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface DashboardSummary {
  totalInstruments: number;
  activeInstruments: number;
  calibrationsThisMonth: number;
  calibrationsImminent: number;
  calibrationsOverdue: number;
  statusDistribution: Record<string, number>;
  departmentDistribution: Array<{
    departmentId: string | null;
    name: string;
    count: number;
  }>;
  recentActivities: Array<{
    type: 'instrument_registered';
    instrumentId: string;
    assetCode: string;
    userName: string;
    at: string;
  }>;
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => apiClient.get<DashboardSummary>('/dashboard/summary'),
  });

  const stats = [
    { label: '보유 측정기', value: data?.totalInstruments ?? '—', tone: 'normal' as const },
    {
      label: '교정 임박 (D-30)',
      value: data?.calibrationsImminent ?? '—',
      tone: 'imminent' as const,
    },
    {
      label: '교정 만료',
      value: data?.calibrationsOverdue ?? '—',
      tone: 'overdue' as const,
    },
    {
      label: '이번달 교정',
      value: data?.calibrationsThisMonth ?? '—',
      tone: 'normal' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-sm text-slate-600">계측기 현황 요약</p>
      </header>

      {isLoading && <p className="text-sm text-slate-500">불러오는 중...</p>}
      {error && <p className="text-sm text-status-overdue">API에 연결할 수 없습니다.</p>}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {stats.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {card.label}
            </p>
            <p
              className={`mt-2 text-3xl font-bold ${
                card.tone === 'overdue'
                  ? 'text-status-overdue'
                  : card.tone === 'imminent'
                    ? 'text-status-imminent'
                    : ''
              }`}
            >
              {card.value}
            </p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">부서별 분포</h2>
          {!data || data.departmentDistribution.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">데이터가 없습니다.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {data.departmentDistribution.map((d) => (
                <li key={d.departmentId ?? d.name} className="flex justify-between text-sm">
                  <span>{d.name}</span>
                  <span className="font-medium">{d.count}대</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">최근 활동</h2>
          {!data || data.recentActivities.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">데이터가 없습니다.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {data.recentActivities.map((a) => (
                <li key={a.instrumentId} className="flex justify-between">
                  <span>
                    <span className="font-medium">{a.assetCode}</span> 등록
                  </span>
                  <span className="text-slate-500">
                    {a.userName} · {new Date(a.at).toLocaleDateString('ko-KR')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
