import { ChordProParser, Song } from '../../src';
import Line from '../../src/chord_sheet/line';
import ChordLyricsPair from '../../src/chord_sheet/chord_lyrics_pair';

describe('Song.changeTempo', () => {
  describe('with direct Song construction', () => {
    it('scales line-level timestamps', () => {
      // Build song directly with timestamps
      const song = new Song();
      const line1 = new Line();
      line1.timestamps = [10, 70]; // Multiple timestamps for repeated section
      const pair1 = new ChordLyricsPair('C', 'Hello');
      line1.items.push(pair1);
      song.lines.push(line1);

      const line2 = new Line();
      line2.timestamps = [20];
      const pair2 = new ChordLyricsPair('G', 'World');
      line2.items.push(pair2);
      song.lines.push(line2);

      const adjustedSong = song.changeTempo(120, 60);

      // Going from 120 → 60 BPM: timestamps × 2
      expect(adjustedSong.lines[0].timestamps).toEqual([20, 140]);
      expect(adjustedSong.lines[1].timestamps).toEqual([40]);

      // Original should be unchanged
      expect(song.lines[0].timestamps).toEqual([10, 70]);
      expect(song.lines[1].timestamps).toEqual([20]);
    });

    it('scales inline timestamps on ChordLyricsPairs', () => {
      const song = new Song();
      const line = new Line();
      const pair1 = new ChordLyricsPair('C', 'Hello');
      pair1.timestamps = [10];
      const pair2 = new ChordLyricsPair('G', 'World');
      pair2.timestamps = [15];
      line.items.push(pair1, pair2);
      song.lines.push(line);

      const adjustedSong = song.changeTempo(120, 60);

      // Inline timestamps should be doubled
      expect((adjustedSong.lines[0].items[0] as ChordLyricsPair).timestamps).toEqual([20]);
      expect((adjustedSong.lines[0].items[1] as ChordLyricsPair).timestamps).toEqual([30]);
    });
  });

  describe('with ChordPro parsing', () => {
    it('scales timestamps when slowing down (120 BPM → 60 BPM)', () => {
      const chordSheet = `{timestamp: 0:10}
[C]Hello [G]World
{timestamp: 0:20}
[Am]Second [F]line`;

      const song = new ChordProParser().parse(chordSheet);
      const adjustedSong = song.changeTempo(120, 60);

      // Find lines with content (timestamps are attached to content lines)
      const linesWithContent = adjustedSong.lines.filter((l) => l.items.length > 0);

      // Going from 120 → 60 BPM means the song takes twice as long
      // So timestamps should be doubled
      expect(linesWithContent[0].timestamps).toEqual([20]); // 10 * 2 = 20
      expect(linesWithContent[1].timestamps).toEqual([40]); // 20 * 2 = 40
    });

    it('scales timestamps when speeding up (100 BPM → 200 BPM)', () => {
      const chordSheet = `{timestamp: 0:30}
[C]Verse line
{timestamp: 1:00}
[G]Another line`;

      const song = new ChordProParser().parse(chordSheet);
      const adjustedSong = song.changeTempo(100, 200);

      // Find lines with content
      const linesWithContent = adjustedSong.lines.filter((l) => l.items.length > 0);

      // Going from 100 → 200 BPM means the song takes half the time
      // So timestamps should be halved
      expect(linesWithContent[0].timestamps).toEqual([15]); // 30 * 0.5 = 15
      expect(linesWithContent[1].timestamps).toEqual([30]); // 60 * 0.5 = 30
    });

    it('scales inline timestamps on ChordLyricsPairs', () => {
      const chordSheet = `[C]Hello {timestamp: 0:10}[G]World`;

      const song = new ChordProParser().parse(chordSheet);
      const adjustedSong = song.changeTempo(120, 60);

      // Find items with timestamps
      const line = adjustedSong.lines[0];
      const pairs = line.items.filter((item: any) => item.timestamps?.length > 0);

      // Inline timestamps should be doubled
      expect((pairs[0] as any).timestamps).toEqual([20]); // 10 * 2 = 20
    });

    it('handles multiple timestamps for repeating sections', () => {
      const chordSheet = `{timestamp: 0:10|1:10}
[C]Chorus line`;

      const song = new ChordProParser().parse(chordSheet);
      const adjustedSong = song.changeTempo(120, 60);

      // Find line with content
      const lineWithContent = adjustedSong.lines.find((l) => l.items.length > 0);

      // Both timestamps should be doubled: [10*2, 70*2] = [20, 140]
      expect(lineWithContent?.timestamps).toEqual([20, 140]);
    });

    it('throws error for non-positive tempo values', () => {
      const song = new ChordProParser().parse('[C]Hello');

      expect(() => song.changeTempo(0, 100)).toThrow('Tempo values must be positive numbers');
      expect(() => song.changeTempo(100, 0)).toThrow('Tempo values must be positive numbers');
      expect(() => song.changeTempo(-100, 100)).toThrow('Tempo values must be positive numbers');
    });
  });

  describe('with ratio option', () => {
    it('scales timestamps by the given ratio', () => {
      const chordSheet = `{timestamp: 0:10}
[C]Hello
{timestamp: 0:20}
[G]World`;

      const song = new ChordProParser().parse(chordSheet);
      const adjustedSong = song.changeTempo({ ratio: 1.5 });

      const linesWithContent = adjustedSong.lines.filter((l) => l.items.length > 0);

      expect(linesWithContent[0].timestamps).toEqual([15]); // 10 * 1.5 = 15
      expect(linesWithContent[1].timestamps).toEqual([30]); // 20 * 1.5 = 30
    });

    it('throws error for non-positive ratio', () => {
      const song = new ChordProParser().parse('[C]Hello');

      expect(() => song.changeTempo({ ratio: 0 })).toThrow('Ratio must be a positive number');
      expect(() => song.changeTempo({ ratio: -1 })).toThrow('Ratio must be a positive number');
    });
  });

  describe('preserves original song', () => {
    it('does not mutate the original song', () => {
      const chordSheet = `{timestamp: 0:10}
[C]Hello`;

      const song = new ChordProParser().parse(chordSheet);
      const lineWithContent = song.lines.find((l) => l.items.length > 0);
      const originalTimestamp = lineWithContent?.timestamps[0];

      song.changeTempo(120, 60);

      // Original should be unchanged
      expect(lineWithContent?.timestamps[0]).toEqual(originalTimestamp);
    });
  });

  describe('edge cases', () => {
    it('handles song with no timestamps', () => {
      const song = new ChordProParser().parse('[C]Hello [G]World');
      const adjustedSong = song.changeTempo(120, 60);

      // Should not throw, just return a clone
      expect(adjustedSong).not.toBe(song);
    });

    it('handles same tempo (no change)', () => {
      const chordSheet = `{timestamp: 0:10}
[C]Hello`;

      const song = new ChordProParser().parse(chordSheet);
      const adjustedSong = song.changeTempo(120, 120);

      const lineWithContent = adjustedSong.lines.find((l) => l.items.length > 0);

      // Timestamps should be unchanged (ratio = 1)
      expect(lineWithContent?.timestamps).toEqual([10]);
    });
  });
});

