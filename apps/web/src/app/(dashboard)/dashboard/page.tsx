export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-sm text-slate-600">계측기 현황 요약</p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { label: '보유 측정기', value: '—' },
          { label: '교정 임박 (D-30)', value: '—' },
          { label: '교정 임박 (D-7)', value: '—' },
          { label: '교정 만료', value: '—' },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-bold">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">최근 활동</h2>
        <p className="mt-2 text-sm text-slate-500">
          데이터가 없습니다. 측정기를 등록하면 이곳에 활동이 표시됩니다.
        </p>
      </section>
    </div>
  );
}
