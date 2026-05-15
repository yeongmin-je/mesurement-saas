import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { S3Service } from '../uploads/s3.service';
import { INSTRUMENT_RECOGNITION_PROMPT } from './prompts/instrument.prompt';

interface VisionField<T> {
  value: T | null;
  confidence: number;
}

export interface VisionRecognitionResult {
  category: VisionField<string>;
  manufacturer: VisionField<string>;
  model: VisionField<string>;
  measureRange: VisionField<string>;
  accuracy: VisionField<string>;
  serial: VisionField<string>;
  rawText: string;
  usage: { inputTokens: number; outputTokens: number };
}

const MODEL_ID = 'claude-opus-4-7';

@Injectable()
export class VisionService {
  private readonly logger = new Logger(VisionService.name);
  private readonly client: Anthropic;

  constructor(
    cfg: ConfigService,
    private readonly s3: S3Service,
  ) {
    this.client = new Anthropic({ apiKey: cfg.getOrThrow<string>('ANTHROPIC_API_KEY') });
  }

  async recognizeInstrument(s3Keys: string[]): Promise<VisionRecognitionResult> {
    if (s3Keys.length === 0 || s3Keys.length > 3) {
      throw new Error('사진은 1~3장만 인식 가능합니다');
    }

    const imageBlocks = await Promise.all(
      s3Keys.map(async (key): Promise<Anthropic.ImageBlockParam> => {
        const buffer = await this.s3.fetchObject(key);
        return {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: buffer.toString('base64'),
          },
        };
      }),
    );

    const response = await this.client.messages.create({
      model: MODEL_ID,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [...imageBlocks, { type: 'text', text: INSTRUMENT_RECOGNITION_PROMPT }],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('AI 응답 형식이 올바르지 않습니다');
    }

    const parsed = this.parseJsonResponse(textBlock.text);
    return {
      ...parsed,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  private parseJsonResponse(text: string): Omit<VisionRecognitionResult, 'usage'> {
    const match = /```json\s*([\s\S]*?)\s*```/.exec(text);
    const jsonStr = match ? match[1] : text;
    if (!jsonStr) throw new Error('AI 응답이 비어있습니다');

    let raw: unknown;
    try {
      raw = JSON.parse(jsonStr.trim());
    } catch (err) {
      this.logger.warn(`Failed to parse AI JSON: ${text.slice(0, 200)}...`);
      throw new Error('AI 응답 JSON 파싱 실패');
    }

    return this.coerce(raw);
  }

  private coerce(raw: unknown): Omit<VisionRecognitionResult, 'usage'> {
    const r = raw as Record<string, unknown>;
    const field = (key: string): VisionField<string> => {
      const f = r[key] as { value?: unknown; confidence?: unknown } | undefined;
      const value = typeof f?.value === 'string' && f.value.trim() ? f.value.trim() : null;
      const confidence =
        typeof f?.confidence === 'number'
          ? Math.max(0, Math.min(1, f.confidence))
          : 0;
      return { value, confidence };
    };
    return {
      category: field('category'),
      manufacturer: field('manufacturer'),
      model: field('model'),
      measureRange: field('measureRange'),
      accuracy: field('accuracy'),
      serial: field('serial'),
      rawText: typeof r.rawText === 'string' ? r.rawText : '',
    };
  }
}
