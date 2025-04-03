import { LineLayout, ParagraphSplitStrategy } from '../../types';
import { createColumnBreakLineLayout } from '../../layout_helpers';

export class FiveOrMoreLinesParagraphSplitStrategy implements ParagraphSplitStrategy {
  private totalChordLyricPairLines!: number;

  constructor(
    private chordLyricLineCount: number,
  ) {
    this.totalChordLyricPairLines = chordLyricLineCount;
  }

  splitParagraph(
    lineLayouts: LineLayout[][],
    currentY: number,
    columnStartY: number,
    columnBottomY: number,
  ): LineLayout[][] {
    let newLineLayouts: LineLayout[][] = [];

    // Flatten lineLayouts into a flat array of LineLayout
    const flatLineLayouts: LineLayout[] = [];
    const lineLayoutIndices: { outerIndex: number; innerIndex: number }[] = [];

    for (let outerIndex = 0; outerIndex < lineLayouts.length; outerIndex += 1) {
      const innerArray = lineLayouts[outerIndex];
      for (let innerIndex = 0; innerIndex < innerArray.length; innerIndex += 1) {
        flatLineLayouts.push(innerArray[innerIndex]);
        lineLayoutIndices.push({ outerIndex, innerIndex });
      }
    }

    const acceptableSplits: { index: number; heightFirstPart: number }[] = [];

    let heightFirstPart = 0;
    let chordLyricLinesInFirstPart = 0;

    // Identify all acceptable split points where both parts have at least two chord-lyric lines
    for (let i = 0; i < flatLineLayouts.length - 1; i += 1) {
      const lineLayout = flatLineLayouts[i];
      heightFirstPart += lineLayout.lineHeight;

      if (lineLayout.type === 'ChordLyricsPair') {
        chordLyricLinesInFirstPart += 1;
      }

      const remainingChordLyricLines = this.totalChordLyricPairLines - chordLyricLinesInFirstPart;

      // Ensure at least two chord-lyric lines remain in both parts
      if (chordLyricLinesInFirstPart >= 2 && remainingChordLyricLines >= 2) {
        acceptableSplits.push({ index: i + 1, heightFirstPart });
      }
    }

    // Try to find the best split point that fits in the current column
    let splitFound = false;

    // Start from the split point that includes the most lines in the first part
    for (let i = acceptableSplits.length - 1; i >= 0; i -= 1) {
      const split = acceptableSplits[i];

      if (currentY + split.heightFirstPart <= columnBottomY) {
        // First part fits in current column

        // Map the flat indices back to lineLayouts indices
        const splitIndex = split.index;
        const firstPartLineLayouts: LineLayout[][] = [];
        const secondPartLineLayouts: LineLayout[][] = [];

        // Collect lineLayouts for the first part
        let currentOuterIndex = lineLayoutIndices[0].outerIndex;
        let currentInnerArray: LineLayout[] = [];
        for (let j = 0; j < splitIndex; j += 1) {
          const { outerIndex } = lineLayoutIndices[j];
          const lineLayout = flatLineLayouts[j];

          if (outerIndex !== currentOuterIndex) {
            if (currentInnerArray.length > 0) {
              firstPartLineLayouts.push(currentInnerArray);
            }
            currentInnerArray = [];
            currentOuterIndex = outerIndex;
          }
          currentInnerArray.push(lineLayout);
        }
        if (currentInnerArray.length > 0) {
          firstPartLineLayouts.push(currentInnerArray);
        }

        // Collect lineLayouts for the second part
        currentOuterIndex = lineLayoutIndices[splitIndex].outerIndex;
        currentInnerArray = [];
        for (let j = splitIndex; j < flatLineLayouts.length; j += 1) {
          const { outerIndex } = lineLayoutIndices[j];
          const lineLayout = flatLineLayouts[j];

          if (outerIndex !== currentOuterIndex) {
            if (currentInnerArray.length > 0) {
              secondPartLineLayouts.push(currentInnerArray);
            }
            currentInnerArray = [];
            currentOuterIndex = outerIndex;
          }
          currentInnerArray.push(lineLayout);
        }
        if (currentInnerArray.length > 0) {
          secondPartLineLayouts.push(currentInnerArray);
        }

        // Build newLineLayouts
        newLineLayouts = newLineLayouts.concat(firstPartLineLayouts);
        newLineLayouts.push([createColumnBreakLineLayout()]);
        newLineLayouts = newLineLayouts.concat(secondPartLineLayouts);

        splitFound = true;
        break;
      }
    }

    if (!splitFound) {
      // No acceptable split point fits; move entire paragraph to the next column
      if (currentY !== columnStartY) {
        newLineLayouts.push([createColumnBreakLineLayout()]);
      }
      newLineLayouts = newLineLayouts.concat(lineLayouts);
    }

    return newLineLayouts;
  }
}
