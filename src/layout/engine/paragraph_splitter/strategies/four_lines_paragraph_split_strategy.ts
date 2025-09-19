import { createColumnBreakLineLayout } from '../../layout_helpers';
import { LineLayout, ParagraphSplitStrategy } from '../../types';

export class FourLinesParagraphSplitStrategy implements ParagraphSplitStrategy {
  splitParagraph(
    lineLayouts: LineLayout[][],
    currentY: number,
    columnStartY: number,
    columnBottomY: number,
  ): LineLayout[][] {
    let newLineLayouts: LineLayout[][] = [];

    let chordLyricPairLinesSeen = 0;
    let splitIndex = -1;
    let heightFirstPart = 0;

    for (let i = 0; i < lineLayouts.length; i += 1) {
      const lines = lineLayouts[i];
      let linesHeight = 0;
      let chordLyricPairLinesSeenInLineLayout = 0;

      lines.forEach((lineLayout) => {
        linesHeight += lineLayout.lineHeight;

        if (lineLayout.type === 'ChordLyricsPair') {
          chordLyricPairLinesSeenInLineLayout += 1;
        }
      });

      chordLyricPairLinesSeen += chordLyricPairLinesSeenInLineLayout;

      heightFirstPart += linesHeight;
      if (chordLyricPairLinesSeen >= 2) { // Always split after 2nd chord-lyric line for 4-line paragraphs
        splitIndex = i + 1;
        break;
      }
    }

    if (currentY + heightFirstPart <= columnBottomY) {
      // First part fits in current column
      newLineLayouts = newLineLayouts.concat(lineLayouts.slice(0, splitIndex));
      newLineLayouts.push([createColumnBreakLineLayout()]);
      newLineLayouts = newLineLayouts.concat(lineLayouts.slice(splitIndex));
    } else {
      // First part doesn't fit; insert column break before paragraph
      if (currentY !== columnStartY) {
        newLineLayouts.push([createColumnBreakLineLayout()]);
      }
      newLineLayouts = newLineLayouts.concat(lineLayouts);
    }

    return newLineLayouts;
  }
}
