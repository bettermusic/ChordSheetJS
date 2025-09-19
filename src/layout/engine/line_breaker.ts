import ChordLyricsPair from '../../chord_sheet/chord_lyrics_pair';
import { ItemProcessor } from './item_processor';
import { LayoutFactory } from './layout_factory';
import Line from '../../chord_sheet/line';
import SoftLineBreak from '../../chord_sheet/soft_line_break';
import { LineLayout, MeasuredItem } from './types';

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
    const rawMeasuredItems = this.itemProcessor.measureLineItems(line, lyricsOnly);
    const measuredItems = this.consolidateConsecutiveSoftBreaks(rawMeasuredItems);
    return this.breakContent(measuredItems, availableWidth, line);
  }

  /**
   * Recursively break content into layouts that fit within the available width
   */
  private breakContent(items: MeasuredItem[], availableWidth: number, line: Line | null): LineLayout[] {
    if (items.length === 0) {
      return [];
    }

    const totalWidth = items.reduce((sum, mi) => sum + mi.width, 0);

    if (totalWidth <= availableWidth) {
      return [this.layoutFactory.createLineLayout(items, line as Line)];
    }

    // Find soft line break indices
    const softBreakIndices = items
      .map((item, idx) => (item.item instanceof SoftLineBreak ? idx : -1))
      .filter((idx) => idx !== -1);

    if (softBreakIndices.length === 0) {
      return this.handleNoSoftBreaks(items, availableWidth, line);
    }

    // Calculate the middle of the entire content
    const targetWidth = totalWidth / 2;

    // Find the soft break closest to the middle of the total content
    const breakOptions = softBreakIndices.map((idx) => ({
      index: idx,
      widthUpToBreak: this.getWidthUpToIndex(items, idx + 1),
    }));
    const bestBreak = breakOptions.reduce((best, current) => (
      Math.abs(current.widthUpToBreak - targetWidth) < Math.abs(best.widthUpToBreak - targetWidth) ?
        current :
        best
    ));

    // Split into two chunks
    const firstChunk = items.slice(0, bestBreak.index);
    const secondChunk = items.slice(bestBreak.index + 1); // Skip the soft break

    // Handle trailing comma in first chunk
    const lastFirstItem = firstChunk[firstChunk.length - 1];
    if (lastFirstItem?.item instanceof ChordLyricsPair && lastFirstItem.item.lyrics?.endsWith(',')) {
      lastFirstItem.item.lyrics = lastFirstItem.item.lyrics.slice(0, -1) || '';
      lastFirstItem.width = this.remeasureLyrics(lastFirstItem);
    }

    // Capitalize second chunk's first lyrics
    this.capitalizeNextItem(secondChunk, secondChunk, 0);

    // Recursively process each chunk
    return [
      ...this.breakContent(firstChunk, availableWidth, line),
      ...this.breakContent(secondChunk, availableWidth, line),
    ];
  }

  /**
   * Handle content with no soft breaks
   */
  private handleNoSoftBreaks(items: MeasuredItem[], availableWidth: number, line: Line | null): LineLayout[] {
    let currentWidth = 0;
    let breakIndex = 0;

    for (let i = 0; i < items.length; i += 1) {
      if (currentWidth + items[i].width > availableWidth) {
        breakIndex = i;
        break;
      }
      currentWidth += items[i].width;
    }

    if (breakIndex === 0 && items[0].width > availableWidth) {
      const [firstPart, secondPart] = this.itemProcessor.splitMeasuredItem(items[0], availableWidth);
      const remainingItems = secondPart ? [secondPart, ...items.slice(1)] : items.slice(1);
      return [
        this.layoutFactory.createLineLayout([firstPart], line as Line),
        ...this.breakContent(remainingItems, availableWidth, line),
      ];
    }

    if (breakIndex === 0) {
      return [this.layoutFactory.createLineLayout(items, line as Line)];
    }

    const firstChunk = items.slice(0, breakIndex);
    const secondChunk = items.slice(breakIndex);

    // Handle trailing comma
    const lastFirstItem = firstChunk[firstChunk.length - 1];
    if (lastFirstItem?.item instanceof ChordLyricsPair && lastFirstItem.item.lyrics?.endsWith(',')) {
      lastFirstItem.item.lyrics = lastFirstItem.item.lyrics.slice(0, -1) || '';
      lastFirstItem.width = this.remeasureLyrics(lastFirstItem);
    }

    return [
      this.layoutFactory.createLineLayout(firstChunk, line as Line),
      ...this.breakContent(secondChunk, availableWidth, line),
    ];
  }

  /**
   * Consolidate consecutive soft line breaks into single breaks
   */
  private consolidateConsecutiveSoftBreaks(items: MeasuredItem[]): MeasuredItem[] {
    const consolidated: MeasuredItem[] = [];
    let i = 0;

    while (i < items.length) {
      const item = items[i];

      if (item.item instanceof SoftLineBreak) {
        consolidated.push(item);
        while (i + 1 < items.length && items[i + 1].item instanceof SoftLineBreak) {
          i += 1;
        }
      } else {
        consolidated.push(item);
      }
      i += 1;
    }

    return consolidated;
  }

  /**
   * Calculate the total width of items up to (but not including) the given index
   */
  private getWidthUpToIndex(items: MeasuredItem[], index: number): number {
    let width = 0;
    for (let i = 0; i < index && i < items.length; i += 1) {
      width += items[i].width;
    }
    return width;
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
   * Recalculate the full chord-lyric pair width (similar to ItemProcessor logic)
   */
  private recalculateChordLyricWidth(item: MeasuredItem, nextItem: MeasuredItem | null = null): number {
    if (!(item.item instanceof ChordLyricsPair)) {
      return item.width;
    }

    const pair = item.item;
    const chords = pair.chords || '';
    const lyrics = pair.lyrics || '';

    // Get font configurations
    const chordFont = this.itemProcessor.config.fonts.chord;
    const lyricsFont = this.itemProcessor.config.fonts.lyrics;

    // Measure chord and lyrics widths
    const chordWidth = chords ? this.itemProcessor.measurer.measureTextWidth(chords, chordFont) : 0;
    const lyricsWidth = lyrics ? this.itemProcessor.measurer.measureTextWidth(lyrics, lyricsFont) : 0;

    // Check if next item has chords (for spacing logic)
    const nextItemHasChords = nextItem &&
      nextItem.item instanceof ChordLyricsPair &&
      (nextItem.item as ChordLyricsPair).chords?.trim() !== '';

    // Apply chord spacing logic (same as ItemProcessor.processChordLyricsPair)
    let adjustedChordWidth = chordWidth;
    if (!this.itemProcessor.config.displayLyricsOnly && nextItemHasChords && chordWidth > 0) {
      const spaceWidth = this.itemProcessor.measurer.measureTextWidth(' ', lyricsFont);
      if (chordWidth >= (lyricsWidth - spaceWidth)) {
        const spacing = ' '.repeat(this.itemProcessor.config.chordSpacing);
        adjustedChordWidth = this.itemProcessor.measurer.measureTextWidth(chords + spacing, chordFont);
      }
    }

    // Return the maximum width (same logic as in ItemProcessor.processChordLyricsPair)
    return Math.max(adjustedChordWidth, lyricsWidth);
  }

  /**
   * Capitalize the first letter of the next item with lyrics
   */
  private capitalizeNextItem(currentLine: MeasuredItem[], measuredItems: MeasuredItem[], index: number): void {
    const nextItemWithLyrics = this.itemProcessor.findNextItemWithLyrics(currentLine, measuredItems, index);
    if (nextItemWithLyrics && nextItemWithLyrics.item instanceof ChordLyricsPair) {
      const currentLyrics = nextItemWithLyrics.item.lyrics ?? '';
      nextItemWithLyrics.item.lyrics = this.itemProcessor.capitalizeFirstWord(currentLyrics);

      // Find the next item after this one to determine if it has chords (for spacing logic)
      const nextItemIndex = measuredItems.indexOf(nextItemWithLyrics);
      const itemAfterNext = nextItemIndex >= 0 && nextItemIndex < measuredItems.length - 1 ?
        measuredItems[nextItemIndex + 1] :
        null;

      // Recalculate the full chord-lyric pair width, considering spacing
      nextItemWithLyrics.width = this.recalculateChordLyricWidth(nextItemWithLyrics, itemAfterNext);
    }
  }
}
