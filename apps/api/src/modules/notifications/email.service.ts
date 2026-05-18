import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// AWS SES wrapper. Stubbed for Phase 1; real send lands in Week 11 alongside SES domain verification.
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly from: string;

  constructor(cfg: ConfigService) {
    this.from = cfg.get<string>('EMAIL_FROM', 'no-reply@metroai.kr');
  }

  async send(args: { to: string; subject: string; body: string }): Promise<{ sent: boolean }> {
    this.logger.warn(
      `[stub] Email → ${args.to} from ${this.from} | subject="${args.subject}" | body="${args.body.slice(0, 80)}..."`,
    );
    return { sent: true };
  }
}
