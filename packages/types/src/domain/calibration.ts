export type CalibrationResult = 'pass' | 'conditional' | 'fail';

export interface CalibrationPoint {
  point: number;
  measured: number;
  reference: number;
  error: number;
}

export interface Calibration {
  id: string;
  instrumentId: string;
  performedAt: string;
  calibrationOrgId: string | null;
  calibrationOrgText: string | null;
  performedByName: string | null;
  asFoundData: CalibrationPoint[] | null;
  asLeftData: CalibrationPoint[] | null;
  uncertainty: number | null;
  result: CalibrationResult | null;
  certificateNo: string | null;
  certificateUrl: string | null;
  cost: number | null;
  notes: string | null;
  createdAt: string;
}
