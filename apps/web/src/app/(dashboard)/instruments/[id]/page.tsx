'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { formatKoreanDate, formatKRW } from '@metroai/utils';
import type { InstrumentDetail, Calibration } from '@metroai/types';

export default function InstrumentDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const { data, isLoading, error } = useQuery({
    queryKey: ['instrument', id],
    queryFn: () => apiClient.get<InstrumentDetail>(`/instruments/${id}`),
  });

  const { data: calibrations } = useQuery({
    queryKey: ['instrument', id, 'calibrations'],
    queryFn: () => apiClient.get<Calibration[]>(`/instruments/${id}/calibrations`),
  });

  if (isLoading) return <p className="text-sm text-slate-500">불러오는 중...</p>;
  if (error || !data) return <p className="text-sm text-status-overdue">측정기를 찾을 수 없습니다.</p>;

  const statusLabels: Record<string, string> = {
    active: '운용중',
    calibrating: '교정중',
    repairing: '수리중',
    suspended: '사용중지',
    discarded: '폐기',
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{data.assetCode}</p>
          <h1 className="text-2xl font-bold">
            {data.manufacturer?.name ?? '-'} {data.model?.name ?? '-'}
          </h1>
          <p className="text-sm text-slate-600">{data.category?.name ?? '-'}</p>
        </div>
        <StatusBadge value={data.status} labels={statusLabels} />
      </header>

      <section className="grid grid-cols-3 gap-4">
        <Card label="시리얼 번호" value={data.serialNumber ?? '-'} />
        <Card label="부서" value={data.department?.name ?? '-'} />
        <Card label="담당자" value={data.custodian?.name ?? '-'} />
        <Card label="보관 위치" value={data.location ?? '-'} />
        <Card label="도입일" value={formatKoreanDate(data.acquiredAt)} />
        <Card label="도입가" value={formatKRW(data.acquiredCost)} />
        <Card
          label="측정범위"
          value={
            data.measureRange.min != null || data.measureRange.max != null
              ? `${data.measureRange.min ?? 0} ~ ${data.measureRange.max ?? '-'} ${data.measureRange.unit ?? ''}`
              : '-'
          }
        />
        <Card label="정밀도" value={data.accuracyClass ?? '-'} />
        <Card label="교정주기" value={`${data.cycleMonths}개월`} />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">교정 정보</h2>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <Card label="최근 교정일" value={formatKoreanDate(data.lastCalibrationAt)} />
          <Card
            label="차기 교정일"
            value={formatKoreanDate(data.nextCalibrationAt)}
            highlight={data.calibrationStatus}
          />
          <Card
            label="남은 일수"
            value={
              data.daysUntilCalibration != null
                ? data.daysUntilCalibration >= 0
                  ? `D-${data.daysUntilCalibration}`
                  : `D+${Math.abs(data.daysUntilCalibration)}`
                : '-'
            }
            highlight={data.calibrationStatus}
          />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">교정 이력</h2>
        {!calibrations || calibrations.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">아직 등록된 교정 이력이 없습니다.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {calibrations.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded border border-slate-100 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{formatKoreanDate(c.performedAt)}</p>
                  <p className="text-xs text-slate-500">
                    {c.calibrationOrgText ?? '-'} · {c.certificateNo ?? '-'}
                  </p>
                </div>
                <ResultBadge result={c.result} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {data.notes && (
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">비고</h2>
          <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{data.notes}</p>
        </section>
      )}
    </div>
  );
}

function Card({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: 'normal' | 'imminent' | 'overdue';
}) {
  const colour =
    highlight === 'overdue'
      ? 'text-status-overdue'
      : highlight === 'imminent'
        ? 'text-status-imminent'
        : '';
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-base font-semibold ${colour}`}>{value}</p>
    </div>
  );
}

function StatusBadge({
  value,
  labels,
}: {
  value: string;
  labels: Record<string, string>;
}) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
      {labels[value] ?? value}
    </span>
  );
}

function ResultBadge({ result }: { result: string | null }) {
  if (!result) return <span className="text-xs text-slate-400">미입력</span>;
  const styles: Record<string, string> = {
    pass: 'bg-green-100 text-green-800',
    conditional: 'bg-amber-100 text-amber-800',
    fail: 'bg-red-100 text-red-800',
  };
  const labels: Record<string, string> = {
    pass: '합격',
    conditional: '조건부',
    fail: '불합격',
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[result] ?? 'bg-slate-100'}`}>
      {labels[result] ?? result}
    </span>
  );
}
