'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface UpcomingInstrument {
  id: string;
  assetCode: string;
  nextCalibrationAt: string;
  model: { modelName: string; manufacturer: { nameKo: string } } | null;
  department: { name: string } | null;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function buildCalendarGrid(month: Date): Array<{ date: Date; inMonth: boolean }> {
  const first = startOfMonth(month);
  // Start from Sunday before the first day of month.
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());

  const cells: Array<{ date: Date; inMonth: boolean }> = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    cells.push({ date, inMonth: date.getMonth() === month.getMonth() });
  }
  return cells;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function CalendarPage() {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));

  // Fetch the next 90 days of upcoming calibrations — covers a typical month view.
  const { data, isLoading } = useQuery({
    queryKey: ['calendar', 'upcoming'],
    queryFn: () =>
      apiClient.get<UpcomingInstrument[]>('/calibrations/upcoming?daysAhead=90'),
  });

  const grouped = useMemo(() => {
    const map = new Map<string, UpcomingInstrument[]>();
    for (const inst of data ?? []) {
      if (!inst.nextCalibrationAt) continue;
      const key = inst.nextCalibrationAt.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(inst);
      map.set(key, list);
    }
    return map;
  }, [data]);

  const cells = useMemo(() => buildCalendarGrid(cursor), [cursor]);
  const today = isoDate(new Date());

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">교정 캘린더</h1>
          <p className="text-sm text-slate-600">차기 교정일이 표시됩니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
          >
            ←
          </button>
          <span className="text-base font-medium">
            {cursor.getFullYear()}년 {cursor.getMonth() + 1}월
          </span>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
          >
            →
          </button>
          <button
            onClick={() => setCursor(startOfMonth(new Date()))}
            className="ml-2 rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
          >
            오늘
          </button>
        </div>
      </header>

      {isLoading && <p className="text-sm text-slate-500">불러오는 중...</p>}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-medium text-slate-600">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((c, i) => {
            const key = isoDate(c.date);
            const items = grouped.get(key) ?? [];
            const isToday = key === today;
            return (
              <div
                key={i}
                className={`min-h-24 border-b border-r border-slate-100 p-2 ${
                  c.inMonth ? '' : 'bg-slate-50/60 text-slate-400'
                } ${isToday ? 'bg-brand-50' : ''}`}
              >
                <div className="text-xs font-medium">{c.date.getDate()}</div>
                <div className="mt-1 space-y-1">
                  {items.slice(0, 3).map((inst) => {
                    const daysFromToday = Math.round(
                      (new Date(key).getTime() - new Date(today).getTime()) / 86_400_000,
                    );
                    const tone =
                      daysFromToday < 0
                        ? 'bg-red-100 text-red-800'
                        : daysFromToday <= 7
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800';
                    return (
                      <Link
                        key={inst.id}
                        href={`/instruments/${inst.id}`}
                        className={`block truncate rounded px-1.5 py-0.5 text-[10px] font-medium ${tone}`}
                      >
                        {inst.assetCode}
                      </Link>
                    );
                  })}
                  {items.length > 3 && (
                    <p className="text-[10px] text-slate-500">+{items.length - 3}건</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
