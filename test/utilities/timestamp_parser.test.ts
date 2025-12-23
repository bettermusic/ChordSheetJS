import { formatTimestamp, parseTimestamp, parseTimestamps } from '../../src/utilities/timestamp_parser';

describe('timestamp_parser', () => {
  describe('parseTimestamp', () => {
    it('should parse seconds-only format', () => {
      expect(parseTimestamp('45')).toBe(45);
      expect(parseTimestamp('23.5')).toBe(23.5);
      expect(parseTimestamp('0')).toBe(0);
    });

    it('should parse MM:SS format', () => {
      expect(parseTimestamp('1:23')).toBe(83);
      expect(parseTimestamp('0:30')).toBe(30);
      expect(parseTimestamp('12:45')).toBe(765);
    });

    it('should parse MM:SS.mmm format with milliseconds', () => {
      expect(parseTimestamp('0:23.500')).toBe(23.5);
      expect(parseTimestamp('1:30.250')).toBe(90.25);
    });

    it('should parse HH:MM:SS format', () => {
      expect(parseTimestamp('1:02:03')).toBe(3723);
      expect(parseTimestamp('0:05:30')).toBe(330);
      expect(parseTimestamp('2:00:00')).toBe(7200);
    });

    it('should handle invalid input', () => {
      expect(parseTimestamp('')).toBe(null);
      expect(parseTimestamp('invalid')).toBe(null);
      expect(parseTimestamp('1:2:3:4')).toBe(null);
      expect(parseTimestamp('-1:30')).toBe(null);
    });

    it('should trim whitespace', () => {
      expect(parseTimestamp('  1:23  ')).toBe(83);
      expect(parseTimestamp(' 45 ')).toBe(45);
    });
  });

  describe('parseTimestamps', () => {
    it('should parse single timestamp', () => {
      expect(parseTimestamps('0:16')).toEqual([16]);
    });

    it('should parse pipe-delimited timestamps', () => {
      expect(parseTimestamps('0:16|1:20')).toEqual([16, 80]);
      expect(parseTimestamps('0:16|1:20|2:45')).toEqual([16, 80, 165]);
    });

    it('should handle whitespace around pipes', () => {
      expect(parseTimestamps('0:16 | 1:20 | 2:45')).toEqual([16, 80, 165]);
    });

    it('should filter out invalid timestamps', () => {
      expect(parseTimestamps('0:16|invalid|1:20')).toEqual([16, 80]);
    });

    it('should handle empty or invalid input', () => {
      expect(parseTimestamps('')).toEqual([]);
      expect(parseTimestamps('invalid|bad')).toEqual([]);
    });
  });

  describe('formatTimestamp', () => {
    describe('with default precision (0 - whole seconds)', () => {
      it('should format seconds to MM:SS', () => {
        expect(formatTimestamp(23)).toBe('0:23');
        expect(formatTimestamp(83)).toBe('1:23');
        expect(formatTimestamp(765)).toBe('12:45');
      });

      it('should format to HH:MM:SS when over an hour', () => {
        expect(formatTimestamp(3723)).toBe('1:02:03');
        expect(formatTimestamp(7200)).toBe('2:00:00');
      });

      it('should handle decimal seconds (floors them)', () => {
        expect(formatTimestamp(23.5)).toBe('0:23');
        expect(formatTimestamp(90.9)).toBe('1:30');
      });

      it('should handle zero and negative values', () => {
        expect(formatTimestamp(0)).toBe('0:00');
        expect(formatTimestamp(-5)).toBe('0:00');
      });

      it('should handle invalid values', () => {
        expect(formatTimestamp(NaN)).toBe('0:00');
        expect(formatTimestamp(Infinity)).toBe('0:00');
      });
    });

    describe('with precision 1 (tenths)', () => {
      it('should format with one decimal place', () => {
        expect(formatTimestamp(23.5, 1)).toBe('0:23.5');
        expect(formatTimestamp(83.123, 1)).toBe('1:23.1');
        expect(formatTimestamp(90, 1)).toBe('1:30.0');
      });

      it('should handle zero with precision', () => {
        expect(formatTimestamp(0, 1)).toBe('0:00.0');
      });

      it('should handle invalid values with precision', () => {
        expect(formatTimestamp(NaN, 1)).toBe('0:00.0');
        expect(formatTimestamp(-5, 1)).toBe('0:00.0');
      });
    });

    describe('with precision 2 (centiseconds)', () => {
      it('should format with two decimal places', () => {
        expect(formatTimestamp(23.5, 2)).toBe('0:23.50');
        expect(formatTimestamp(83.123, 2)).toBe('1:23.12');
        expect(formatTimestamp(90.75, 2)).toBe('1:30.75');
      });

      it('should handle hours with precision', () => {
        expect(formatTimestamp(3723.45, 2)).toBe('1:02:03.45');
      });
    });

    describe('with precision 3 (milliseconds)', () => {
      it('should format with three decimal places', () => {
        expect(formatTimestamp(23.5, 3)).toBe('0:23.500');
        expect(formatTimestamp(83.123, 3)).toBe('1:23.123');
        expect(formatTimestamp(90.1234, 3)).toBe('1:30.123');
      });

      it('should handle tempo-adjusted timestamps accurately', () => {
        // Simulating tempo change: 10 seconds at 120 BPM → 100 BPM
        // 10 * (120/100) = 12 seconds exactly
        const adjusted = 10 * (120 / 100);
        expect(formatTimestamp(adjusted, 3)).toBe('0:12.000');

        // More complex: 10.5 seconds at 120 BPM → 100 BPM
        // 10.5 * 1.2 = 12.6 seconds
        const adjusted2 = 10.5 * (120 / 100);
        expect(formatTimestamp(adjusted2, 3)).toBe('0:12.600');
      });
    });
  });
});
