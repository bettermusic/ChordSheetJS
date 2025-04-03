import Line from '../../chord_sheet/line';
import ChordLyricsPair from '../../chord_sheet/chord_lyrics_pair';
import SoftLineBreak from '../../chord_sheet/soft_line_break';
import { LineLayout, MeasuredItem } from './types';
import { ItemProcessor } from './item_processor';
import { LayoutFactory } from './layout_factory';

/**
 * Handles breaking lines into layouts based on available width
 */
export class LineBreaker {
  private readonly itemProcessor: ItemProcessor;

  private readonly layoutFactory: LayoutFactory;

  constructor(itemProcessor: ItemProcessor, layoutFactory: LayoutFactory) {
    this.itemProcessor = itemProcessor;
    this.layoutFactory = layoutFactory;
  }

  /**
   * Break a line into layouts that fit within the available width
   */
  breakLineIntoLayouts(line: Line, availableWidth: number, lyricsOnly = false): LineLayout[] {
    const measuredItems = this.itemProcessor.measureLineItems(line, lyricsOnly);
    const lines: LineLayout[] = [];
    let currentLine: MeasuredItem[] = [];
    let currentWidth = 0;
    let lastSoftLineBreakIndex = -1;
    let i = 0;

    while (i < measuredItems.length) {
      let item = measuredItems[i];
      let itemWidth = item.width;

      if (currentWidth + itemWidth > availableWidth) {
        // Handle overflow - line needs to break
        let breakIndex = -1;

        if (lastSoftLineBreakIndex >= 0) {
          // Break at the last soft line break
          breakIndex = lastSoftLineBreakIndex;
          currentLine.splice(breakIndex, 1); // Remove the soft line break
          currentWidth = currentLine.reduce((sum, mi) => sum + mi.width, 0);
        } else if (itemWidth > availableWidth) {
          // Item itself is wider than available width, split it
          const [firstPart, secondPart] = this.itemProcessor.splitMeasuredItem(item, availableWidth - currentWidth);
          if (secondPart) {
            measuredItems.splice(i + 1, 0, secondPart);
          }
          item = firstPart;
          itemWidth = item.width;
          currentLine.push(item);
          currentWidth += itemWidth;
          i += 1;
          breakIndex = currentLine.length;
        } else if (currentLine.length === 0) {
          // Can't break an empty line, just add the item
          currentLine.push(item);
          currentWidth += itemWidth;
          i += 1;
          breakIndex = currentLine.length;
        } else {
          // Break at the current position
          breakIndex = currentLine.length;
        }

        if (breakIndex >= 0) {
          // Create a new line and handle any remaining items
          const lineItems = currentLine.slice(0, breakIndex);
          const lastItem = lineItems[lineItems.length - 1];

          // Handle trailing commas
          if (lastItem?.item instanceof ChordLyricsPair && lastItem.item.lyrics?.endsWith(',')) {
            lastItem.item.lyrics = lastItem.item.lyrics.slice(0, -1) || '';
            lastItem.width = this.remeasureLyrics(lastItem);
          }

          // Create line layout with the items
          lines.push(this.layoutFactory.createLineLayout(lineItems, line));

          // Set up for the next line
          currentLine = currentLine.slice(breakIndex);
          currentWidth = currentLine.reduce((sum, mi) => sum + mi.width, 0);
          lastSoftLineBreakIndex = -1;

          // Capitalize next item's lyrics
          this.capitalizeNextItem(currentLine, measuredItems, i);
        }
      } else {
        // Item fits on the current line
        currentLine.push(item);
        currentWidth += itemWidth;
        if (item.item instanceof SoftLineBreak) {
          lastSoftLineBreakIndex = currentLine.length - 1;
        }
        i += 1;
      }
    }

    // Add any remaining items as the last line
    if (currentLine.length > 0) {
      lines.push(this.layoutFactory.createLineLayout(currentLine, line));
    }

    return lines;
  }

  /**
   * Remeasure the width of lyrics after modification
   */
  private remeasureLyrics(item: MeasuredItem): number {
    if (item.item instanceof ChordLyricsPair) {
      return this.itemProcessor.measurer.measureTextWidth(
        item.item.lyrics || '',
        this.itemProcessor.config.fonts.lyrics,
      );
    }
    return item.width;
  }

  /**
   * Capitalize the first letter of the next item with lyrics
   */
  private capitalizeNextItem(currentLine: MeasuredItem[], measuredItems: MeasuredItem[], index: number): void {
    const nextItemWithLyrics = this.itemProcessor.findNextItemWithLyrics(currentLine, measuredItems, index);
    if (nextItemWithLyrics && nextItemWithLyrics.item instanceof ChordLyricsPair) {
      const currentLyrics = nextItemWithLyrics.item.lyrics ?? '';
      nextItemWithLyrics.item.lyrics = this.itemProcessor.capitalizeFirstWord(currentLyrics);
      nextItemWithLyrics.width = this.remeasureLyrics(nextItemWithLyrics);
    }
  }
}
