import { PatientInput } from '../types';

export const CLINICAL_TESTS = [
  'ESR',
  'CRP',
  'RF',
  'Anti-CCP',
  'C3',
  'C4',
  'HLA-B27',
  'ANA',
  'Anti-Ro',
  'Anti-La',
  'Anti-dsDNA',
  'Anti-Sm',
] as const;

/**
 * Format probabilities according to clinical honesty guidelines:
 * Extreme values are capped at '> 99.9%' or '< 0.1%'.
 * Never shows '100%' or '0%'.
 */
export function formatProbability(p: number | null | undefined): string {
  if (p === null || p === undefined || isNaN(p)) {
    return '—';
  }
  if (p >= 0.999) {
    return '> 99.9%';
  }
  if (p <= 0.001) {
    return '< 0.1%';
  }
  return `${(p * 100).toFixed(1)}%`;
}

/**
 * Count measured clinical tests out of the 12 relevant lab and antibody markers.
 * Age and sex are recorded demographics and do not count toward the 12 tests.
 */
export function countMeasuredTests(patient: PatientInput): number {
  let count = 0;
  for (const testKey of CLINICAL_TESTS) {
    const val = patient[testKey as keyof PatientInput];
    if (val !== undefined && val !== null && val !== '') {
      const strVal = String(val).trim().toLowerCase();
      if (strVal !== 'not tested' && strVal !== 'not done' && strVal !== 'null' && strVal !== 'nan') {
        count++;
      }
    }
  }
  return count;
}

/**
 * Generate a standard CSV template containing all 14 columns and 2 example rows.
 */
export function generateCSVTemplate(): string {
  return `Age,Gender,ESR,CRP,RF,Anti-CCP,HLA-B27,ANA,Anti-Ro,Anti-La,Anti-dsDNA,Anti-Sm,C3,C4
58,Female,12.0,0.8,10.4,14.5,Positive,Positive,Positive,,,,116.0,63.0
29,Male,28.0,21.8,32.5,18.2,Positive,Negative,Negative,Positive,Negative,Negative,137.0,51.0
`;
}
