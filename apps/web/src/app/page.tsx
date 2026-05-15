import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <div className="space-y-6">
        <p className="text-sm font-medium uppercase tracking-widest text-brand-600">MetroAI</p>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          사진 한 장으로 측정기를 등록하고,
          <br />
          <span className="text-brand-600">AI</span>가 교정 일정을 자동 관리합니다
        </h1>
        <p className="max-w-2xl text-lg text-slate-600">
          KOLAS 표준주기 자동 매칭, 카카오 알림톡 자동 알림, ISO 심사용 보고서 자동 생성까지.
          한국 제조 현장에 최적화된 계측기 관리 SaaS.
        </p>
        <div className="flex gap-3 pt-4">
          <Link
            href="/login"
            className="rounded-md bg-brand-600 px-6 py-3 font-medium text-white shadow-sm hover:bg-brand-700"
          >
            로그인
          </Link>
          <Link
            href="/register"
            className="rounded-md border border-slate-300 bg-white px-6 py-3 font-medium text-slate-900 hover:bg-slate-50"
          >
            가입하기
          </Link>
        </div>
      </div>

      <footer className="mt-24 border-t border-slate-200 pt-8 text-sm text-slate-500">
        Phase 1 MVP scaffold · 자세한 내용은{' '}
        <code className="rounded bg-slate-100 px-1.5 py-0.5">docs/</code> 폴더를 확인하세요.
      </footer>
    </main>
  );
}
