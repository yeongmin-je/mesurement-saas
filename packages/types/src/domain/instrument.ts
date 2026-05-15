export type InstrumentStatus =
  | 'active'
  | 'calibrating'
  | 'repairing'
  | 'suspended'
  | 'discarded';

export type CalibrationStatus = 'normal' | 'imminent' | 'overdue';

export interface MeasureRange {
  min: number | null;
  max: number | null;
  unit: string | null;
}

export interface InstrumentSummary {
  id: string;
  assetCode: string;
  serialNumber: string | null;
  model: { id: number; name: string; manufacturer: string } | null;
  category: string | null;
  department: string | null;
  status: InstrumentStatus;
  nextCalibrationAt: string | null;
  calibrationStatus: CalibrationStatus;
  primaryPhotoUrl: string | null;
}

export interface InstrumentDetail {
  id: string;
  tenantId: string;
  assetCode: string;
  serialNumber: string | null;
  category: { id: number; name: string } | null;
  manufacturer: { id: number; name: string } | null;
  model: { id: number; name: string } | null;
  measureRange: MeasureRange;
  accuracyClass: string | null;
  department: { id: string; name: string } | null;
  location: string | null;
  custodian: { id: string; name: string } | null;
  status: InstrumentStatus;
  acquiredAt: string | null;
  acquiredCost: number | null;
  cycleMonths: number;
  cycleAdjusted: boolean;
  cycleAdjustedReason: string | null;
  lastCalibrationAt: string | null;
  nextCalibrationAt: string | null;
  daysUntilCalibration: number | null;
  calibrationStatus: CalibrationStatus;
  photos: InstrumentPhoto[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InstrumentPhoto {
  id: string;
  url: string;
  isPrimary: boolean;
  isNameplate: boolean;
  uploadedAt: string;
}
