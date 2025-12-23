import { ChordProFormatter, ChordProParser } from '../../src';
import { chordLyricsPair, createSongFromAst } from '../util/utilities';
import { chordProSheetSolfege, chordProSheetSymbol } from '../fixtures/chord_pro_sheet';
import { exampleSongSolfege, exampleSongSymbol } from '../fixtures/song';

describe('ChordProFormatter', () => {
  it('formats a symbol song to a chord pro sheet correctly', () => {
    expect(new ChordProFormatter().format(exampleSongSymbol)).toEqual(chordProSheetSymbol);
  });

  it('formats a solfege song to a chord pro sheet correctly', () => {
    expect(new ChordProFormatter().format(exampleSongSolfege)).toEqual(chordProSheetSolfege);
  });

  it('allows enabling chord normalization', () => {
    const formatter = new ChordProFormatter({ normalizeChords: true });

    const song = createSongFromAst([
      [chordLyricsPair('Dsus4', 'Let it be')],
    ]);

    expect(formatter.format(song)).toEqual('[Dsus]Let it be');
  });

  it('allows disabling chord normalization', () => {
    const formatter = new ChordProFormatter({ normalizeChords: false });

    const song = createSongFromAst([
      [chordLyricsPair('Dsus4', 'Let it be')],
    ]);

    expect(formatter.format(song)).toEqual('[Dsus4]Let it be');
  });

  describe('timestamp formatting', () => {
    it('preserves line-level timestamps when formatting back to ChordPro', () => {
      const input = `{timestamp: 0:16}
[C]Amazing [G]grace`;

      const parser = new ChordProParser();
      const song = parser.parse(input);
      const formatter = new ChordProFormatter();
      const output = formatter.format(song);

      // Default precision is 2 (centiseconds)
      expect(output).toContain('{timestamp: 0:16.00}');
      expect(output).toContain('[C]Amazing [G]grace');
    });

    it('preserves pipe-delimited timestamps', () => {
      const input = `{timestamp: 0:16|1:20}
[C]Chorus`;

      const parser = new ChordProParser();
      const song = parser.parse(input);
      const formatter = new ChordProFormatter();
      const output = formatter.format(song);

      expect(output).toContain('{timestamp: 0:16.00|1:20.00}');
      expect(output).toContain('[C]Chorus');
    });

    it('preserves inline timestamps', () => {
      const input = '[C]Start, {timestamp: 0:05}then this';

      const parser = new ChordProParser();
      const song = parser.parse(input);
      const formatter = new ChordProFormatter();
      const output = formatter.format(song);

      expect(output).toContain('{timestamp: 0:05.00}');
      expect(output).toContain('[C]Start');
    });

    it('preserves both line-level and inline timestamps', () => {
      const input = `{timestamp: 0:00}
[C]Start, {timestamp: 0:10}middle, [G]end`;

      const parser = new ChordProParser();
      const song = parser.parse(input);
      const formatter = new ChordProFormatter();
      const output = formatter.format(song);

      expect(output).toContain('{timestamp: 0:00.00}');
      expect(output).toContain('{timestamp: 0:10.00}');
    });

    it('formats timestamps with configurable precision', () => {
      const input = '{timestamp: 1:23}\n[C]Line';

      const parser = new ChordProParser();
      const song = parser.parse(input);

      // Default precision (2 - centiseconds)
      const formatterDefault = new ChordProFormatter();
      expect(formatterDefault.format(song)).toContain('{timestamp: 1:23.00}');

      // Whole seconds (precision 0)
      const formatterWhole = new ChordProFormatter({ timestampPrecision: 0 });
      expect(formatterWhole.format(song)).toContain('{timestamp: 1:23}');

      // Milliseconds (precision 3)
      const formatterMs = new ChordProFormatter({ timestampPrecision: 3 });
      expect(formatterMs.format(song)).toContain('{timestamp: 1:23.000}');
    });
  });
});
