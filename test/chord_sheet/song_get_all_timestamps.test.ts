import Song from '../../src/chord_sheet/song';
import Line from '../../src/chord_sheet/line';

describe('Song', () => {
  describe('getAllTimestamps', () => {
    it('returns empty array when song has no timestamps', () => {
      const song = new Song();
      const line1 = new Line();
      const line2 = new Line();
      song.lines = [line1, line2];

      expect(song.getAllTimestamps()).toEqual([]);
    });

    it('returns timestamps from a single line', () => {
      const song = new Song();
      const line = new Line();
      line.timestamps = [16.5, 20.3];
      song.lines = [line];

      expect(song.getAllTimestamps()).toEqual([16.5, 20.3]);
    });

    it('returns unique timestamps from multiple lines', () => {
      const song = new Song();
      const line1 = new Line();
      line1.timestamps = [10, 20];
      const line2 = new Line();
      line2.timestamps = [30, 40];
      const line3 = new Line();
      line3.timestamps = [50];
      song.lines = [line1, line2, line3];

      expect(song.getAllTimestamps()).toEqual([10, 20, 30, 40, 50]);
    });

    it('removes duplicate timestamps', () => {
      const song = new Song();
      const line1 = new Line();
      line1.timestamps = [10, 20];
      const line2 = new Line();
      line2.timestamps = [20, 30];
      const line3 = new Line();
      line3.timestamps = [30, 40];
      song.lines = [line1, line2, line3];

      expect(song.getAllTimestamps()).toEqual([10, 20, 30, 40]);
    });

    it('sorts timestamps in ascending order', () => {
      const song = new Song();
      const line1 = new Line();
      line1.timestamps = [40, 30];
      const line2 = new Line();
      line2.timestamps = [20, 10];
      song.lines = [line1, line2];

      expect(song.getAllTimestamps()).toEqual([10, 20, 30, 40]);
    });

    it('handles lines with empty timestamp arrays', () => {
      const song = new Song();
      const line1 = new Line();
      line1.timestamps = [10];
      const line2 = new Line();
      line2.timestamps = [];
      const line3 = new Line();
      line3.timestamps = [20];
      song.lines = [line1, line2, line3];

      expect(song.getAllTimestamps()).toEqual([10, 20]);
    });

    it('handles fractional timestamps', () => {
      const song = new Song();
      const line1 = new Line();
      line1.timestamps = [16.5, 18.75];
      const line2 = new Line();
      line2.timestamps = [20.125, 22.0];
      song.lines = [line1, line2];

      expect(song.getAllTimestamps()).toEqual([16.5, 18.75, 20.125, 22.0]);
    });
  });
});

