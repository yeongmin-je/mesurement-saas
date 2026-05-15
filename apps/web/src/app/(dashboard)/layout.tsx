import Link from 'next/link';
import { Gauge, Boxes, CalendarClock, Bell, FileBarChart, Settings } from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: '대시보드', icon: Gauge },
  { href: '/instruments', label: '측정기', icon: Boxes },
  { href: '/calibrations', label: '교정 이력', icon: CalendarClock },
  { href: '/notifications', label: '알림', icon: Bell },
  { href: '/reports', label: '보고서', icon: FileBarChart },
  { href: '/settings', label: '설정', icon: Settings },
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 border-r border-slate-200 bg-white px-4 py-6">
        <div className="px-2 text-lg font-bold text-brand-600">MetroAI</div>
        <nav className="mt-8 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 px-8 py-6">{children}</div>
    </div>
  );
}
