import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { S3Service } from '../uploads/s3.service';
import { CERTIFICATE_OCR_PROMPT } from './prompts/certificate.prompt';

export interface CertificatePoint {
  point: number;
  expected: number;
  measured: number;
  error: number;
}

export interface CertificateOcrResult {
  certificateNo: string | null;
  performedAt: string | null;
  organizationName: string | null;
  result: 'pass' | 'conditional' | 'fail' | null;
  asFoundData: CertificatePoint[] | null;
  asLeftData: CertificatePoint[] | null;
  uncertainty: string | null;
  nextCalibrationDate: string | null;
  confidences: Record<string, number>;
  rawText: string;
  usage: { inputTokens: number; outputTokens: number };
}

const MODEL_ID = 'claude-opus-4-7';

@Injectable()
export class CertificateOcrService {
  private readonly logger = new Logger(CertificateOcrService.name);
  private readonly client: Anthropic;

  constructor(cfg: ConfigService, private readonly s3: S3Service) {
    this.client = new Anthropic({ apiKey: cfg.getOrThrow<string>('ANTHROPIC_API_KEY') });
  }

  async extract(s3Keys: string[]): Promise<CertificateOcrResult> {
    if (s3Keys.length === 0 || s3Keys.length > 3) {
      throw new Error('성적서 사진은 1~3장만 가능합니다');
    }

    const imageBlocks = await Promise.all(
      s3Keys.map(async (key): Promise<Anthropic.ImageBlockParam> => {
        const buffer = await this.s3.fetchObject(key);
        return {
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: buffer.toString('base64') },
        };
      }),
    );

    const response = await this.client.messages.create({
      model: MODEL_ID,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [...imageBlocks, { type: 'text', text: CERTIFICATE_OCR_PROMPT }],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('AI 응답 형식이 올바르지 않습니다');
    }

    const parsed = this.parseJson(textBlock.text);
    return {
      ...parsed,
      rawText: textBlock.text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  private parseJson(text: string): Omit<CertificateOcrResult, 'rawText' | 'usage'> {
    const match = /```json\s*([\s\S]*?)\s*```/.exec(text);
    const jsonStr = match?.[1] ?? text;
    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(jsonStr.trim()) as Record<string, unknown>;
    } catch {
      this.logger.warn(`OCR JSON parse failed: ${text.slice(0, 200)}`);
      throw new Error('성적서 응답 파싱 실패');
    }

    const result = raw.result;
    const validResult: 'pass' | 'conditional' | 'fail' | null =
      result === 'pass' || result === 'conditional' || result === 'fail' ? result : null;

    return {
      certificateNo: typeof raw.certificateNo === 'string' ? raw.certificateNo : null,
      performedAt: typeof raw.performedAt === 'string' ? raw.performedAt : null,
      organizationName: typeof raw.organizationName === 'string' ? raw.organizationName : null,
      result: validResult,
      asFoundData: this.coercePoints(raw.asFoundData),
      asLeftData: this.coercePoints(raw.asLeftData),
      uncertainty: typeof raw.uncertainty === 'string' ? raw.uncertainty : null,
      nextCalibrationDate:
        typeof raw.nextCalibrationDate === 'string' ? raw.nextCalibrationDate : null,
      confidences:
        typeof raw.confidences === 'object' && raw.confidences
          ? (raw.confidences as Record<string, number>)
          : {},
    };
  }

  private coercePoints(value: unknown): CertificatePoint[] | null {
    if (!Array.isArray(value)) return null;
    return value
      .filter(
        (v): v is CertificatePoint =>
          typeof v === 'object' &&
          v !== null &&
          typeof (v as CertificatePoint).point === 'number' &&
          typeof (v as CertificatePoint).measured === 'number',
      )
      .map((v) => ({
        point: v.point,
        expected: v.expected ?? 0,
        measured: v.measured,
        error: v.error ?? v.measured - (v.expected ?? 0),
      }));
  }
}
