// This file has been replaced by src/lib/services/vacationOptimizer.ts
// The VacationOptimizer service now handles all bridge day calculations
// with more sophisticated algorithms for efficiency optimization.

export interface BridgeDay {
  date: Date;
  reason: string;
  savingDays: number;
}

/**
 * @deprecated Use VacationOptimizer service instead
 * This function is kept for backward compatibility but will be removed
 */
export function detectBridgeDays(year: number): BridgeDay[] {
  console.warn('detectBridgeDays is deprecated. Use VacationOptimizer service instead.');
  return [];
}
