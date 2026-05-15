'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { InstrumentSummary, PaginatedResponse } from '@metroai/types';

export default function InstrumentsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['instruments'],
    queryFn: () =>
      apiClient.get<PaginatedResponse<InstrumentSummary>>('/instruments?page=1&limit=20'),
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">측정기</h1>
          <p className="text-sm text-slate-600">등록된 측정기 목록</p>
        </div>
        <button className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          + 측정기 등록
        </button>
      </header>

      {isLoading && <p className="text-sm text-slate-500">불러오는 중...</p>}
      {error && <p className="text-sm text-status-overdue">API에 연결할 수 없습니다.</p>}

      {data && data.data.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-500">등록된 측정기가 없습니다.</p>
        </div>
      )}

      {data && data.data.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">관리번호</th>
                <th className="px-4 py-3">모델</th>
                <th className="px-4 py-3">부서</th>
                <th className="px-4 py-3">차기 교정일</th>
                <th className="px-4 py-3">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.data.map((inst) => (
                <tr key={inst.id}>
                  <td className="px-4 py-3 font-medium">{inst.assetCode}</td>
                  <td className="px-4 py-3">
                    {inst.model ? `${inst.model.manufacturer} ${inst.model.name}` : '-'}
                  </td>
                  <td className="px-4 py-3">{inst.department ?? '-'}</td>
                  <td className="px-4 py-3">{inst.nextCalibrationAt ?? '-'}</td>
                  <td className="px-4 py-3">
                    <CalibrationBadge status={inst.calibrationStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CalibrationBadge({ status }: { status: 'normal' | 'imminent' | 'overdue' }) {
  const styles = {
    normal: 'bg-green-100 text-green-800',
    imminent: 'bg-amber-100 text-amber-800',
    overdue: 'bg-red-100 text-red-800',
  } as const;
  const labels = { normal: '정상', imminent: '임박', overdue: '만료' } as const;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
