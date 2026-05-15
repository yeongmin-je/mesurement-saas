// Prompt for extracting structured data from a KOLAS calibration certificate.
// Output schema must match CertificateOcrResult (certificate.service.ts).
export const CERTIFICATE_OCR_PROMPT = `당신은 KOLAS 교정 성적서를 분석하는 전문가입니다.

다음 정보를 추출해주세요:

1. certificateNo: 성적서 번호
2. performedAt: 교정 실시일 (YYYY-MM-DD)
3. organizationName: 교정기관명
4. result: pass | conditional | fail
5. asFoundData: 측정 데이터 배열 (교정 전)
   각 항목: { point, expected, measured, error }
6. asLeftData: 측정 데이터 배열 (교정 후, 있으면)
7. uncertainty: 측정 불확도 (예: "±0.5mg (k=2)")
8. nextCalibrationDate: 차기 교정일 (YYYY-MM-DD, 있으면)

읽기 어려운 필드는 value를 null, confidence를 0으로 표시하세요.

응답은 반드시 다음 JSON 형식만 출력하세요 (다른 설명 일체 없음):
\`\`\`json
{
  "certificateNo": "KOLAS-2026-A-0123",
  "performedAt": "2026-05-10",
  "organizationName": "한국교정시험기관",
  "result": "pass",
  "asFoundData": [
    { "point": 0, "expected": 0, "measured": 0.0001, "error": 0.0001 }
  ],
  "asLeftData": null,
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
