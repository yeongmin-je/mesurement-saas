// Prompt for the Vision API to extract instrument identification fields.
// Schema must match VisionRecognitionResult (vision.service.ts).
export const INSTRUMENT_RECOGNITION_PROMPT = `당신은 산업용 측정기를 식별하는 전문가입니다.
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

읽기 어렵거나 정보가 없으면 value를 null, confidence를 0으로 표시하세요.

응답은 반드시 다음 JSON 형식만 출력하세요 (다른 설명은 일체 없음):
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
