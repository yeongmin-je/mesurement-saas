export interface Suggestion<T> {
  value: T;
  confidence: number;
  alternatives: Array<{ value: T; confidence: number }>;
}

export interface RecognizeInstrumentResponse {
  recognitionId: string;
  confidence: number;
  suggestions: {
    category: Suggestion<{ id: number; name: string }> | null;
    manufacturer: Suggestion<{ id: number; name: string }> | null;
    model: Suggestion<{ id: number; name: string }> | null;
    serialNumber: Suggestion<string> | null;
    measureRange: Suggestion<{ min: number; max: number; unit: string }> | null;
    accuracyClass: Suggestion<string> | null;
  };
  uploadedPhotos: Array<{ photoId: string; s3Key: string; previewUrl: string }>;
  rawText: string;
}

export interface RecognitionFeedback {
  recognitionId: string;
  corrections: Record<string, { predicted: unknown; actual: unknown }>;
}
