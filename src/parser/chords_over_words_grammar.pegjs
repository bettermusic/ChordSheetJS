ChordSheet
  = metadataLines:Metadata? lines:ChordSheetContents? {
      return {
        type: "chordSheet",
        lines: [
          ...metadataLines,
          ...lines,
        ]
      };
    }

ChordSheetContents
  = newLine:NewLine? items:ChordSheetItemWithNewLine* trailingItem:ChordSheetItem? {
    const hasEmptyLine = newLine?.length > 0;
    const emptyLines = hasEmptyLine ? [{ type: "line", items: [] }] : [];
    return [...emptyLines, ...items, trailingItem];
  }

ChordSheetItemWithNewLine
  = item:ChordSheetItem NewLine {
    return item;
  }

ChordSheetItem
  = item:(ChordLyricsLines / LyricsLine) {
    return item;
  }

ChordLyricsLines
  = chords:ChordsLine NewLine lyrics:Lyrics {
      const chordLyricsPairs = chords.map((chord, i) => {
        const nextChord = chords[i + 1];
        const start = chord.column - 1;
        const end = nextChord ? nextChord.column - 1 : lyrics.length;
        const pairLyrics = lyrics.substring(start, end);
        const secondWordPosition = pairLyrics.search(/(?<=\s+)\S/);

        if (secondWordPosition !== -1 && secondWordPosition < end) {
          return [
            { type: "chordLyricsPair", chord, lyrics: pairLyrics.substring(0, secondWordPosition) },
            { type: "chordLyricsPair", chord: '', lyrics: pairLyrics.substring(secondWordPosition) },
          ];
        }

        return { type: "chordLyricsPair", chord, lyrics: pairLyrics };
      }).flat();

      const firstChord = chords[0];

      if (firstChord && firstChord.column > 1) {
      	const firstChordPosition = firstChord.column;

        if (firstChordPosition > 0) {
          chordLyricsPairs.unshift({
            type: "chordLyricsPair",
            chord: null,
            lyrics: lyrics.substring(0, firstChordPosition - 1),
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

Metadata
  = pairs:MetadataPairWithNewLine* trailingPair:MetadataPair? MetadataSeparator? {
      return [...pairs, trailingPair]
        .filter(x => x)
        .map(([key, value]) => ({
          type: "line",
          items: [
            { type: "tag", name: key, value },
          ],
        }));
    }

InlineMetadata
  = key:$(MetadataKey) _ ":" _ value:$(MetadataValue) {
      return {
        type: "line",
        items: [
          { type: "tag", name: key, value },
        ],
      }
    }

MetadataPairWithNewLine
  = pair:MetadataPair NewLine {
      return pair;
    }

MetadataPair
  = MetadataPairWithBrackets / MetadataPairWithoutBrackets

MetadataPairWithBrackets
  = "{" _ pair:MetadataPairWithoutBrackets _ "}" {
    return pair;
  }

MetadataPairWithoutBrackets
  = key:$(MetadataKey) _ ":" _ value:$(MetadataValue) {
    return [key, value];
  }

MetadataKey
  = [a-zA-Z0-9-_]+

MetadataValue
  = [^\n\r}]+

MetadataSeparator
  = "---" NewLine

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
