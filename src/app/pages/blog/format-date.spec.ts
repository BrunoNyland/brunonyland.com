import { formatMonthYear } from './format-date';

describe('formatMonthYear', () => {
  it('formats YYYY-MM and YYYY-MM-DD in Portuguese and English', () => {
    expect(formatMonthYear('2026-05', 'pt')).toBe('Mai 2026');
    expect(formatMonthYear('2026-05-15', 'en')).toBe('May 2026');
    expect(formatMonthYear('2026-02', 'pt')).toBe('Fev 2026');
    expect(formatMonthYear('2026-02', 'en')).toBe('Feb 2026');
  });

  it('returns the original string if it does not match YYYY-MM', () => {
    expect(formatMonthYear('invalid', 'pt')).toBe('invalid');
    expect(formatMonthYear('', 'en')).toBe('');
  });

  it('handles out-of-range month numbers gracefully', () => {
    expect(formatMonthYear('2026-13', 'pt')).toBe('2026');
  });
});
