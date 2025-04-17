/* eslint quote-props: 0 */

import { Chord } from '../../src';

const majorExamples = {
  'Ab': {
    'I': 'Ab',
    'bII': 'A',
    'II': 'Bb',
    'bIII': 'Cb',
    'III': 'C',
    'IV': 'Db',
    'bV': 'D',
    'V': 'Eb',
    'bVI': 'E',
    'VI': 'F',
    'VII': 'G',
  },

  'A': {
    'I': 'A',
    'i': 'Am',
    'II': 'B',
    'IImaj': 'B',
    'ii': 'Bm',
    'IV': 'D',
    'I/III': 'A/C#',
    'III': 'C#',
    'V/VII': 'E/G#',
    'bIII': 'C',
    'VII': 'G#',
    'VIIdim': 'G#dim',
    '#Isus': 'A#sus',
  },

  'Bb': {
    'I': 'Bb',
    'bII': 'Cb',
    'II': 'C',
    'bIII': 'Db',
    'III': 'D',
    'IV': 'Eb',
    'bV': 'E',
    'V': 'F',
    'bVI': 'Gb',
    'VI': 'G',
    'bVII': 'Ab',
    'VII': 'A',
  },

  'B': {
    'I': 'B',
    'bII': 'C',
    'II': 'C#',
    'bIII': 'D',
    'III': 'D#',
    'IV': 'E',
    'bV': 'F',
    'V': 'F#',
    'bVI': 'G',
    'VI': 'G#',
    'bVII': 'A',
    'VII': 'A#',
  },

  'Cb': {
    'I': 'Cb',
    'bII': 'C',
    'II': 'Db',
    'bIII': 'D',
    'III': 'Eb',
    'IV': 'Fb',
    'bV': 'F',
    'V': 'Gb',
    'bVI': 'G',
    'VI': 'Ab',
    'bVII': 'A',
    'VII': 'Bb',
  },

  'C': {
    'I': 'C',
    'bII': 'Db',
    'II': 'D',
    'bIII': 'Eb',
    'III': 'E',
    'III/#V': 'E/G#',
    'IV': 'F',
    'bV': 'Gb',
    'V': 'G',
    'bVI': 'Ab',
    'VI': 'A',
    'bVII': 'Bb',
    'VII': 'B',
  },

  'C#': {
    'I': 'C#',
    'bII': 'D',
    'II': 'D#',
    'bIII': 'E',
    'III': 'F',
    'IV': 'F#',
    'bV': 'G',
    'V': 'G#',
    'bVI': 'A',
    'VI': 'A#',
    'bVII': 'B',
    'VII': 'C',
  },

  'Db': {
    'I': 'Db',
    'bII': 'D',
    'II': 'Eb',
    'bIII': 'E',
    'III': 'F',
    'III/#V': 'F/A',
    'IV': 'Gb',
    'bV': 'G',
    'V': 'Ab',
    'bVI': 'A',
    'VI': 'Bb',
    'bVII': 'B',
    'VII': 'C',
  },

  'D': {
    'I': 'D',
    'bII': 'Eb',
    'II': 'E',
    'bIII': 'F',
    'III': 'F#',
    'IV': 'G',
    'bV': 'Ab',
    'V': 'A',
    'bVI': 'Bb',
    'VI': 'B',
    'bVII': 'C',
    'VII': 'C#',
  },

  'Eb': {
    'I': 'Eb',
    'bII': 'E',
    'II': 'F',
    'bIII': 'Gb',
    'III': 'G',
    'IV': 'Ab',
    'bV': 'A',
    'V': 'Bb',
    'bVI': 'B',
    'VI': 'C',
    'bVII': 'Db',
    'VII': 'D',
  },

  'E': {
    'I': 'E',
    'bII': 'F',
    'II': 'F#',
    'bIII': 'G',
    'III': 'G#',
    'IV': 'A',
    'bV': 'Bb',
    'V': 'B',
    'bVI': 'C',
    'VI': 'C#',
    'bVII': 'D',
    'VII': 'D#',
  },

  'F': {
    'I': 'F',
    'bII': 'Gb',
    'II': 'G',
    'bIII': 'Ab',
    'III': 'A',
    'IV': 'Bb',
    'bV': 'B',
    'V': 'C',
    'bVI': 'Db',
    'VI': 'D',
    'bVII': 'Eb',
    'VII': 'E',
  },

  'F#': {
    'I': 'F#',
    'bII': 'G',
    'II': 'G#',
    'bIII': 'A',
    'III': 'A#',
    'IV': 'B',
    'bV': 'C',
    'V': 'C#',
    'bVI': 'D',
    'VI': 'D#',
    'bVII': 'E',
    'VII': 'F',
  },

  'Gb': {
    'I': 'Gb',
    'bII': 'G',
    'II': 'Ab',
    'bIII': 'A',
    'III': 'Bb',
    'IV': 'Cb',
    'bV': 'C',
    'V': 'Db',
    'bVI': 'D',
    'VI': 'Eb',
    'bVII': 'Fb',
    'VII': 'F',
  },

  'G': {
    'I': 'G',
    'bII': 'Ab',
    'II': 'A',
    'bIII': 'Bb',
    'III': 'B',
    'IV': 'C',
    'bV': 'Db',
    'V': 'D',
    'bVI': 'Eb',
    'VI': 'E',
    'bVII': 'F',
    'VII': 'F#',
  },

  'G#': {
    'I': 'G#',
    'bII': 'A',
    'II': 'Bb',
    'bIII': 'B',
    'III': 'C',
    'IV': 'C#',
    'bV': 'D',
    'V': 'Eb',
    'bVI': 'E',
    'VI': 'F',
    'bVII': 'Gb',
    'VII': 'G',
  },
};

const minorExamples = {
  'Am': {
    'i': 'Cm',
    'bii': 'Dbm',
    'ii': 'Dm',
    'iii': 'Ebm',
    'biv': 'Em',
    'iv': 'Fm',
    'bv': 'Gbm',
    'v': 'Gm',
    'vi': 'Abm',
    '#vi': 'Am',
    'bvii': 'Am',
    'vii': 'Bbm',
  },

  'Bbm': {
    'i': 'Dbm',
    'bii': 'Dm',
    'ii': 'Ebm',
    'iii': 'Em',
    'biv': 'Fm',
    'iv': 'F#m',
    'bv': 'Gm',
    'v': 'Abm',
    'vi': 'Am',
    '#vi': 'A#m',
    'bvii': 'Bbm',
    'vii': 'Bm',
  },

  'Bm': {
    'i': 'Dm',
    'bii': 'Ebm',
    'ii': 'Em',
    'iii': 'Fm',
    'biv': 'Gbm',
    'iv': 'Gm',
    'bv': 'Abm',
    'v': 'Am',
    'vi': 'Bbm',
    '#vi': 'Bm',
    'bvii': 'Bm',
    'vii': 'Cm',
  },

  'Cm': {
    'i': 'Ebm',
    'bii': 'Em',
    'ii': 'Fm',
    'iii': 'Gbm',
    'biv': 'Gm',
    'iv': 'Abm',
    'bv': 'Am',
    'v': 'Bbm',
    'vi': 'Bm',
    '#vi': 'Cm',
    'bvii': 'Cm',
    'vii': 'Dbm',
  },

  'C#m': {
    'i': 'Em',
    'bii': 'Fm',
    'ii': 'F#m',
    'iii': 'Gm',
    'biv': 'Abm',
    'iv': 'Am',
    'bv': 'Bbm',
    'v': 'Bm',
    'vi': 'Cm',
    '#vi': 'C#m',
    'bvii': 'Dbm',
    'vii': 'Dm',
  },

  'Dm': {
    'i': 'Fm',
    'bii': 'Gbm',
    'ii': 'Gm',
    'iii': 'Abm',
    'biv': 'Am',
    'iv': 'Bbm',
    'bv': 'Bm',
    'v': 'Cm',
    'vi': 'Dbm',
    '#vi': 'Dm',
    'bvii': 'Dm',
    'vii': 'Ebm',
  },

  'Ebm': {
    'i': 'Gbm',
    'bii': 'Gm',
    'ii': 'Abm',
    'iii': 'Am',
    'biv': 'Bbm',
    'iv': 'Bm',
    'bv': 'Cm',
    'v': 'Dbm',
    'vi': 'Dm',
    '#vi': 'D#m',
    'bvii': 'Ebm',
    'vii': 'Em',
  },

  'Em': {
    'i': 'Gm',
    'bii': 'Abm',
    'ii': 'Am',
    'iii': 'Bbm',
    'biv': 'Bm',
    'iv': 'Cm',
    'bv': 'Dbm',
    'v': 'Dm',
    'vi': 'Ebm',
    '#vi': 'Em',
    'bvii': 'Em',
    'vii': 'Fm',
  },

  'Fm': {
    'i': 'Abm',
    'bii': 'Am',
    'ii': 'Bbm',
    'iii': 'Bm',
    'biv': 'Cm',
    'iv': 'Dbm',
    'bv': 'Dm',
    'v': 'Ebm',
    'vi': 'Em',
    '#vi': 'Fm',
    'bvii': 'Fm',
    'vii': 'Gbm',
  },

  'F#m': {
    'i': 'Am',
    'bii': 'Bbm',
    'ii': 'Bm',
    'iii': 'Cm',
    'biv': 'C#m',
    'iv': 'Dm',
    'bv': 'Ebm',
    'v': 'Em',
    'vi': 'Fm',
    '#vi': 'F#m',
    'bvii': 'F#m',
    'vii': 'Gm',
  },

  'Gm': {
    'i': 'Bbm',
    'bii': 'Bm',
    'ii': 'Cm',
    'iii': 'Dbm',
    'biv': 'Dm',
    'iv': 'Ebm',
    'bv': 'Em',
    'v': 'Fm',
    'vi': 'Gbm',
    '#vi': 'Gm',
    'bvii': 'Gm',
    'vii': 'Abm',
  },

  'G#m': {
    'i': 'Bm',
    'bii': 'Cm',
    'ii': 'C#m',
    'iii': 'Dm',
    'biv': 'D#m',
    'iv': 'Em',
    'bv': 'Fm',
    'v': 'F#m',
    'vi': 'Gm',
    '#vi': 'G#m',
    'bvii': 'Abm',
    'vii': 'Am',
  },
};

describe('numeral chords', () => {
  describe('toChordSymbol', () => {
    describe('major Keys', () => {
      Object.entries(majorExamples).forEach(([key, conversions]) => {
        describe(`For key ${key}`, () => {
          const keyChord = Chord.parseOrFail(key);
          const songKey = keyChord.root;

          Object.entries(conversions).forEach(([numeralChord, chordSymbol]) => {
            it(`converts ${numeralChord} to ${chordSymbol}`, () => {
              const chord = Chord.parseOrFail(numeralChord);
              const chordSymbolString = chord.toChordSymbolString(songKey);
              expect(chordSymbolString).toEqual(chordSymbol);
            });
          });
        });
      });
    });

    describe('minor Keys', () => {
      Object.entries(minorExamples).forEach(([key, conversions]) => {
        describe(`For key ${key}`, () => {
          const keyChord = Chord.parseOrFail(key);
          const songKey = keyChord.root;

          Object.entries(conversions).forEach(([numeralChord, chordSymbol]) => {
            it(`converts ${numeralChord} to ${chordSymbol}`, () => {
              const chord = Chord.parseOrFail(numeralChord);
              const chordSymbolString = chord.toChordSymbolString(songKey);
              expect(chordSymbolString).toEqual(chordSymbol);
            });
          });
        });
      });
    });
  });
});
