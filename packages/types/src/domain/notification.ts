export type NotificationChannel = 'push' | 'kakao' | 'sms' | 'email';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

export interface Notification {
  id: string;
  tenantId: string;
  userId: string | null;
  instrumentId: string | null;
  templateCode: string | null;
  channel: NotificationChannel;
  recipient: string | null;
  title: string | null;
  body: string | null;
  status: NotificationStatus;
  sentAt: string | null;
  scheduledAt: string;
  createdAt: string;
}

export interface NotificationPreferences {
  userId: string;
  pushEnabled: boolean;
  kakaoEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}
