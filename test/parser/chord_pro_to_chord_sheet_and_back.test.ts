import {
  ChordProFormatter, ChordProParser, ChordSheetParser, TextFormatter,
} from '../../src';

import '../matchers';

const chordSheet = `
Chorus 1
                     Dsus  
There’s honey in the rock, water in the stone

Verse 1
D        Dsus               D        Dsus 
  Praying     for a miracle,  thirsty`.substring(1);

const chordPro = `
{c:Chorus 1}
There’s honey in the [Dsus]rock, water in the stone

{c:Verse 1}
[D] Praying[Dsus] for a miracle,[D] thirsty[Dsus]`.substring(1);

describe('Parser Integration', () => {
  it('can take a chordsheet, turn into chordpro, and then back to the same chordsheet', () => {
    const chordSheetParser = new ChordSheetParser({ preserveWhitespace: false });
    const song = chordSheetParser.parse(chordSheet);
    const chordProFormatter = new ChordProFormatter();
    const chordProFromChordSheet = chordProFormatter.format(song);

    expect(chordProFromChordSheet).toEqual(chordPro);

    const chordProParser = new ChordProParser();
    const songFromChordPro = chordProParser.parse(chordProFromChordSheet);
    const textFormatter = new TextFormatter();
    const chordSheetFromChordPro = textFormatter.format(songFromChordPro);

    expect(chordSheetFromChordPro).toEqual(chordSheet);
  });
});
