import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { RecognizeInstrumentResponse, Suggestion } from '@metroai/types';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../uploads/s3.service';
import { MatchingService } from './matching.service';
import { VisionService } from './vision.service';

// Weighted aggregation: vision 40%, db match 40%, pattern 20%.
function weightedConfidence(vision: number, dbMatch: number, pattern = 0): number {
  return Math.round((vision * 0.4 + dbMatch * 0.4 + pattern * 0.2) * 100);
}

@Injectable()
export class RecognitionOrchestrator {
  private readonly logger = new Logger(RecognitionOrchestrator.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
    private readonly vision: VisionService,
    private readonly matching: MatchingService,
  ) {}

  async recognize(
    tenantId: string,
    photoIds: string[],
  ): Promise<RecognizeInstrumentResponse> {
    const startedAt = Date.now();

    const photos = await this.prisma.instrumentPhoto.findMany({
      where: { id: { in: photoIds }, tenantId },
    });
    if (photos.length === 0) throw new Error('업로드된 사진을 찾을 수 없습니다');

    const visionResult = await this.vision.recognizeInstrument(photos.map((p) => p.s3Key));

    const [mfrMatch, categoryMatch] = await Promise.all([
      this.matching.matchManufacturer(visionResult.manufacturer.value ?? ''),
      this.matching.matchKolasCategory(visionResult.category.value ?? ''),
    ]);

    const modelMatch = mfrMatch.value
      ? await this.matching.matchModel(mfrMatch.value.id, visionResult.model.value ?? '')
      : { value: null, confidence: 0, method: 'none' as const, candidates: [] };

    const recognitionId = randomUUID();
    const durationMs = Date.now() - startedAt;

    this.logger.log(
      `recognize ${recognitionId}: ${photos.length} photos, ${durationMs}ms, tokens=${visionResult.usage.inputTokens}/${visionResult.usage.outputTokens}`,
    );

    // Build presigned preview URLs for the photos so the client can render them.
    const uploadedPhotos = await Promise.all(
      photos.map(async (p) => ({
        photoId: p.id,
        s3Key: p.s3Key,
        previewUrl: await this.s3.getPresignedDownloadUrl(p.s3Key).catch(() => ''),
      })),
    );

    const overall = weightedConfidence(
      ((visionResult.manufacturer.confidence + visionResult.model.confidence) / 2) || 0,
      ((mfrMatch.confidence + modelMatch.confidence) / 2) || 0,
      visionResult.serial.confidence,
    );

    const categorySuggestion: Suggestion<{ id: number; name: string }> | null = categoryMatch.value
      ? {
          value: { id: categoryMatch.value.id, name: categoryMatch.value.subCategory },
          confidence: Math.round(categoryMatch.confidence * 100),
          alternatives: categoryMatch.candidates.slice(1).map((c) => ({
            value: { id: c.id, name: c.subCategory },
            confidence: 0,
          })),
        }
      : null;

    const manufacturerSuggestion: Suggestion<{ id: number; name: string }> | null = mfrMatch.value
      ? {
          value: { id: mfrMatch.value.id, name: mfrMatch.value.nameKo },
          confidence: Math.round(mfrMatch.confidence * 100),
          alternatives: mfrMatch.candidates.slice(1).map((c) => ({
            value: { id: c.id, name: c.nameKo },
            confidence: 0,
          })),
        }
      : null;

    const modelSuggestion: Suggestion<{ id: number; name: string }> | null = modelMatch.value
      ? {
          value: { id: modelMatch.value.id, name: modelMatch.value.modelName },
          confidence: Math.round(modelMatch.confidence * 100),
          alternatives: modelMatch.candidates.slice(1).map((c) => ({
            value: { id: c.id, name: c.modelName },
            confidence: 0,
          })),
        }
      : null;

    const serialSuggestion: Suggestion<string> | null = visionResult.serial.value
      ? {
          value: visionResult.serial.value,
          confidence: Math.round(visionResult.serial.confidence * 100),
          alternatives: [],
        }
      : null;

    return {
      recognitionId,
      confidence: overall,
      suggestions: {
        category: categorySuggestion,
        manufacturer: manufacturerSuggestion,
        model: modelSuggestion,
        serialNumber: serialSuggestion,
        measureRange: null,
        accuracyClass: visionResult.accuracy.value
          ? {
              value: visionResult.accuracy.value,
              confidence: Math.round(visionResult.accuracy.confidence * 100),
              alternatives: [],
            }
          : null,
      },
      uploadedPhotos,
      rawText: visionResult.rawText,
    };
  }
}
