import ChordProParser from '../../src/parser/chord_pro_parser';

describe('Timestamp parsing', () => {
  describe('line-level timestamps', () => {
    it('should parse a single timestamp before a line', () => {
      const chordSheet = `
{timestamp: 0:16}
[C]Amazing [G]grace`;

      const song = new ChordProParser().parse(chordSheet);
      // The timestamp applies to the next line with content
      const contentLine = song.lines.find((line) => line.items.length > 0);

      expect(contentLine).toBeDefined();
      expect(contentLine?.timestamps).toEqual([16]);
    });

    it('should parse {tm:} as shorthand for {timestamp:}', () => {
      const chordSheet = `
{tm: 0:16}
[C]Amazing [G]grace`;

      const song = new ChordProParser().parse(chordSheet);
      const contentLine = song.lines.find((line) => line.items.length > 0);

      expect(contentLine).toBeDefined();
      expect(contentLine?.timestamps).toEqual([16]);
    });

    it('should parse multiple timestamps (pipe-delimited)', () => {
      const chordSheet = `
{timestamp: 0:16|1:20}
{start_of_chorus}
[C]Amazing [G]grace
{end_of_chorus}`;

      const song = new ChordProParser().parse(chordSheet);
      const contentLine = song.lines.find((line) => line.items.length > 0);

      expect(contentLine).toBeDefined();
      expect(contentLine?.timestamps).toEqual([16, 80]);
    });

    it('should handle timestamps with sections', () => {
      const chordSheet = `
{timestamp: 0:00}
{start_of_verse}
[C]First line
{end_of_verse}

{timestamp: 0:16}
{start_of_chorus}
[G]Chorus line
{end_of_chorus}`;

      const song = new ChordProParser().parse(chordSheet);
      // Find lines with timestamps (not all content lines have timestamps)
      const timestampedLines = song.lines.filter((line) => (
        line.timestamps && line.timestamps.length > 0
      ));

      expect(timestampedLines.length).toBeGreaterThanOrEqual(2);
      expect(timestampedLines[0].timestamps).toEqual([0]);
      expect(timestampedLines[1].timestamps).toEqual([16]);
    });

    it('should parse various timestamp formats', () => {
      const chordSheet = `
{timestamp: 45}
Line one
{timestamp: 1:23}
Line two
{timestamp: 1:02:03}
Line three`;

      const song = new ChordProParser().parse(chordSheet);
      const contentLines = song.lines.filter((line) => line.items.length > 0);

      expect(contentLines.length).toBe(3);
      expect(contentLines[0].timestamps).toEqual([45]);
      expect(contentLines[1].timestamps).toEqual([83]);
      expect(contentLines[2].timestamps).toEqual([3723]);
    });

    it('should handle invalid timestamps gracefully', () => {
      const chordSheet = `
{timestamp: invalid}
[C]Line with bad timestamp`;

      const song = new ChordProParser().parse(chordSheet);
      const contentLine = song.lines.find((line) => line.items.length > 0);

      expect(contentLine?.timestamps).toEqual([]);
      expect(song.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('inline timestamps', () => {
    it('should parse inline timestamp mid-line', () => {
      const chordSheet = '[C]Amazing [G]grace, {timestamp: 0:02}how [C]sweet';

      const song = new ChordProParser().parse(chordSheet);
      const { items } = song.lines[0];

      // Find the ChordLyricsPair after the timestamp
      const timestampedItems = items.filter((item: any) => (
        item.timestamps && item.timestamps.length > 0
      ));

      expect(timestampedItems.length).toBeGreaterThan(0);
      expect((timestampedItems[0] as any).timestamps).toEqual([2]);
    });

    it('should parse inline {tm:} shorthand mid-line', () => {
      const chordSheet = '[C]Amazing [G]grace, {tm: 0:02}how [C]sweet';

      const song = new ChordProParser().parse(chordSheet);
      const { items } = song.lines[0];

      // Find the ChordLyricsPair after the timestamp
      const timestampedItems = items.filter((item: any) => (
        item.timestamps && item.timestamps.length > 0
      ));

      expect(timestampedItems.length).toBeGreaterThan(0);
      expect((timestampedItems[0] as any).timestamps).toEqual([2]);
    });

    it('should support pipe-delimited inline timestamps', () => {
      const chordSheet = '[C]Amazing [G]grace, {timestamp: 0:02|0:47}how [C]sweet';

      const song = new ChordProParser().parse(chordSheet);
      const { items } = song.lines[0];

      const timestampedItems = items.filter((item: any) => (
        item.timestamps && item.timestamps.length > 0
      ));

      expect(timestampedItems.length).toBeGreaterThan(0);
      expect((timestampedItems[0] as any).timestamps).toEqual([2, 47]);
    });

    it('should handle both line-level and inline timestamps', () => {
      const chordSheet = `
{timestamp: 0:00}
[C]Amazing [G]grace, {timestamp: 0:02}how [C]sweet the sound`;

      const song = new ChordProParser().parse(chordSheet);
      const contentLine = song.lines.find((line) => line.items.length > 0);

      expect(contentLine).toBeDefined();
      expect(contentLine?.timestamps).toEqual([0]);

      const timestampedItems = contentLine?.items.filter((item: any) => (
        item.timestamps && item.timestamps.length > 0
      ));

      expect(timestampedItems?.length).toBeGreaterThan(0);
    });
  });

  describe('timestamp tags should not appear in output', () => {
    it('should not include timestamp tags in the line items', () => {
      const chordSheet = `
{timestamp: 0:16}
[C]Amazing [G]grace`;

      const song = new ChordProParser().parse(chordSheet);
      const line = song.lines[0];

      // Check that no timestamp tags are in the items
      const hasTimestampTag = line.items.some(
        (item: any) => item.name === 'timestamp',
      );

      expect(hasTimestampTag).toBe(false);
    });
  });
});
