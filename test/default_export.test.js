import chordchartjs from '../src';

describe('default export', () => {
  [
    'ChordProParser',
    'ChordChartParser',
    'UltimateGuitarParser',
    'TextFormatter',
    'HtmlTableFormatter',
    'HtmlDivFormatter',
    'ChordProFormatter',
    'ChordLyricsPair',
    'Line',
    'Song',
    'Tag',
    'Comment',
    'Metadata',
    'Paragraph',
    'Ternary',
    'Composite',
    'Literal',
    'ChordChartSerializer',
    'CHORUS',
    'INDETERMINATE',
    'VERSE',
    'NONE',
  ].forEach((constantName) => {
    it(`contains ${constantName}`, () => {
      expect(typeof chordchartjs[constantName]).not.toEqual('undefined');
    });
  });
});
