# 06. AI 통합 상세 설계

> Claude Vision API + 내부 DB 매칭 + 신뢰도 계산의 전체 파이프라인

## 개요

```
[사진 1~3장]
   ↓
[1] 전처리 (압축·정규화)
   ↓
[2] Claude Vision API 호출 (OCR + 분석)
   ↓
[3] 내부 마스터 DB 매칭 (Fuzzy)
   ↓
[4] 신뢰도 계산 (다중 요소)
   ↓
[5] 후보 정렬 + 응답 생성
   ↓
[클라이언트에서 사용자 확정]
```

---

## 1. 사진 전처리

### 1.1 클라이언트 측 (모바일·웹)

**모바일 (React Native)**:
```typescript
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

async function preprocessPhoto(uri: string): Promise<string> {
  const result = await manipulateAsync(
    uri,
    [
      { resize: { width: 1920 } },  // 최대 1920px
    ],
    {
      compress: 0.8,                 // 80% 품질
      format: SaveFormat.JPEG,
    }
  );
  return result.uri;
}
```

**웹**:
```typescript
async function preprocessPhoto(file: File): Promise<Blob> {
  const img = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(
    Math.min(img.width, 1920),
    Math.min(img.width, 1920) * (img.height / img.width)
  );
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
}
```

**목표**:
- 파일 크기: 1~2MB
- 해상도: 최대 1920px (긴 변 기준)
- 포맷: JPEG

### 1.2 서버 측 추가 검증

```typescript
async function validateImage(buffer: Buffer): Promise<void> {
  const meta = await sharp(buffer).metadata();

  if (meta.width! < 800 || meta.height! < 800) {
    throw new ValidationError('이미지 해상도가 너무 낮습니다 (최소 800x800)');
  }

  if (buffer.length > 10 * 1024 * 1024) {
    throw new ValidationError('파일 크기가 너무 큽니다 (최대 10MB)');
  }

  // 흐림 검출 (Laplacian variance)
  const blurScore = await calculateBlurScore(buffer);
  if (blurScore < 100) {
    throw new ValidationError('사진이 흐릿합니다. 다시 촬영해주세요');
  }
}
```

---

## 2. Claude Vision API 호출

### 2.1 프롬프트 템플릿

```typescript
const INSTRUMENT_RECOGNITION_PROMPT = `당신은 산업용 측정기를 식별하는 전문가입니다.
사용자가 측정기의 명판(name plate)과 본체 사진을 업로드했습니다.

다음 정보를 JSON 형식으로 추출해주세요:

1. category: 측정기 종류 (저울/캘리퍼/마이크로미터/멀티미터/온도계/압력계 등)
2. manufacturer: 제조사명 (영문 우선, 한글 병기 가능)
3. model: 모델명 (정확한 영숫자 조합)
4. measureRange: 측정범위 (예: "0-220g", "0-150mm")
5. accuracy: 정밀도 또는 등급 (예: "0.1mg", "±0.02mm", "1급")
6. serial: 시리얼 번호 (S/N, Serial No 등)
7. rawText: 명판에서 읽어낸 모든 텍스트

각 항목에 대해 confidence (0.0 ~ 1.0)도 함께 반환하세요.

읽기 어렵거나 정보가 없으면 null로 표시하세요.

응답은 반드시 다음 JSON 형식만 출력하세요:
\`\`\`json
{
  "category": { "value": "...", "confidence": 0.95 },
  "manufacturer": { "value": "...", "confidence": 0.90 },
  "model": { "value": "...", "confidence": 0.88 },
  "measureRange": { "value": "...", "confidence": 0.85 },
  "accuracy": { "value": "...", "confidence": 0.80 },
  "serial": { "value": "...", "confidence": 0.75 },
  "rawText": "..."
}
\`\`\``;
```

### 2.2 API 호출 구현 (NestJS Service)

```typescript
// apps/api/src/ai/vision.service.ts
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class VisionService {
  private readonly client: Anthropic;

  constructor(private readonly config: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.config.get('ANTHROPIC_API_KEY'),
    });
  }

  async recognizeInstrument(
    photoUrls: string[],
    hint?: string,
  ): Promise<RecognitionResult> {
    const startTime = Date.now();

    // 1) Fetch images and convert to base64
    const imageContents = await Promise.all(
      photoUrls.map(async (url) => {
        const buffer = await this.fetchImage(url);
        return {
          type: 'image' as const,
          source: {
            type: 'base64' as const,
            media_type: 'image/jpeg' as const,
            data: buffer.toString('base64'),
          },
        };
      }),
    );

    // 2) Build prompt with optional hint
    let prompt = INSTRUMENT_RECOGNITION_PROMPT;
    if (hint) {
      prompt += `\n\n참고: 사용자가 카테고리를 "${hint}"로 알려주었습니다.`;
    }

    // 3) Call Claude Vision API
    let response: Anthropic.Message;
    try {
      response = await this.client.messages.create({
        model: 'claude-opus-4-7',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              ...imageContents,
              { type: 'text', text: prompt },
            ],
          },
        ],
      });
    } catch (error) {
      this.logger.error('Claude API failed', error);
      throw new ServiceError('AI_SERVICE_ERROR', 'AI 인식 서비스 일시 오류');
    }

    // 4) Parse response
    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new ServiceError('AI_SERVICE_ERROR', 'AI 응답 형식 오류');
    }

    const parsed = this.parseJsonResponse(textBlock.text);

    // 5) Log usage
    await this.logUsage({
      endpoint: 'vision_instrument',
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      imageCount: photoUrls.length,
      durationMs: Date.now() - startTime,
      success: true,
    });

    return parsed;
  }

  private parseJsonResponse(text: string): RawRecognition {
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonStr = match ? match[1] : text;
    try {
      return JSON.parse(jsonStr);
    } catch {
      throw new ServiceError('AI_SERVICE_ERROR', 'AI 응답 파싱 실패');
    }
  }

  private async fetchImage(url: string): Promise<Buffer> {
    // S3 또는 HTTP에서 이미지 다운로드
    if (url.startsWith('s3://')) {
      return this.s3Service.getObject(url);
    }
    const response = await fetch(url);
    return Buffer.from(await response.arrayBuffer());
  }
}
```

---

## 3. 내부 마스터 DB 매칭

### 3.1 매칭 전략

Claude가 반환한 값을 우리 DB와 매칭합니다. 3단계로 진행:

```
[1] Exact Match (대소문자 무시, 트림)
   ↓ 실패 시
[2] Fuzzy Match (Levenshtein distance ≤ 2)
   ↓ 실패 시
[3] Trigram Similarity (PostgreSQL pg_trgm)
```

### 3.2 매칭 서비스 구현

```typescript
// apps/api/src/ai/matching.service.ts
@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(Manufacturer) private readonly mfrRepo: Repository<Manufacturer>,
    @InjectRepository(InstrumentModel) private readonly modelRepo: Repository<InstrumentModel>,
    @InjectRepository(KolasCategory) private readonly kolasRepo: Repository<KolasCategory>,
  ) {}

  async matchManufacturer(rawName: string): Promise<MatchResult<Manufacturer>> {
    const normalized = rawName.trim().toUpperCase();

    // Step 1: Exact match
    const exact = await this.mfrRepo
      .createQueryBuilder('m')
      .where('UPPER(m.name_en) = :n OR UPPER(m.name_ko) = :n OR :n = ANY(m.aliases)', { n: normalized })
      .getOne();
    if (exact) return { value: exact, confidence: 1.0, method: 'exact' };

    // Step 2: Fuzzy with trigram (PostgreSQL similarity)
    const fuzzy = await this.mfrRepo
      .createQueryBuilder('m')
      .addSelect('GREATEST(similarity(m.name_en, :n), similarity(m.name_ko, :n))', 'sim')
      .where('similarity(m.name_en, :n) > 0.4 OR similarity(m.name_ko, :n) > 0.4', { n: rawName })
      .orderBy('sim', 'DESC')
      .limit(5)
      .getMany();

    if (fuzzy.length > 0) {
      const top = fuzzy[0];
      const sim = await this.getSimilarity(top.name_en, rawName);
      return { value: top, confidence: sim, method: 'fuzzy', candidates: fuzzy };
    }

    return { value: null, confidence: 0, method: 'none' };
  }

  async matchModel(
    manufacturerId: number,
    rawModelName: string,
  ): Promise<MatchResult<InstrumentModel>> {
    const cleaned = rawModelName.replace(/\s+/g, '').toUpperCase();

    // Step 1: Exact
    const exact = await this.modelRepo
      .createQueryBuilder('m')
      .where('m.manufacturer_id = :mid', { mid: manufacturerId })
      .andWhere("UPPER(REPLACE(m.model_name, ' ', '')) = :name", { name: cleaned })
      .getOne();
    if (exact) return { value: exact, confidence: 1.0, method: 'exact' };

    // Step 2: Trigram similarity within same manufacturer
    const fuzzy = await this.modelRepo
      .createQueryBuilder('m')
      .addSelect('similarity(m.model_name, :n)', 'sim')
      .where('m.manufacturer_id = :mid', { mid: manufacturerId })
      .andWhere('similarity(m.model_name, :n) > 0.3', { n: rawModelName })
      .orderBy('sim', 'DESC')
      .limit(5)
      .getMany();

    if (fuzzy.length > 0) {
      const top = fuzzy[0];
      const sim = this.calculateModelSimilarity(top.model_name, rawModelName);
      return {
        value: top,
        confidence: sim,
        method: 'fuzzy',
        candidates: fuzzy,
      };
    }

    return { value: null, confidence: 0, method: 'none' };
  }

  private calculateModelSimilarity(a: string, b: string): number {
    // Custom logic for model names (numbers + letters matter)
    const aNorm = a.replace(/\s+/g, '').toUpperCase();
    const bNorm = b.replace(/\s+/g, '').toUpperCase();

    if (aNorm === bNorm) return 1.0;

    // Levenshtein
    const dist = levenshtein(aNorm, bNorm);
    const maxLen = Math.max(aNorm.length, bNorm.length);
    return 1 - dist / maxLen;
  }
}
```

### 3.3 시리얼 번호 패턴 검증

```typescript
async function validateSerial(
  modelId: number,
  rawSerial: string,
): Promise<{ value: string; confidence: number; warning?: string }> {
  const model = await modelRepo.findOne({ where: { id: modelId } });
  if (!model?.serial_pattern) {
    return { value: rawSerial, confidence: 0.7 };
  }

  const pattern = new RegExp(model.serial_pattern);
  if (pattern.test(rawSerial)) {
    return { value: rawSerial, confidence: 0.95 };
  }

  return {
    value: rawSerial,
    confidence: 0.5,
    warning: `이 모델의 시리얼 형식과 다릅니다 (예상: ${model.serial_pattern})`,
  };
}
```

---

## 4. 신뢰도 계산

### 4.1 종합 신뢰도 공식

```typescript
function calculateOverallConfidence(parts: {
  vision: number;       // Claude의 confidence
  dbMatch: number;      // DB 매칭 점수
  patternMatch: number; // 시리얼 패턴 등
}): number {
  // 가중평균: Vision 40%, DB Match 40%, Pattern 20%
  return parts.vision * 0.4 + parts.dbMatch * 0.4 + parts.patternMatch * 0.2;
}
```

### 4.2 신뢰도 등급

| 점수 | 등급 | UI 표시 | 동작 |
|---|---|---|---|
| 0.90 ~ 1.00 | High | 녹색 "신뢰도 94%" | 자동 채움, 사용자 확인만 |
| 0.60 ~ 0.89 | Medium | 노랑 "신뢰도 75%" | 후보 3~5개 제시 |
| 0.40 ~ 0.59 | Low | 주황 "확인 필요" | 직접 입력 + 후보 참고 |
| 0.00 ~ 0.39 | None | 빨강 "다시 촬영" | 재촬영 유도 |

---

## 5. 응답 생성 (최종 결과)

### 5.1 최종 응답 빌더

```typescript
@Injectable()
export class RecognitionOrchestrator {
  async recognize(photoUrls: string[], hint?: string): Promise<RecognitionResult> {
    // 1) Vision API
    const visionResult = await this.visionService.recognizeInstrument(photoUrls, hint);

    // 2) Match each field
    const [manufacturer, kolasCategory] = await Promise.all([
      this.matchingService.matchManufacturer(visionResult.manufacturer.value),
      this.matchingService.matchKolasCategory(visionResult.category.value),
    ]);

    let model: MatchResult<InstrumentModel> = { value: null, confidence: 0, method: 'none' };
    if (manufacturer.value) {
      model = await this.matchingService.matchModel(
        manufacturer.value.id,
        visionResult.model.value,
      );
    }

    const serial = model.value
      ? await this.validateSerial(model.value.id, visionResult.serial.value)
      : { value: visionResult.serial.value, confidence: visionResult.serial.confidence };

    // 3) Overall confidence
    const overall = calculateOverallConfidence({
      vision: (visionResult.manufacturer.confidence + visionResult.model.confidence) / 2,
      dbMatch: (manufacturer.confidence + model.confidence) / 2,
      patternMatch: serial.confidence,
    });

    // 4) Build response
    return {
      confidence: overall,
      recognized: {
        category: kolasCategory.value ? {
          kolasCategoryId: kolasCategory.value.id,
          name: kolasCategory.value.sub_category,
          confidence: kolasCategory.confidence,
        } : null,
        manufacturer: manufacturer.value ? {
          id: manufacturer.value.id,
          name: manufacturer.value.name_en,
          nameKo: manufacturer.value.name_ko,
          confidence: manufacturer.confidence,
        } : null,
        model: model.value ? {
          id: model.value.id,
          modelName: model.value.model_name,
          measureRangeMax: model.value.measure_range_max,
          measureUnit: model.value.measure_unit,
          accuracyClass: model.value.accuracy_class,
          defaultCycleMonths: model.value.default_cycle_months,
          confidence: model.confidence,
        } : null,
        serial: {
          value: serial.value,
          confidence: serial.confidence,
        },
      },
      candidates: {
        manufacturers: manufacturer.candidates?.map(c => ({ id: c.id, name: c.name_en })) ?? [],
        models: model.candidates?.map(c => ({ id: c.id, modelName: c.model_name })) ?? [],
      },
      rawOcrText: visionResult.rawText,
      processingTimeMs: Date.now() - startTime,
    };
  }
}
```

---

## 6. 성적서 OCR

### 6.1 프롬프트

```typescript
const CERTIFICATE_OCR_PROMPT = `당신은 KOLAS 교정 성적서를 분석하는 전문가입니다.

다음 정보를 추출해주세요:

1. certificateNo: 성적서 번호
2. performedAt: 교정 실시일 (YYYY-MM-DD)
3. organizationName: 교정기관명
4. result: pass | conditional_pass | fail
5. asFoundData: 측정 데이터 배열
   각 항목: { point, expected, measured, error }
6. uncertainty: 측정 불확도 (예: "±0.5mg (k=2)")
7. nextCalibrationDate: 차기 교정일 (있으면)

응답은 JSON 형식만:
\`\`\`json
{
  "certificateNo": "KOLAS-2026-A-0123",
  "performedAt": "2026-05-10",
  "organizationName": "한국교정시험기관",
  "result": "pass",
  "asFoundData": [
    { "point": 0, "expected": 0, "measured": 0.0001, "error": 0.0001 }
  ],
  "uncertainty": "±0.5mg (k=2)",
  "nextCalibrationDate": "2027-05-10",
  "confidences": {
    "certificateNo": 0.95,
    "performedAt": 0.98,
    "organizationName": 0.92,
    "result": 0.95,
    "asFoundData": 0.85,
    "uncertainty": 0.70
  }
}
\`\`\``;
```

---

## 7. 비용 추정 (Phase 1)

### Claude API 비용
- **Input**: $15 / 1M tokens (Opus)
- **Output**: $75 / 1M tokens
- **Image**: 1장당 약 1,000~1,500 tokens (이미지 크기에 따라)

### 사용 시나리오별 비용
- 측정기 1대 등록 (사진 2장): 약 2,500 input + 200 output = $0.05
- 성적서 1건 OCR (사진 1장): 약 1,800 input + 300 output = $0.05

### Phase 1 예상
- 베타 100개사 × 평균 50대 등록 = 5,000건
- 5,000 × $0.05 = $250 (약 35만원, 6개월간)

### 비용 절감 전략
- 캐싱: 같은 사진 재처리 방지
- Haiku 우선: 신뢰도 낮을 때만 Opus
- 배치 처리: 일괄 등록 시 한 번에 묶기 (Phase 2)

---

## 8. Fallback 처리

### 8.1 인식 실패 케이스
```typescript
if (overall < 0.4) {
  return {
    confidence: overall,
    fallbackMode: 'manual_entry',
    suggestions: {
      message: '사진에서 정보를 충분히 읽을 수 없습니다. 직접 입력해주세요.',
      hints: extractHintsFromRawText(visionResult.rawText),
    },
    candidates: { /* 그래도 일부 후보 제공 */ },
  };
}
```

### 8.2 부분 인식 케이스
```typescript
// 제조사는 인식했지만 모델은 못 찾은 경우
if (manufacturer.value && !model.value) {
  return {
    confidence: 0.5,
    recognized: { manufacturer: ..., model: null },
    suggestions: {
      message: `${manufacturer.value.name_en}의 어떤 모델인가요?`,
      modelsByManufacturer: await this.getModelsByMfr(manufacturer.value.id),
    },
  };
}
```

---

## 9. 데이터 플라이휠

### 9.1 사용자 피드백 수집
사용자가 AI 추천을 수정할 때마다 로깅:

```typescript
async function logUserCorrection(args: {
  recognitionId: string;
  field: string;       // 'manufacturer' / 'model' / 'serial'
  aiSuggestion: any;
  userChoice: any;
}) {
  await aiCorrectionRepo.save({
    ...args,
    correctedAt: new Date(),
  });
}
```

### 9.2 주기적 모델 개선
- 매월 사용자 수정 데이터 분석
- Phase 3에서 자체 모델 학습 데이터로 활용

---

## 10. 테스트 전략

### 10.1 PoC 테스트 셋
영민님이 SIMS 고객사에서 사진 100장 수집:
- 저울 30장 (CAS, A&D 등 다양)
- 캘리퍼 20장 (Mitutoyo 위주)
- 멀티미터 20장 (Fluke)
- 온도계 15장
- 기타 15장

목표: **카테고리별 인식률 90% 이상**

### 10.2 자동 테스트
```typescript
describe('VisionService', () => {
  it('recognizes CAS CBX-220H from clear photo', async () => {
    const result = await service.recognizeInstrument(['test/cas-cbx220h.jpg']);
    expect(result.recognized.manufacturer.name).toBe('CAS');
    expect(result.recognized.model.modelName).toBe('CBX-220H');
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('returns fallback for blurry photo', async () => {
    const result = await service.recognizeInstrument(['test/blurry.jpg']);
    expect(result.confidence).toBeLessThan(0.4);
    expect(result.fallbackMode).toBe('manual_entry');
  });
});
```

---

## 다음 단계

→ `07_PROJECT_STRUCTURE.md`에서 위 코드들의 실제 폴더 위치 확인
