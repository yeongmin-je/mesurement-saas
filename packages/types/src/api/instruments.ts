import type { CalibrationStatus, InstrumentStatus } from '../domain/instrument';

export interface ListInstrumentsQuery {
  q?: string;
  status?: InstrumentStatus;
  departmentId?: string;
  kolasCategoryId?: number;
  manufacturerId?: number;
  calibrationStatus?: CalibrationStatus;
  sort?: 'recent' | 'next_calibration' | 'name';
  page?: number;
  limit?: number;
}

export interface CreateInstrumentRequest {
  assetCode?: string;
  serialNumber?: string | null;
  kolasCategoryId?: number;
  manufacturerId?: number;
  modelId?: number;
  categoryText?: string;
  manufacturerText?: string;
  modelText?: string;
  measureRangeMin?: number;
  measureRangeMax?: number;
  measureUnit?: string;
  accuracyClass?: string;
  departmentId?: string;
  location?: string;
  custodianId?: string;
  acquiredAt?: string;
  acquiredCost?: number;
  cycleMonths?: number;
  photoIds?: string[];
  aiRecognition?: Record<string, unknown>;
  notes?: string;
}

export type UpdateInstrumentRequest = Partial<CreateInstrumentRequest>;
