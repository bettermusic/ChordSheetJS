ChordSheet
  = lines:LineWithNewLine+ line: Line {
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
    // get column index of each space
    let spacePositions = []
    lyrics.split('').map((c, i) => {
      if (c == ' ') {
          spacePositions.push(i);
        }
    })

    const chordColumns = chords.map(x => x.column);
    let start;
    let end;
    let lyric;
    const pairs = [];
          
    chordColumns.map((position, i) => {
      let nextSpace = spacePositions[0]; 
      let nextChord = position;
      const lastChordInLine = nextChord == chordColumns[chordColumns.length - 1];

      // chords only line
      if (spacePositions.length == 0) {
          pairs.push({
            chord: chords[i],
            lyrics: ''
          });
          return;
      }

      if(nextChord > 0 && i == 0) {
        start = 0;
        end = nextChord;
        lyric = lyrics.substring(start,end);
        pairs.push({
          chord: '',
          lyrics: lyric
        });
        spacePositions = spacePositions.filter(x => x >= nextChord);
        start = end;
        end = spacePositions[0] + 1;
        if (!end) {
          end = lyrics.length;
          lyric = lyrics.substring(start,end);
        } else {
          lyric = lyrics.substring(start,end);
        } 
        pairs.push({
          chord: chords[i],
          lyrics: lyric
        });
        start = end;
        }
        
        if(nextChord == 0 && i == 0) {
          start = 0;
          end = nextSpace + 1;
          lyric = lyrics.substring(start,end);
          pairs.push({
            chord: chords[i],
            lyrics: lyric
          });
          start = end;
        }
        
        if(nextChord > 0 && i > 0) {
          if (nextChord > nextSpace) {
            end = position;
            lyric = lyrics.substring(start,end);
            pairs.push({
              chord: '',
              lyrics: lyric.trim() + ' '
            });
            spacePositions = spacePositions.filter(x => x >= nextChord);
            start = end;
            end = spacePositions[0] + 1;
            if (!end) {
              end = lyrics.length;
              lyric = lyrics.substring(start,end);
            } else {
              lyric = lyrics.substring(start,end);
            }
            pairs.push({
              chord: chords[i],
              lyrics: lyric
            });
            start = end; 
          }
        }
        
        if (lastChordInLine && lyrics.length > end) {
          start = end;
          end = lyrics.length;
          lyric = lyrics.substring(start,end);
          pairs.push({
            chord: '',
            lyrics: lyric
          });
        }
    });


    const chordLyricsPairs = pairs.map((pair) => {
      return {
        type: "chordLyricsPair",
        chord: pair.chord,
        lyrics: pair.lyrics
      };
    });

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
  