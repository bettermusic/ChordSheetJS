import ChordProParser from '../../src/parser/chord_pro_parser';

describe('{tm:} shorthand for {timestamp:}', () => {
  it('should parse {tm:} as line-level timestamp', () => {
    const chordSheet = `
{tm: 0:16}
[C]Test line`;

    const song = new ChordProParser().parse(chordSheet);
    
    // Find the line with content
    const linesWithContent = song.lines.filter((line) => line.items.length > 0);
    expect(linesWithContent.length).toBeGreaterThan(0);
    
    const firstContentLine = linesWithContent[0];
    expect(firstContentLine.timestamps).toBeDefined();
    expect(firstContentLine.timestamps.length).toBe(1);
    expect(firstContentLine.timestamps[0]).toBe(16);
  });

  it('should parse {tm:} with pipe-delimited values', () => {
    const chordSheet = `
{tm: 0:16|1:20}
[C]Test line`;

    const song = new ChordProParser().parse(chordSheet);
    
    const linesWithContent = song.lines.filter((line) => line.items.length > 0);
    const firstContentLine = linesWithContent[0];
    
    expect(firstContentLine.timestamps).toBeDefined();
    expect(firstContentLine.timestamps).toEqual([16, 80]);
  });

  it('should work identically to {timestamp:}', () => {
    const chordSheetWithTimestamp = `
{timestamp: 0:16}
[C]Test line`;

    const chordSheetWithTm = `
{tm: 0:16}
[C]Test line`;

    const song1 = new ChordProParser().parse(chordSheetWithTimestamp);
    const song2 = new ChordProParser().parse(chordSheetWithTm);
    
    const line1 = song1.lines.filter((l) => l.items.length > 0)[0];
    const line2 = song2.lines.filter((l) => l.items.length > 0)[0];
    
    expect(line1.timestamps).toEqual(line2.timestamps);
  });
});

