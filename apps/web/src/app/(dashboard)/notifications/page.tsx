'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Notification } from '@metroai/types';

export default function NotificationsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get<Notification[]>('/notifications'),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">알림</h1>
        <p className="text-sm text-slate-600">교정 임박 측정기에 대한 알림 목록</p>
      </header>

      {isLoading && <p className="text-sm text-slate-500">불러오는 중...</p>}
      {error && <p className="text-sm text-status-overdue">API 오류</p>}

      {data && data.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-500">아직 알림이 없습니다.</p>
        </div>
      )}

      {data && data.length > 0 && (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {data.map((n) => (
            <li key={n.id} className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{n.title ?? n.templateCode ?? '알림'}</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{n.body}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      n.status === 'sent'
                        ? 'bg-green-100 text-green-800'
                        : n.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {n.channel} · {n.status}
                  </span>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(n.scheduledAt).toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
