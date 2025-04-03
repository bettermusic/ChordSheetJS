import { Measurer } from '../measurement/measurer';
import Song from '../../chord_sheet/song';
import Paragraph from '../../chord_sheet/paragraph';
import {
  LineLayout, LayoutConfig, ParagraphLayoutResult,
} from './types';
import {
  calculateTotalHeight,
  isColumnBreakLayout,
} from './layout_helpers';
import { ParagraphSplitter } from './paragraph_splitter';
import { ItemProcessor } from './item_processor';
import { LayoutFactory } from './layout_factory';
import { LineBreaker } from './line_breaker';
import { lineHasContents } from '../../template_helpers';

/**
 * Engine for layout calculations
 */
export class LayoutEngine {
  private paragraphSplitter: ParagraphSplitter;

  private itemProcessor: ItemProcessor;

  private layoutFactory: LayoutFactory;

  private lineBreaker: LineBreaker;

  constructor(
    private song: Song,
    private measurer: Measurer,
    private config: LayoutConfig,
  ) {
    // Initialize component classes
    this.itemProcessor = new ItemProcessor(this.measurer, this.config, this.song);
    this.layoutFactory = new LayoutFactory(config);
    this.lineBreaker = new LineBreaker(this.itemProcessor, this.layoutFactory);
    this.paragraphSplitter = new ParagraphSplitter();
  }

  /**
   * Compute layouts for all paragraphs in the song
   */
  public computeParagraphLayouts(): ParagraphLayoutResult[] {
    const layouts: ParagraphLayoutResult[] = [];

    // Initialize position tracking
    let currentY = this.config.minY;
    let currentColumn = 1;

    this.song.bodyParagraphs.forEach((paragraph) => {
      // Create initial paragraph layout
      const lineLayouts = this.computeParagraphLayout(
        paragraph,
        this.config.columnWidth,
        this.config.displayLyricsOnly,
      );

      // Count line types for analysis
      const countChordLyricPairLines = lineLayouts.flat().filter(
        (ll) => ll.type === 'ChordLyricsPair',
      ).length;

      const countNonLyricLines = lineLayouts.flat().filter(
        (ll) => ll.type === 'Comment' || ll.type === 'SectionLabel',
      ).length;

      // Skip empty paragraphs in lyrics-only mode
      const skipParagraph = (
        countNonLyricLines === 1 &&
        countChordLyricPairLines === 0 &&
        this.config.displayLyricsOnly
      );

      if (!skipParagraph) {
        // Determine if column breaks are needed
        const totalHeight = calculateTotalHeight(lineLayouts);

        // Check if the entire paragraph fits in the current column
        let adjustedLayouts: LineLayout[][] = lineLayouts;

        if (currentY + totalHeight > this.config.columnBottomY) {
          // Paragraph doesn't fit entirely, use paragraph splitter
          adjustedLayouts = this.paragraphSplitter.splitParagraph(
            lineLayouts,
            currentY,
            this.config.minY,
            this.config.columnBottomY,
            countChordLyricPairLines,
          );
        }

        // Update simulated position based on content
        adjustedLayouts.forEach((lines) => {
          if (isColumnBreakLayout(lines)) {
            // Simulate column break
            currentColumn += 1;
            if (currentColumn > this.config.columnCount) {
              currentColumn = 1;
            }
            currentY = this.config.minY;
          } else {
            // Calculate height and update position
            const linesHeight = lines.reduce((sum, l) => sum + l.lineHeight, 0);
            currentY += linesHeight;
          }
        });

        // Add paragraph spacing in simulation
        currentY += this.config.paragraphSpacing;

        layouts.push({
          units: adjustedLayouts,
          addSpacing: true,
          sectionType: paragraph.type,
        });
      }
    });

    return layouts;
  }

  /**
   * Compute layout for a single paragraph
   */
  private computeParagraphLayout(
    paragraph: Paragraph,
    availableWidth: number,
    lyricsOnly = false,
  ): LineLayout[][] {
    const paragraphLineLayouts: LineLayout[][] = [];

    paragraph.lines.forEach((line) => {
      if (lineHasContents(line)) {
        // Delegate to LineBreaker
        const lineLayouts = this.lineBreaker.breakLineIntoLayouts(line, availableWidth, lyricsOnly);
        paragraphLineLayouts.push(lineLayouts);
      }
    });

    return paragraphLineLayouts;
  }
}
