import { describe, it, expect } from 'vitest';
import {
  formatProbability,
  countMeasuredTests,
  generateCSVTemplate,
} from '../utils/formatters';
import { PatientInput } from '../types';

describe('formatProbability', () => {
  it('formats extreme high values as > 99.9% and never 100%', () => {
    expect(formatProbability(1.0)).toBe('> 99.9%');
    expect(formatProbability(0.9999)).toBe('> 99.9%');
    expect(formatProbability(0.999)).toBe('> 99.9%');
    expect(formatProbability(1.0)).not.toContain('100%');
  });

  it('formats extreme low values as < 0.1% and never 0%', () => {
    expect(formatProbability(0.0)).toBe('< 0.1%');
    expect(formatProbability(0.00001)).toBe('< 0.1%');
    expect(formatProbability(3.5e-9)).toBe('< 0.1%');
    expect(formatProbability(0.0)).not.toBe('0%');
  });

  it('formats intermediate probabilities correctly with 1 decimal place', () => {
    expect(formatProbability(0.861)).toBe('86.1%');
    expect(formatProbability(0.50997)).toBe('51.0%');
    expect(formatProbability(0.052)).toBe('5.2%');
  });

  it('handles null, undefined, or NaN gracefully', () => {
    expect(formatProbability(null)).toBe('—');
    expect(formatProbability(undefined)).toBe('—');
    expect(formatProbability(NaN)).toBe('—');
  });
});

describe('countMeasuredTests', () => {
  it('returns 0 for empty patient', () => {
    expect(countMeasuredTests({})).toBe(0);
  });

  it('does not count Age and Gender (demographics do not count toward the 12 clinical tests)', () => {
    const patient: PatientInput = {
      Age: 45,
      Gender: 'Female',
    };
    expect(countMeasuredTests(patient)).toBe(0);
  });

  it('accurately counts measured labs and antibodies', () => {
    const patient: PatientInput = {
      Age: 58,
      Gender: 'Female',
      ESR: 12.0,
      CRP: 0.8,
      RF: 10.4,
      'Anti-CCP': 14.5,
      'HLA-B27': 'Positive',
      ANA: 'Positive',
      'Anti-Ro': 'Positive',
      'Anti-La': null,
      'Anti-dsDNA': null,
      'Anti-Sm': null,
      C3: 116.0,
      C4: 63.0,
    };
    // Measured: ESR, CRP, RF, Anti-CCP, C3, C4 (6 labs) + HLA-B27, ANA, Anti-Ro (3 antibodies) = 9 tests
    expect(countMeasuredTests(patient)).toBe(9);
  });

  it('ignores not tested, blank, null, or nan values', () => {
    const patient: PatientInput = {
      ESR: 25.0,
      CRP: '',
      RF: null,
      'HLA-B27': 'Not tested',
      ANA: 'Negative',
    };
    // Measured: ESR (1) + ANA (1) = 2
    expect(countMeasuredTests(patient)).toBe(2);
  });
});

describe('generateCSVTemplate', () => {
  it('includes all 14 required column headers', () => {
    const template = generateCSVTemplate();
    const [headerLine, ...dataLines] = template.trim().split('\n');
    const headers = headerLine.split(',').map((h) => h.trim());

    const expectedCols = [
      'Age',
      'Gender',
      'ESR',
      'CRP',
      'RF',
      'Anti-CCP',
      'HLA-B27',
      'ANA',
      'Anti-Ro',
      'Anti-La',
      'Anti-dsDNA',
      'Anti-Sm',
      'C3',
      'C4',
    ];

    expectedCols.forEach((col) => {
      expect(headers).toContain(col);
    });
    expect(headers.length).toBe(14);
    expect(dataLines.length).toBe(2);
  });
});
