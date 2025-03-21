import { SerializedSong } from '../../src/serialized_types';

export const serializedSongSymbol: SerializedSong = {
  type: 'chordSheet',
  lines: [
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'title',
          value: 'Let it be',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'subtitle',
          value: 'ChordSheetJS example version',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'key',
          value: 'C',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'x_some_setting',
          value: '',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'composer',
          value: 'John Lennon',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'composer',
          value: 'Paul McCartney',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'comment',
          comment: 'This is my favorite song',
        },
      ],
    },
    {
      type: 'line',
      items: [],
    },
    {
      type: 'line',
      items: [
        {
          type: 'chordLyricsPair',
          chords: '',
          lyrics: 'Written by: ',
          chord: null,
          annotation: '',
        },
        {
          type: 'ternary',
          variable: 'composer',
          valueTest: null,
          trueExpression: [
            {
              type: 'ternary',
              variable: null,
              valueTest: null,
              trueExpression: [],
              falseExpression: [],
            },
          ],
          falseExpression: [
            'No composer defined for ',
            {
              type: 'ternary',
              variable: 'title',
              valueTest: null,
              trueExpression: [
                {
                  type: 'ternary',
                  variable: null,
                  valueTest: null,
                  trueExpression: [],
                  falseExpression: [],
                },
              ],
              falseExpression: [
                'Untitled song',
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'line',
      items: [],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'start_of_verse',
          value: 'Verse 1',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'chordLyricsPair',
          chords: '',
          lyrics: 'Let it ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'Am',
          lyrics: 'be, ',
          chord: null,
          annotation: '',
        },
        {
          type: 'softLineBreak',
        },
        {
          type: 'chordLyricsPair',
          chords: '',
          lyrics: 'let it ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'C/G',
          lyrics: 'be, let it ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'F',
          lyrics: 'be, let it ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'C',
          lyrics: 'be',
          chord: null,
          annotation: '',
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'transpose',
          value: '2',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'chordLyricsPair',
          chords: 'C',
          lyrics: 'Whisper ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: '',
          lyrics: 'words of ',
          chord: null,
          annotation: 'strong',
        },
        {
          type: 'chordLyricsPair',
          chords: 'F',
          lyrics: 'wis',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'G',
          lyrics: 'dom, let it ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'F',
          lyrics: 'be ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'C/E',
          lyrics: ' ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'Dm',
          lyrics: ' ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'C',
          lyrics: '',
          chord: null,
          annotation: '',
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'end_of_verse',
          value: '',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'start_of_chorus',
          value: '',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'comment',
          value: 'Breakdown',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'transpose',
          value: 'G',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'chordLyricsPair',
          chords: 'Am',
          lyrics: 'Whisper words of ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'Bb',
          lyrics: 'wisdom, let it ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'F',
          lyrics: 'be ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'C',
          lyrics: '',
          chord: null,
          annotation: '',
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'end_of_chorus',
          value: '',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'start_of_chorus',
          value: '',
          attributes: { label: 'Chorus 2' },
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'chordLyricsPair',
          chords: 'C',
          lyrics: 'Whisper words of ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'Bb',
          lyrics: 'wisdom, let it ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'F',
          lyrics: 'be ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'C',
          lyrics: '',
          chord: null,
          annotation: '',
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'end_of_chorus',
          value: '',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'start_of_solo',
          value: 'Solo 1',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'chordLyricsPair',
          chords: 'C',
          lyrics: 'Solo line 1',
          chord: null,
          annotation: '',
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'chordLyricsPair',
          chords: 'F',
          lyrics: 'Solo line 2',
          chord: null,
          annotation: '',
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'end_of_solo',
          value: '',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'start_of_tab',
          value: '',
          attributes: { label: 'Tab 1' },
        },
      ],
    },
    {
      type: 'line',
      items: [
        'Tab line 1',
      ],
    },
    {
      type: 'line',
      items: [
        'Tab line 2',
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'end_of_tab',
          value: '',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'start_of_abc',
          value: 'ABC 1',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        'ABC line 1',
      ],
    },
    {
      type: 'line',
      items: [
        'ABC line 2',
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'end_of_abc',
          value: '',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'start_of_ly',
          value: 'LY 1',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        'LY line 1',
      ],
    },
    {
      type: 'line',
      items: [
        'LY line 2',
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'end_of_ly',
          value: '',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'start_of_bridge',
          value: 'Bridge 1',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'chordLyricsPair',
          chords: '',
          lyrics: 'Bridge line',
          chord: null,
          annotation: '',
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'end_of_bridge',
          value: '',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'start_of_grid',
          value: 'Grid 1',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        'Grid line 1',
      ],
    },
    {
      type: 'line',
      items: [
        'Grid line 2',
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'end_of_grid',
          value: '',
          attributes: {},
        },
      ],
    },
  ],
};

export const serializedSongSolfege: SerializedSong = {
  type: 'chordSheet',
  lines: [
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'title',
          value: 'Let it be',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'subtitle',
          value: 'ChordSheetJS example version',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'key',
          value: 'Do',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'x_some_setting',
          value: '',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'composer',
          value: 'John Lennon',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'composer',
          value: 'Paul McCartney',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'comment',
          comment: 'This is my favorite song',
        },
      ],
    },
    {
      type: 'line',
      items: [],
    },
    {
      type: 'line',
      items: [
        {
          type: 'chordLyricsPair',
          chords: '',
          lyrics: 'Written by: ',
          chord: null,
          annotation: '',
        },
        {
          type: 'ternary',
          variable: 'composer',
          valueTest: null,
          trueExpression: [
            {
              type: 'ternary',
              variable: null,
              valueTest: null,
              trueExpression: [],
              falseExpression: [],
            },
          ],
          falseExpression: [
            'No composer defined for ',
            {
              type: 'ternary',
              variable: 'title',
              valueTest: null,
              trueExpression: [
                {
                  type: 'ternary',
                  variable: null,
                  valueTest: null,
                  trueExpression: [],
                  falseExpression: [],
                },
              ],
              falseExpression: [
                'Untitled song',
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'line',
      items: [],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'start_of_verse',
          value: 'Verse 1',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'chordLyricsPair',
          chords: '',
          lyrics: 'Let it ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'Lam',
          lyrics: 'be, let it ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'Do/Sol',
          lyrics: 'be, let it ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'Fa',
          lyrics: 'be, let it ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'Do',
          lyrics: 'be',
          chord: null,
          annotation: '',
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'transpose',
          value: '2',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'chordLyricsPair',
          chords: 'Do',
          lyrics: 'Whisper ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: '',
          lyrics: 'words of ',
          chord: null,
          annotation: 'strong',
        },
        {
          type: 'chordLyricsPair',
          chords: 'Fa',
          lyrics: 'wis',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'Sol',
          lyrics: 'dom, let it ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'Fa',
          lyrics: 'be ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'Do/Mi',
          lyrics: ' ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'Rem',
          lyrics: ' ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'Do',
          lyrics: '',
          chord: null,
          annotation: '',
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'end_of_verse',
          value: '',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'start_of_chorus',
          value: '',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'comment',
          value: 'Breakdown',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'transpose',
          value: 'Sol',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'chordLyricsPair',
          chords: 'Lam',
          lyrics: 'Whisper words of ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'Sib',
          lyrics: 'wisdom, let it ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'Fa',
          lyrics: 'be ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'Do',
          lyrics: '',
          chord: null,
          annotation: '',
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'end_of_chorus',
          value: '',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'start_of_chorus',
          value: '',
          attributes: { label: 'Chorus 2' },
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'chordLyricsPair',
          chords: 'Lam',
          lyrics: 'Whisper words of ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'Sib',
          lyrics: 'wisdom, let it ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'Fa',
          lyrics: 'be ',
          chord: null,
          annotation: '',
        },
        {
          type: 'chordLyricsPair',
          chords: 'Do',
          lyrics: '',
          chord: null,
          annotation: '',
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'end_of_chorus',
          value: '',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'start_of_solo',
          value: 'Solo 1',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'chordLyricsPair',
          chords: 'Do',
          lyrics: 'Solo line 1',
          chord: null,
          annotation: '',
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'chordLyricsPair',
          chords: 'Fa',
          lyrics: 'Solo line 2',
          chord: null,
          annotation: '',
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'end_of_solo',
          value: '',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'start_of_tab',
          value: 'Tab 1',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        'Tab line 1',
      ],
    },
    {
      type: 'line',
      items: [
        'Tab line 2',
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'end_of_tab',
          value: '',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'start_of_abc',
          value: 'ABC 1',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        'ABC line 1',
      ],
    },
    {
      type: 'line',
      items: [
        'ABC line 2',
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'end_of_abc',
          value: '',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'start_of_ly',
          value: 'LY 1',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        'LY line 1',
      ],
    },
    {
      type: 'line',
      items: [
        'LY line 2',
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'end_of_ly',
          value: '',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'start_of_bridge',
          value: 'Bridge 1',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'chordLyricsPair',
          chords: '',
          lyrics: 'Bridge line',
          chord: null,
          annotation: '',
        },
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'end_of_bridge',
          value: '',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'start_of_grid',
          value: 'Grid 1',
          attributes: {},
        },
      ],
    },
    {
      type: 'line',
      items: [
        'Grid line 1',
      ],
    },
    {
      type: 'line',
      items: [
        'Grid line 2',
      ],
    },
    {
      type: 'line',
      items: [
        {
          type: 'tag',
          name: 'end_of_grid',
          value: '',
          attributes: {},
        },
      ],
    },
  ],
};
