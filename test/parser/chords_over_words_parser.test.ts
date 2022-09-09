import {
  ChordsOverWordsParser,
} from '../../src';

import '../matchers';

describe('ChordsOverWordsParser', () => {
  it('parses chords over words correctly', () => {
    const chordOverWords = `
title: Let it be
key: C
---
Chorus 1:
       Am         C/G        F          C
Let it be, let it be, let it be, let it be
C                G              F  C/E Dm C
Whisper words of wisdom, let it be
`.substring(1);

    const parser = new ChordsOverWordsParser();
    const song = parser.parse(chordOverWords);
    const { lines } = song;

    expect(lines.length).toEqual(5);

    expect(lines[0].items.length).toEqual(1);
    expect(lines[0].items[0]).toBeTag('title', 'Let it be');

    expect(lines[1].items.length).toEqual(1);
    expect(lines[1].items[0]).toBeTag('key', 'C');

    expect(lines[2].items.length).toEqual(1);
    expect(lines[2].items[0]).toBeTag('comment', 'Chorus 1:');

    const line3Pairs = lines[3].items;
    expect(line3Pairs[0]).toBeChordLyricsPair('', 'Let it ');
    expect(line3Pairs[1]).toBeChordLyricsPair('Am', 'be, ');
    expect(line3Pairs[2]).toBeChordLyricsPair('', 'let it ');
    expect(line3Pairs[3]).toBeChordLyricsPair('C/G', 'be, ');
    expect(line3Pairs[4]).toBeChordLyricsPair('', 'let it ');
    expect(line3Pairs[5]).toBeChordLyricsPair('F', 'be, ');
    expect(line3Pairs[6]).toBeChordLyricsPair('', 'let it ');
    expect(line3Pairs[7]).toBeChordLyricsPair('C', 'be');

    const lines4Pairs = lines[4].items;
    expect(lines4Pairs[0]).toBeChordLyricsPair('C', 'Whisper ');
    expect(lines4Pairs[1]).toBeChordLyricsPair('', 'words of ');
    expect(lines4Pairs[2]).toBeChordLyricsPair('F', 'wis');
    expect(lines4Pairs[3]).toBeChordLyricsPair('G', 'dom, ');
    expect(lines4Pairs[4]).toBeChordLyricsPair('', 'let it ');
    expect(lines4Pairs[5]).toBeChordLyricsPair('F', 'be ');
    expect(lines4Pairs[6]).toBeChordLyricsPair('C/E', ' ');
    expect(lines4Pairs[7]).toBeChordLyricsPair('Dm', ' ');
    expect(lines4Pairs[8]).toBeChordLyricsPair('C', '');
  });

  it('allows for frontmatter seperator to be optional', () => {
    const chordOverWords = `
title: Let it be
key: C

Chorus 1:
       Am         C/G        F          C
Let it be, let it be, let it be, let it be
C                G              F  C/E Dm C
Whisper words of wisdom, let it be
`.substring(1);

    const parser = new ChordsOverWordsParser();
    const song = parser.parse(chordOverWords);
    const { lines } = song;

    expect(lines.length).toEqual(5);

    expect(lines[0].items.length).toEqual(1);
    expect(lines[0].items[0]).toBeTag('title', 'Let it be');

    expect(lines[1].items.length).toEqual(1);
    expect(lines[1].items[0]).toBeTag('key', 'C');

    expect(lines[2].items.length).toEqual(1);
    expect(lines[2].items[0]).toBeTag('comment', 'Chorus 1:');

    // this test almost works, it just doesn't maintain the space after the metadata
    expect(lines[3].items.length).toEqual(0);

    const line4Pairs = lines[4].items;
    expect(line4Pairs[0]).toBeChordLyricsPair('', 'Let it ');
    expect(line4Pairs[1]).toBeChordLyricsPair('Am', 'be, ');
    expect(line4Pairs[2]).toBeChordLyricsPair('', 'let it ');
    expect(line4Pairs[3]).toBeChordLyricsPair('C/G', 'be, ');
    expect(line4Pairs[4]).toBeChordLyricsPair('', 'let it ');
    expect(line4Pairs[5]).toBeChordLyricsPair('F', 'be, ');
    expect(line4Pairs[6]).toBeChordLyricsPair('', 'let it ');
    expect(line4Pairs[7]).toBeChordLyricsPair('C', 'be');

    const lines5Pairs = lines[5].items;
    expect(lines5Pairs[0]).toBeChordLyricsPair('C', 'Whisper ');
    expect(lines5Pairs[1]).toBeChordLyricsPair('', 'words of ');
    expect(lines5Pairs[2]).toBeChordLyricsPair('F', 'wis');
    expect(lines5Pairs[3]).toBeChordLyricsPair('G', 'dom, ');
    expect(lines5Pairs[4]).toBeChordLyricsPair('', 'let it ');
    expect(lines5Pairs[5]).toBeChordLyricsPair('F', 'be ');
    expect(lines5Pairs[6]).toBeChordLyricsPair('C/E', ' ');
    expect(lines5Pairs[7]).toBeChordLyricsPair('Dm', ' ');
    expect(lines5Pairs[8]).toBeChordLyricsPair('C', '');
  });

  it('parses simple chords over words with only 1 metadata', () => {
    const chordOverWords = `
title: Let it be
Chorus 1:
       Am
Let it be
`.substring(1);
    const parser = new ChordsOverWordsParser();
    const song = parser.parse(chordOverWords);
    const { lines } = song;

    expect(lines[0].items.length).toEqual(1);
    expect(lines[0].items[0]).toBeTag('title', 'Let it be');

    expect(lines[1].items.length).toEqual(1);
    expect(lines[1].items[0]).toBeTag('comment', 'Chorus 1:');

    const line1Pairs = lines[2].items;
    expect(line1Pairs[0]).toBeChordLyricsPair('', 'Let it ');
    expect(line1Pairs[1]).toBeChordLyricsPair('Am', 'be');
  });

  it('correctly differentiates between lyric only lines and comments', () => {
    const chordOverWords = `
Chorus 1:
       Am
Let it be
Whisper words of wisdom, let it be

Verse
When I find myself in times of trouble
Mother Mary comes to me
`.substring(1);

    const parser = new ChordsOverWordsParser();
    const song = parser.parse(chordOverWords);
    const { lines } = song;

    expect(lines[0].items.length).toEqual(1);
    expect(lines[0].items[0]).toBeTag('comment', 'Chorus 1:');

    const line1Pairs = lines[1].items;
    expect(line1Pairs[0]).toBeChordLyricsPair('', 'Let it ');
    expect(line1Pairs[1]).toBeChordLyricsPair('Am', 'be');
    expect(line1Pairs[2]).toBeChordLyricsPair('', 'Whisper words of wisdom, let it be');

    expect(lines[2].items.length).toEqual(0);

    expect(lines[3].items.length).toEqual(1);
    expect(lines[3].items[0]).toBeTag('comment', 'Verse');

    const lines4Pairs = lines[4].items;
    expect(lines4Pairs[0]).toBeChordLyricsPair('', 'When I find myself in times of trouble');
    expect(lines4Pairs[1]).toBeChordLyricsPair('', 'Mother Mary comes to me');
  });

  it('parses comment without a ":"', () => {
    const chordOverWords = `
title: Let it be
Chorus 1
       Am
Let it be
`.substring(1);
    const parser = new ChordsOverWordsParser();
    const song = parser.parse(chordOverWords);
    const { lines } = song;

    expect(lines[0].items.length).toEqual(1);
    expect(lines[0].items[0]).toBeTag('title', 'Let it be');

    expect(lines[1].items.length).toEqual(1);
    expect(lines[1].items[0]).toBeTag('comment', 'Chorus 1');

    const line1Pairs = lines[2].items;
    expect(line1Pairs[0]).toBeChordLyricsPair('', 'Let it ');
    expect(line1Pairs[1]).toBeChordLyricsPair('Am', 'be');
  });

  it('parses simple chords over words with no metadata', () => {
    const chordOverWords = `
Chorus 1:
       Am
Let it be
`.substring(1);
    const parser = new ChordsOverWordsParser();
    const song = parser.parse(chordOverWords);
    const { lines } = song;

    expect(lines[0].items.length).toEqual(1);
    expect(lines[0].items[0]).toBeTag('comment', 'Chorus 1:');

    const line1Pairs = lines[1].items;
    expect(line1Pairs[0]).toBeChordLyricsPair('', 'Let it ');
    expect(line1Pairs[1]).toBeChordLyricsPair('Am', 'be');
  });

  it('supports transpose & new_key directive', () => {
    const chordOverWords = `
title: Let it be
key: C
Chorus 1:
       Am
Let it be
nk: G
       Em
Let it be
`.substring(1);
    const parser = new ChordsOverWordsParser();
    const song = parser.parse(chordOverWords);
    const { lines } = song;

    expect(lines[0].items.length).toEqual(1);
    expect(lines[0].items[0]).toBeTag('title', 'Let it be');

    expect(lines[1].items.length).toEqual(1);
    expect(lines[1].items[0]).toBeTag('key', 'C');

    expect(lines[2].items.length).toEqual(1);
    expect(lines[2].items[0]).toBeTag('comment', 'Chorus 1:');

    const line3Pairs = lines[3].items;
    expect(line3Pairs[0]).toBeChordLyricsPair('', 'Let it ');
    expect(line3Pairs[1]).toBeChordLyricsPair('Am', 'be');

    expect(lines[4].items.length).toEqual(1);
    expect(lines[4].items[0]).toBeTag('new_key', 'G');

    const line5Pairs = lines[5].items;
    expect(line5Pairs[0]).toBeChordLyricsPair('', 'Let it ');
    expect(line5Pairs[1]).toBeChordLyricsPair('Em', 'be');
  });

  it('supports traditional metadata with brackets', () => {
    const chordOverWords = `
{title: Let it be}
{key: C}
Chorus 1:
       Am
Let it be
{nk: G}
       Em
Let it be
`.substring(1);
    const parser = new ChordsOverWordsParser();
    const song = parser.parse(chordOverWords);
    const { lines } = song;

    expect(lines[0].items.length).toEqual(1);
    expect(lines[0].items[0]).toBeTag('title', 'Let it be');

    expect(lines[1].items.length).toEqual(1);
    expect(lines[1].items[0]).toBeTag('comment', 'Chorus 1:');

    const line1Pairs = lines[2].items;
    expect(line1Pairs[0]).toBeChordLyricsPair('', 'Let it ');
    expect(line1Pairs[1]).toBeChordLyricsPair('Am', 'be');
  });

  it('new line is not required at the end', () => {
    const chordOverWords = `
title: Let it be
Chorus 1:
       Am
Let it be`.substring(1);
    const parser = new ChordsOverWordsParser();
    const song = parser.parse(chordOverWords);
    const { lines } = song;

    expect(lines[0].items.length).toEqual(1);
    expect(lines[0].items[0]).toBeTag('title', 'Let it be');

    expect(lines[1].items.length).toEqual(1);
    expect(lines[1].items[0]).toBeTag('comment', 'Chorus 1:');

    const line1Pairs = lines[2].items;
    expect(line1Pairs[0]).toBeChordLyricsPair('', 'Let it ');
    expect(line1Pairs[1]).toBeChordLyricsPair('Am', 'be');
  });

  describe('chord placement', () => {
    it('pairs chord with only one lyric', () => {
      const chordOverWords = `
Chorus 1:
       Am         C/G
Let it be, let it be
`.substring(1);
      const parser = new ChordsOverWordsParser();
      const song = parser.parse(chordOverWords);
      const { lines } = song;

      expect(lines[0].items.length).toEqual(1);
      expect(lines[0].items[0]).toBeTag('comment', 'Chorus 1:');

      const line2Pairs = lines[2].items;
      expect(line2Pairs[0]).toBeChordLyricsPair('', 'Let it ');
      expect(line2Pairs[1]).toBeChordLyricsPair('Am', 'be,');
      expect(line2Pairs[2]).toBeChordLyricsPair('', 'let it ');
      expect(line2Pairs[3]).toBeChordLyricsPair('C/G', 'be');
    });

    it('correctly places a trailing chord', () => {
      const chordOverWords = `
Chorus 1
      Am            C/G
Let it   be, let it be
`.substring(1);
      const parser = new ChordsOverWordsParser();
      const song = parser.parse(chordOverWords);
      const { lines } = song;

      expect(lines[0].items.length).toEqual(1);
      expect(lines[0].items[0]).toBeTag('comment', 'Chorus 1');

      const line1Pairs = lines[1].items;
      expect(line1Pairs[0]).toBeChordLyricsPair('', 'Let it');
      expect(line1Pairs[1]).toBeChordLyricsPair('Am', '');
      expect(line1Pairs[2]).toBeChordLyricsPair('', ' be, let it');
      expect(line1Pairs[3]).toBeChordLyricsPair('C/G', 'be');
    });
  });
});