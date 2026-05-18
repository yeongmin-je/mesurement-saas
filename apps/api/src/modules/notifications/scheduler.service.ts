import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(private readonly notifications: NotificationsService) {}

  // Daily 06:00 KST scan: enqueue notifications for instruments crossing D-30/14/7/1/overdue.
  @Cron('0 6 * * *', { timeZone: 'Asia/Seoul' })
  async dailyScan(): Promise<void> {
    const result = await this.notifications.scanAndQueue();
    this.logger.log(`daily scan complete: ${result.queued} notifications queued`);
  }

  // Deliver pending notifications every 5 minutes. Week 11 replaces with Bull queue.
  @Cron(CronExpression.EVERY_5_MINUTES)
  async deliverPending(): Promise<void> {
    const result = await this.notifications.deliverPending();
    if (result.sent > 0 || result.failed > 0) {
      this.logger.log(`delivery: sent=${result.sent} failed=${result.failed}`);
    }
  }
}
