import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationSchedulerService } from './scheduler.service';
import { KakaoService } from './kakao.service';
import { EmailService } from './email.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationSchedulerService, KakaoService, EmailService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
