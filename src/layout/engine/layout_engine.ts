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
import { isComment, isTag, lineHasContents } from '../../template_helpers';
import Tag from '../../chord_sheet/tag';
import SoftLineBreak from '../../chord_sheet/soft_line_break';
import Item from '../../chord_sheet/item';

/**
 * Cache entry for repeated sections
 */
interface SectionCacheEntry {
  label: string;
  paragraphLayouts: LineLayout[][];
}

/**
 * Engine for layout calculations
 */
export class LayoutEngine {
  private paragraphSplitter: ParagraphSplitter;

  private itemProcessor: ItemProcessor;

  private layoutFactory: LayoutFactory;

  private lineBreaker: LineBreaker;

  private sectionCache: Map<string, SectionCacheEntry> = new Map<string, SectionCacheEntry>();

  constructor(
    private song: Song,
    private measurer: Measurer,
    private config: LayoutConfig,
  ) {
    // Process repeated sections before layout computation
    this.processRepeatedSections();

    // Initialize component classes
    this.itemProcessor = new ItemProcessor(this.measurer, this.config, this.song);
    this.layoutFactory = new LayoutFactory(config);
    this.lineBreaker = new LineBreaker(this.itemProcessor, this.layoutFactory);
    this.paragraphSplitter = new ParagraphSplitter();
  }

  /**
   * Normalize section label by removing repeat indicators like "(2x)", "(3x)", etc.
   * @param label The section label to normalize
   * @returns The normalized label
   */
  private normalizeSectionLabel(label: string | null): string | null {
    if (!label) return null;

    // Remove patterns like "(2x)", "(3x)", "(repeat)", etc.
    return label
      .replace(/\s*\([^)]*(?:x|\d+|repeat|rep)\s*[^)]*\)\s*$/i, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_');
  }

  /**
   * Get the cache key for a section based on its normalized label
   * @param paragraph The paragraph to get the cache key for
   * @returns The cache key or null if the paragraph doesn't have a label
   */
  private getSectionCacheKey(paragraph: Paragraph): string | null {
    let label: string | null = null;

    // First check if paragraph has a label
    if (paragraph.label) {
      label = paragraph.label;
    } else if (paragraph.lines.length > 0) {
      // Check the first line for a tag item
      const firstLine = paragraph.lines[0];
      const firstItem = firstLine.items[0];
      if (firstItem && isTag(firstItem)) {
        if (isComment(firstItem as Tag) || (firstItem as Tag).isSectionDelimiter()) {
          const tag = firstItem as Tag;
          label = tag.label || tag.value;
        }
      }
    }

    const normalizedLabel = this.normalizeSectionLabel(label);
    return normalizedLabel ?? null;
  }

  /**
   * Process repeated sections by modifying the song's bodyParagraphs array
   * This is called in the constructor to preprocess the song before layout computation
   */
  private processRepeatedSections(): void {
    if (!this.config.repeatedSections) {
      return; // No processing needed
    }

    const sectionCache = new Map<string, Paragraph>();
    const processedParagraphs: Paragraph[] = [];
    const skipIndices = new Set<number>();

    // Get the current bodyParagraphs to ensure they are computed
    const currentBodyParagraphs = this.song.clone().bodyParagraphs;

    currentBodyParagraphs.forEach((paragraph, index) => {
      // Check if this index should be skipped
      if (skipIndices.has(index)) {
        return;
      }

      const cacheKey = this.getSectionCacheKey(paragraph);

      if (!cacheKey) {
        // No cache key, keep paragraph as-is
        processedParagraphs.push(paragraph);
        return;
      }

      const cachedParagraph = sectionCache.get(cacheKey);

      if (!cachedParagraph) {
        // First occurrence - cache the paragraph and keep it
        sectionCache.set(cacheKey, paragraph);
        processedParagraphs.push(paragraph);
        return;
      }

      // Handle repeated section based on configuration
      switch (this.config.repeatedSections) {
        case 'hide':
          // Skip this paragraph entirely
          break;

        case 'title_only': {
          // Create a paragraph with only the section label
          let titleParagraph = { ...paragraph } as Paragraph;

          // Find consecutive cached sections to consolidate
          const consolidatedTitles: Paragraph[] = [titleParagraph];
          let nextIndex = index + 1;

          // Recursively check next paragraphs
          while (nextIndex < currentBodyParagraphs.length) {
            const nextParagraph = currentBodyParagraphs[nextIndex];
            const nextCacheKey = this.getSectionCacheKey(nextParagraph);

            if (nextCacheKey && sectionCache.has(nextCacheKey)) {
              // Add this paragraph to consolidation and mark for skipping
              const nextTitleParagraph = this.createTitleOnlyParagraph(nextParagraph);
              consolidatedTitles.push(nextTitleParagraph);
              skipIndices.add(nextIndex);

              nextIndex += 1;
            } else {
              // Found a non-cached paragraph, stop consolidation
              break;
            }
          }

          // Create consolidated paragraph if we found multiple titles
          if (consolidatedTitles.length > 1) {
            const consolidatedParagraph = { ...consolidatedTitles[0] } as Paragraph;

            if (consolidatedParagraph.lines.length > 0) {
              // Add all subsequent titles with separators
              for (let i = 1; i < consolidatedTitles.length; i += 1) {
                titleParagraph = consolidatedTitles[i];
                if (titleParagraph.lines.length > 0) {
                  const separatorItems = [
                    new SoftLineBreak(' '),
                    new Tag('comment', ' > '),
                    new SoftLineBreak(' '),
                  ] as Item[];

                  consolidatedParagraph.lines[0].items.push(...separatorItems);
                  consolidatedParagraph.lines[0].items.push(...titleParagraph.lines[0].items);
                }
              }
            }

            processedParagraphs.push(consolidatedParagraph);
          } else {
            processedParagraphs.push(titleParagraph);
          }
          break;
        }

        case 'lyrics_only':
          // Keep the paragraph but it will be processed with lyrics-only in layout
          // This is where we'll update the config to set lyricsOnly = true
          // for this specific paragraph identifier
          processedParagraphs.push(paragraph);
          break;

        case 'full': {
          // Get the original cached paragraph and merge in lines after the first one
          const mergedParagraph = { ...cachedParagraph } as Paragraph;

          // If the first line of the current paragraph is a tag, merge in the remaining lines
          if (paragraph.lines.length >= 1) {
            const firstLine = paragraph.lines[0];
            const firstItem = firstLine.items[0];

            if (firstItem && isTag(firstItem)) {
              // Merge the current paragraph's first line with the cached paragraph's lines (excluding the first line)
              mergedParagraph.lines = [paragraph.lines[0], ...cachedParagraph.lines.slice(1)];
            } else {
              // If first line isn't a tag, merge all current lines with cached lines excluding first
              mergedParagraph.lines = [...paragraph.lines, ...cachedParagraph.lines.slice(1)];
            }
          }

          processedParagraphs.push(mergedParagraph);
          break;
        }

        default:
          // Should not reach here, but keep paragraph as fallback
          processedParagraphs.push(paragraph);
          break;
      }
    });

    // Replace the cached bodyParagraphs by directly modifying the private property
    (this.song as any).renderParagraphs = processedParagraphs;
    this.sectionCache.clear();
  }

  /**
   * Create a new paragraph containing only the section title/label
   * @param originalParagraph The original paragraph to extract the title from
   * @returns A new paragraph with only the title
   */
  private createTitleOnlyParagraph(originalParagraph: Paragraph): Paragraph {
    // Clone the original paragraph
    const titleParagraph = originalParagraph;

    // Keep only the first line if it exists
    if (titleParagraph.lines.length > 0) {
      const firstLine = titleParagraph.lines[0];
      titleParagraph.lines = [firstLine];
    }

    return titleParagraph;
  }

  /**
   * Compute layouts for all paragraphs in the song
   */
  public computeParagraphLayouts(): ParagraphLayoutResult[] {
    const layouts: ParagraphLayoutResult[] = [];

    // Initialize position tracking
    let currentY = this.config.minY;
    let currentColumn = 1;

    this.song.renderParagraphs.forEach((paragraph) => {
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
            if (currentColumn > (this.config.columnCount || 1)) {
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
