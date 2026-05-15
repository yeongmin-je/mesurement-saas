'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth';
import type { AuthResponse } from '@metroai/types';

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    tenantName: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await apiClient.post<AuthResponse>('/auth/register', form);
      setSession(result);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : '가입 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-semibold">사업장 가입</h1>
      <p className="mt-2 text-sm text-slate-600">
        가입하면 새 사업장이 생성되고 본인이 관리자로 등록됩니다.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="사업장 이름" value={form.tenantName} onChange={(v) => setForm({ ...form, tenantName: v })} required />
        <Field label="이름" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <Field label="이메일" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
        <Field label="휴대폰 (010-1234-5678)" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
        <Field label="비밀번호 (8자 이상)" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />

        {error && <p className="text-sm text-status-overdue">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? '가입 중...' : '가입하기'}
        </button>

        <p className="text-sm text-slate-600">
          이미 계정이 있나요? <Link href="/login" className="text-brand-600">로그인</Link>
        </p>
      </form>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
      />
    </label>
  );
}
