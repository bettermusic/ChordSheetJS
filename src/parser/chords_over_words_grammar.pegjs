ChordSheet
  = lines:LineWithNewLine* line: Line? {
      return {
        type: "chordSheet",
        lines: [...lines, line]
      };
    }

LineWithNewLine
  = items:Line NewLine {
    return items;
  }

Line
  = item:(InlineMetaData / ChordLyricsLines / LyricsLine) {
    return item;
  }

ChordLyricsLines
  = chords:ChordsLine NewLine lyrics:Lyrics {
      const chordLyricsPairs = chords.map((chord, i) => {
         const nextChord = chords[i + 1];
         const start = chord.column;
         const end = nextChord ? nextChord.column : lyrics.length;

         return {
           type: "chordLyricsPair",
           chord,
           lyrics: lyrics.substring(start, end)
         };
      });

      const firstChord = chords[0];

      if (firstChord && chords[0].column > 0) {
      	const firstChordPosition = firstChord.column;

        if (firstChordPosition > 0) {
          chordLyricsPairs.unshift({
            type: "chordLyricsPair",
            chord: null,
            lyrics: lyrics.substring(0, firstChordPosition),
          });
        }
      }

      return { type: "line", items: chordLyricsPairs };
    }

ChordsLine
  = ChordWithSpacing+

LyricsLine
  = lyrics:Lyrics {
  	if (lyrics.length === 0) {
      return { type: "line", items: [] };
    }

    return {
      type: "line",
      items: [
        { type: "tag", name: "comment", value: lyrics }
      ]
    };
  }

Lyrics
  = $(WordChar*)

WordChar
  = [^\n\r]

ChordWithSpacing
  = _ chord:Chord _ {
      return chord;
    }

MetaData
  = pairs:MetaDataPair* MetaDataSeparator? {
      return pairs.map(([key, value]) => ({
        type: "line",
        items: [
          { type: "tag", name: key, value },
        ],
      }));
    }

InlineMetaData
  = key:$(MetaDataKey) _ ":" _ value:$(MetaDataValue) {
      return {
        type: "line",
        items: [
          { type: "tag", name: key, value },
        ],
      }
    }

MetaDataPair
  = key:$(MetaDataKey) _ ":" _ value:$(MetaDataValue) NewLine {
      return [key, value];
    }

MetaDataKey
  = [^\n\r\t: -]+

MetaDataValue
  = [^\n\r]+

MetaDataSeparator
  = "---"

_ "whitespace"
  = [ \t]*

NewLine
  = CarriageReturn / LineFeed / CarriageReturnLineFeed

CarriageReturnLineFeed
  = CarriageReturn LineFeed

LineFeed
  = "\n"

CarriageReturn
  = "\r"
