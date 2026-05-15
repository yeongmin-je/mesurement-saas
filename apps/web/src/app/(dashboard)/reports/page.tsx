'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { formatKoreanDate } from '@metroai/utils';

interface ReportRow {
  id: string;
  reportType: string;
  title: string | null;
  s3Key: string | null;
  generatedAt: string;
}

interface ReportDetail {
  id: string;
  type: string;
  title: string | null;
  status: 'generating' | 'completed' | 'failed';
  downloadUrl: string | null;
}

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [type, setType] = useState<'iso9001' | 'department' | 'monthly'>('iso9001');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const { data } = useQuery({
    queryKey: ['reports'],
    queryFn: () => apiClient.get<ReportRow[]>('/reports'),
    refetchInterval: 3000,
  });

  const generate = useMutation({
    mutationFn: async () => {
      const parameters: Record<string, unknown> = {};
      if (type === 'iso9001') {
        if (dateFrom) parameters.dateFrom = dateFrom;
        if (dateTo) parameters.dateTo = dateTo;
      } else if (type === 'monthly') {
        parameters.year = year;
        parameters.month = month;
      }
      return apiClient.post<{ reportId: string }>('/reports/generate', { type, parameters });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">보고서</h1>
        <p className="text-sm text-slate-600">ISO 심사 / 부서별 / 월간 PDF 보고서</p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">새 보고서 생성</h2>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <label className="block">
            <span className="text-sm font-medium">유형</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2"
            >
              <option value="iso9001">ISO 심사</option>
              <option value="monthly">월간</option>
            </select>
          </label>

          {type === 'iso9001' && (
            <>
              <label className="block">
                <span className="text-sm font-medium">기간 시작</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">기간 종료</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
                />
              </label>
            </>
          )}

          {type === 'monthly' && (
            <>
              <label className="block">
                <span className="text-sm font-medium">연도</span>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">월</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
                />
              </label>
            </>
          )}
        </div>

        <button
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          className="mt-4 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {generate.isPending ? '생성 중...' : '보고서 생성'}
        </button>
        {generate.error && (
          <p className="mt-2 text-sm text-status-overdue">
            {generate.error instanceof Error ? generate.error.message : '오류'}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-3 text-sm font-semibold">생성 이력</div>
        {!data || data.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">아직 생성된 보고서가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {data.map((r) => (
              <ReportItem key={r.id} row={r} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ReportItem({ row }: { row: ReportRow }) {
  const { data: detail } = useQuery({
    queryKey: ['report', row.id],
    queryFn: () => apiClient.get<ReportDetail>(`/reports/${row.id}`),
    refetchInterval: (q) =>
      q.state.data?.status === 'generating' ? 2000 : false,
  });

  return (
    <li className="flex items-center justify-between px-6 py-4">
      <div>
        <p className="text-sm font-medium">{row.title ?? row.reportType}</p>
        <p className="text-xs text-slate-500">
          {row.reportType} · {formatKoreanDate(row.generatedAt)}
        </p>
      </div>
      {detail?.status === 'completed' && detail.downloadUrl ? (
        <a
          href={detail.downloadUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
        >
          PDF 다운로드
        </a>
      ) : detail?.status === 'failed' ? (
        <span className="text-xs text-status-overdue">실패</span>
      ) : (
        <span className="text-xs text-slate-500">생성 중...</span>
      )}
    </li>
  );
}
