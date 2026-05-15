import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { KakaoService } from './kakao.service';
import { EmailService } from './email.service';

// Maps day-offset to a template code.
//   30 → calibration_d30, 14 → calibration_d14, ...,  <0 → calibration_overdue.
function pickTemplateCode(daysUntil: number): string | null {
  if (daysUntil < 0) return 'calibration_overdue';
  if (daysUntil === 1) return 'calibration_d1';
  if (daysUntil === 7) return 'calibration_d7';
  if (daysUntil === 14) return 'calibration_d14';
  if (daysUntil === 30) return 'calibration_d30';
  return null;
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/{{\s*([\w.]+)\s*}}/g, (_, key: string) => vars[key] ?? '');
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kakao: KakaoService,
    private readonly email: EmailService,
  ) {}

  async scanAndQueue(now: Date = new Date()): Promise<{ queued: number }> {
    // Find instruments whose next calibration date crosses one of our notification thresholds.
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const instruments = await this.prisma.instrument.findMany({
      where: { status: 'active', nextCalibrationAt: { not: null } },
      include: {
        tenant: true,
        custodian: { include: { preferences: true } },
        department: true,
        model: { include: { manufacturer: true } },
        kolasCategory: true,
      },
    });

    let queued = 0;
    for (const inst of instruments) {
      if (!inst.nextCalibrationAt) continue;
      const days = Math.round(
        (inst.nextCalibrationAt.getTime() - startOfDay.getTime()) / 86_400_000,
      );
      const code = pickTemplateCode(days);
      if (!code) continue;

      // Recipients: custodian first; fallback to all tenant admins.
      const recipients = inst.custodian
        ? [inst.custodian]
        : await this.prisma.user.findMany({
            where: { tenantId: inst.tenantId, role: 'admin' },
          });

      for (const recipient of recipients) {
        await this.queueForRecipient(code, inst, recipient, days);
        queued++;
      }
    }

    this.logger.log(`scan: ${queued} notifications queued`);
    return { queued };
  }

  private async queueForRecipient(
    templateCode: string,
    instrument: NonNullable<
      Awaited<ReturnType<NotificationsService['fetchInstrumentForTemplate']>>
    >,
    recipient: { id: string; name: string; email: string; phone: string | null },
    daysUntil: number,
  ): Promise<void> {
    const templates = await this.prisma.notificationTemplate.findMany({
      where: { code: templateCode, isActive: true },
    });

    const vars: Record<string, string> = {
      'user.name': recipient.name,
      'instrument.asset_code': instrument.assetCode,
      'instrument.model':
        instrument.model?.modelName ?? instrument.modelText ?? '-',
      'instrument.manufacturer':
        instrument.model?.manufacturer.nameKo ?? instrument.manufacturerText ?? '-',
      'instrument.category':
        instrument.kolasCategory?.subCategory ?? instrument.categoryText ?? '-',
      'instrument.next_calibration_at':
        instrument.nextCalibrationAt?.toISOString().slice(0, 10) ?? '-',
      'instrument.department': instrument.department?.name ?? '-',
      days_overdue: String(Math.max(0, -daysUntil)),
      link: `https://app.metroai.kr/instruments/${instrument.id}`,
      short_link: `https://m.metroai.kr/i/${instrument.id.slice(0, 8)}`,
    };

    for (const template of templates) {
      const body = template.bodyTemplate ? fillTemplate(template.bodyTemplate, vars) : '';
      const title = template.titleTemplate ? fillTemplate(template.titleTemplate, vars) : null;

      await this.prisma.notification.create({
        data: {
          tenantId: instrument.tenantId,
          userId: recipient.id,
          instrumentId: instrument.id,
          templateCode,
          channel: template.channel,
          recipient:
            template.channel === 'email'
              ? recipient.email
              : recipient.phone ?? recipient.email,
          title,
          body,
          status: 'pending',
        },
      });
    }
  }

  // Internal type-helper to extract the include shape used in scanAndQueue.
  private async fetchInstrumentForTemplate(id: string) {
    return this.prisma.instrument.findUnique({
      where: { id },
      include: {
        tenant: true,
        custodian: { include: { preferences: true } },
        department: true,
        model: { include: { manufacturer: true } },
        kolasCategory: true,
      },
    });
  }

  async deliverPending(batchSize = 50): Promise<{ sent: number; failed: number }> {
    const pending = await this.prisma.notification.findMany({
      where: { status: 'pending' },
      take: batchSize,
      orderBy: { scheduledAt: 'asc' },
    });

    let sent = 0;
    let failed = 0;
    for (const n of pending) {
      try {
        if (n.channel === 'kakao' && n.recipient) {
          await this.kakao.send({
            recipientPhone: n.recipient,
            templateCode: n.templateCode ?? '',
            body: n.body ?? '',
          });
        } else if (n.channel === 'email' && n.recipient) {
          await this.email.send({
            to: n.recipient,
            subject: n.title ?? '[MetroAI] 알림',
            body: n.body ?? '',
          });
        } else {
          this.logger.warn(`[push/sms] not implemented yet for notification ${n.id}`);
        }
        await this.prisma.notification.update({
          where: { id: n.id },
          data: { status: 'sent', sentAt: new Date() },
        });
        sent++;
      } catch (err) {
        failed++;
        await this.prisma.notification.update({
          where: { id: n.id },
          data: {
            status: 'failed',
            errorMessage: err instanceof Error ? err.message : String(err),
          },
        });
      }
    }
    return { sent, failed };
  }

  async listForUser(userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { status: 'pending' } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async updatePreferences(
    userId: string,
    dto: {
      pushEnabled?: boolean;
      kakaoEnabled?: boolean;
      smsEnabled?: boolean;
      emailEnabled?: boolean;
      quietHoursStart?: string;
      quietHoursEnd?: string;
    },
  ) {
    return this.prisma.notificationPreferences.upsert({
      where: { userId },
      update: {
        ...dto,
        quietHoursStart: dto.quietHoursStart ? new Date(`1970-01-01T${dto.quietHoursStart}:00Z`) : undefined,
        quietHoursEnd: dto.quietHoursEnd ? new Date(`1970-01-01T${dto.quietHoursEnd}:00Z`) : undefined,
      },
      create: {
        userId,
        ...dto,
        quietHoursStart: dto.quietHoursStart ? new Date(`1970-01-01T${dto.quietHoursStart}:00Z`) : null,
        quietHoursEnd: dto.quietHoursEnd ? new Date(`1970-01-01T${dto.quietHoursEnd}:00Z`) : null,
      },
    });
  }
}
