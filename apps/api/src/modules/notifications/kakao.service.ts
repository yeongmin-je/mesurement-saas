import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// NHN biz-message Kakao Alimtalk integration.
// Phase 1 stub: logs the payload. Wire to real API in Week 11 once
// the sender key / business registration is approved (영민님 별도 진행).
@Injectable()
export class KakaoService {
  private readonly logger = new Logger(KakaoService.name);
  private readonly senderKey: string | undefined;
  private readonly apiKey: string | undefined;

  constructor(cfg: ConfigService) {
    this.senderKey = cfg.get<string>('KAKAO_SENDER_KEY');
    this.apiKey = cfg.get<string>('KAKAO_API_KEY');
  }

  async send(args: {
    recipientPhone: string;
    templateCode: string;
    body: string;
  }): Promise<{ sent: boolean; reason?: string }> {
    if (!this.senderKey || !this.apiKey) {
      this.logger.warn(
        `[stub] KakaoTalk → ${args.recipientPhone} | ${args.templateCode} | "${args.body.slice(0, 60)}..."`,
      );
      return { sent: true, reason: 'stub_mode_no_credentials' };
    }

    // TODO(Week 11): replace with real NHN biz-message call once credentials land.
    this.logger.log(
      `[live] KakaoTalk → ${args.recipientPhone} | ${args.templateCode} (real call not yet wired)`,
    );
    return { sent: true };
  }
}
