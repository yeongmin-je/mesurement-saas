'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { InstrumentDetail } from '@metroai/types';

interface KolasCategory {
  id: number;
  majorCategory: string;
  subCategory: string;
  standardCycleMonths: number;
  measureUnit: string | null;
}
interface Manufacturer {
  id: number;
  nameKo: string;
  nameEn: string;
}
interface Department {
  id: string;
  name: string;
}

export default function NewInstrumentPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    serialNumber: '',
    kolasCategoryId: '',
    manufacturerId: '',
    modelText: '',
    measureRangeMin: '',
    measureRangeMax: '',
    measureUnit: '',
    accuracyClass: '',
    departmentId: '',
    location: '',
    acquiredAt: '',
    cycleMonths: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ['master', 'kolas'],
    queryFn: () => apiClient.get<KolasCategory[]>('/master/kolas-categories'),
  });
  const { data: manufacturers } = useQuery({
    queryKey: ['master', 'manufacturers'],
    queryFn: () => apiClient.get<Manufacturer[]>('/master/manufacturers'),
  });
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiClient.get<Department[]>('/departments'),
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        serialNumber: form.serialNumber || undefined,
        kolasCategoryId: form.kolasCategoryId ? Number(form.kolasCategoryId) : undefined,
        manufacturerId: form.manufacturerId ? Number(form.manufacturerId) : undefined,
        modelText: form.modelText || undefined,
        measureRangeMin: form.measureRangeMin ? Number(form.measureRangeMin) : undefined,
        measureRangeMax: form.measureRangeMax ? Number(form.measureRangeMax) : undefined,
        measureUnit: form.measureUnit || undefined,
        accuracyClass: form.accuracyClass || undefined,
        departmentId: form.departmentId || undefined,
        location: form.location || undefined,
        acquiredAt: form.acquiredAt || undefined,
        cycleMonths: form.cycleMonths ? Number(form.cycleMonths) : undefined,
        notes: form.notes || undefined,
      };
      const created = await apiClient.post<InstrumentDetail>('/instruments', payload);
      router.push(`/instruments/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '등록 실패');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">측정기 등록</h1>
        <p className="text-sm text-slate-600">수동 입력으로 측정기를 등록합니다.</p>
      </header>

      <form onSubmit={onSubmit} className="grid max-w-3xl grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-white p-6">
        <Select
          label="KOLAS 카테고리"
          value={form.kolasCategoryId}
          onChange={(v) => setForm({ ...form, kolasCategoryId: v })}
          options={(categories ?? []).map((c) => ({
            value: String(c.id),
            label: `${c.majorCategory} > ${c.subCategory}`,
          }))}
        />
        <Select
          label="제조사"
          value={form.manufacturerId}
          onChange={(v) => setForm({ ...form, manufacturerId: v })}
          options={(manufacturers ?? []).map((m) => ({ value: String(m.id), label: m.nameKo }))}
        />
        <Field label="모델명" value={form.modelText} onChange={(v) => setForm({ ...form, modelText: v })} />
        <Field label="시리얼 번호" value={form.serialNumber} onChange={(v) => setForm({ ...form, serialNumber: v })} />

        <Field label="측정범위 최소" type="number" value={form.measureRangeMin} onChange={(v) => setForm({ ...form, measureRangeMin: v })} />
        <Field label="측정범위 최대" type="number" value={form.measureRangeMax} onChange={(v) => setForm({ ...form, measureRangeMax: v })} />
        <Field label="단위" value={form.measureUnit} onChange={(v) => setForm({ ...form, measureUnit: v })} />
        <Field label="정밀도" value={form.accuracyClass} onChange={(v) => setForm({ ...form, accuracyClass: v })} />

        <Select
          label="부서"
          value={form.departmentId}
          onChange={(v) => setForm({ ...form, departmentId: v })}
          options={(departments ?? []).map((d) => ({ value: d.id, label: d.name }))}
        />
        <Field label="보관 위치" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />

        <Field label="도입일" type="date" value={form.acquiredAt} onChange={(v) => setForm({ ...form, acquiredAt: v })} />
        <Field label="교정주기 (월, 비우면 KOLAS 기본값)" type="number" value={form.cycleMonths} onChange={(v) => setForm({ ...form, cycleMonths: v })} />

        <label className="col-span-2 block">
          <span className="text-sm font-medium">비고</span>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
        </label>

        {error && <p className="col-span-2 text-sm text-status-overdue">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="col-span-2 rounded-md bg-brand-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? '등록 중...' : '등록'}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 focus:border-brand-500 focus:outline-none"
      >
        <option value="">선택</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
