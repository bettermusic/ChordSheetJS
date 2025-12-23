import { StatelessTimestampTracker, TimestampManager } from '../../src/playback';

describe('StatelessTimestampTracker', () => {
  describe('constructor', () => {
    it('sorts timestamps on initialization', () => {
      const tracker = new StatelessTimestampTracker([30, 10, 20]);
      expect(tracker.getAllTimestamps()).toEqual([10, 20, 30]);
    });

    it('handles empty timestamps', () => {
      const tracker = new StatelessTimestampTracker([]);
      expect(tracker.getAllTimestamps()).toEqual([]);
    });
  });

  describe('getActiveTimestamp', () => {
    const tracker = new StatelessTimestampTracker([10, 20, 30, 40]);

    it('returns null when time is before first timestamp', () => {
      expect(tracker.getActiveTimestamp(5)).toBeNull();
    });

    it('returns first timestamp when time matches exactly', () => {
      expect(tracker.getActiveTimestamp(10)).toBe(10);
    });

    it('returns active timestamp when time is between timestamps', () => {
      expect(tracker.getActiveTimestamp(15)).toBe(10);
      expect(tracker.getActiveTimestamp(25)).toBe(20);
      expect(tracker.getActiveTimestamp(35)).toBe(30);
    });

    it('returns last timestamp when time is after all timestamps', () => {
      expect(tracker.getActiveTimestamp(50)).toBe(40);
    });
  });

  describe('getActiveIndex', () => {
    const tracker = new StatelessTimestampTracker([10, 20, 30, 40]);

    it('returns -1 when time is before first timestamp', () => {
      expect(tracker.getActiveIndex(5)).toBe(-1);
    });

    it('returns correct index when time matches exactly', () => {
      expect(tracker.getActiveIndex(10)).toBe(0);
      expect(tracker.getActiveIndex(20)).toBe(1);
    });

    it('returns correct index when time is between timestamps', () => {
      expect(tracker.getActiveIndex(15)).toBe(0);
      expect(tracker.getActiveIndex(35)).toBe(2);
    });
  });

  describe('getNextTimestamp', () => {
    const tracker = new StatelessTimestampTracker([10, 20, 30, 40]);

    it('returns first timestamp when time is before all timestamps', () => {
      expect(tracker.getNextTimestamp(5)).toBeNull();
    });

    it('returns next timestamp when time is at a timestamp', () => {
      expect(tracker.getNextTimestamp(10)).toBe(20);
      expect(tracker.getNextTimestamp(20)).toBe(30);
    });

    it('returns next timestamp when time is between timestamps', () => {
      expect(tracker.getNextTimestamp(15)).toBe(20);
      expect(tracker.getNextTimestamp(25)).toBe(30);
    });

    it('returns null when at last timestamp', () => {
      expect(tracker.getNextTimestamp(40)).toBeNull();
      expect(tracker.getNextTimestamp(50)).toBeNull();
    });
  });

  describe('getPreviousTimestamp', () => {
    const tracker = new StatelessTimestampTracker([10, 20, 30, 40]);

    it('returns null when time is before first timestamp', () => {
      expect(tracker.getPreviousTimestamp(5)).toBeNull();
    });

    it('returns null when time is at first timestamp', () => {
      expect(tracker.getPreviousTimestamp(10)).toBeNull();
    });

    it('returns previous timestamp when time is at a timestamp', () => {
      expect(tracker.getPreviousTimestamp(20)).toBe(10);
      expect(tracker.getPreviousTimestamp(30)).toBe(20);
    });

    it('returns previous timestamp when time is between timestamps', () => {
      expect(tracker.getPreviousTimestamp(15)).toBe(10);
      expect(tracker.getPreviousTimestamp(35)).toBe(30);
    });
  });
});

describe('TimestampManager static methods', () => {
  describe('findActiveTimestamp', () => {
    const timestamps = [10, 20, 30, 40];

    it('returns null for empty timestamps', () => {
      expect(TimestampManager.findActiveTimestamp([], 25)).toBeNull();
    });

    it('returns null when time is before first timestamp', () => {
      expect(TimestampManager.findActiveTimestamp(timestamps, 5)).toBeNull();
    });

    it('returns correct active timestamp', () => {
      expect(TimestampManager.findActiveTimestamp(timestamps, 10)).toBe(10);
      expect(TimestampManager.findActiveTimestamp(timestamps, 15)).toBe(10);
      expect(TimestampManager.findActiveTimestamp(timestamps, 25)).toBe(20);
      expect(TimestampManager.findActiveTimestamp(timestamps, 50)).toBe(40);
    });
  });

  describe('findActiveIndex', () => {
    const timestamps = [10, 20, 30, 40];

    it('returns -1 for empty timestamps', () => {
      expect(TimestampManager.findActiveIndex([], 25)).toBe(-1);
    });

    it('returns -1 when time is before first timestamp', () => {
      expect(TimestampManager.findActiveIndex(timestamps, 5)).toBe(-1);
    });

    it('returns correct active index', () => {
      expect(TimestampManager.findActiveIndex(timestamps, 10)).toBe(0);
      expect(TimestampManager.findActiveIndex(timestamps, 15)).toBe(0);
      expect(TimestampManager.findActiveIndex(timestamps, 25)).toBe(1);
      expect(TimestampManager.findActiveIndex(timestamps, 50)).toBe(3);
    });
  });

  describe('fromTimestamps', () => {
    it('creates a StatelessTimestampTracker', () => {
      const tracker = TimestampManager.fromTimestamps([10, 20, 30]);
      expect(tracker).toBeInstanceOf(StatelessTimestampTracker);
      expect(tracker.getAllTimestamps()).toEqual([10, 20, 30]);
    });

    it('sorts timestamps', () => {
      const tracker = TimestampManager.fromTimestamps([30, 10, 20]);
      expect(tracker.getAllTimestamps()).toEqual([10, 20, 30]);
    });
  });
});
