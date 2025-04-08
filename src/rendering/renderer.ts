import Song from '../chord_sheet/song';
import Line from '../chord_sheet/line';
import { ChordLyricsPair, Tag, SoftLineBreak } from '../index';
import { LineLayout, MeasuredItem } from '../layout/engine';
import { FontConfiguration } from '../formatter/configuration';
import { isColumnBreak, isComment, renderChord } from '../template_helpers';

/**
 * Interface representing paragraph layouts from the layout engine
 */
export interface ParagraphLayout {
  units: LineLayout[][];
  addSpacing: boolean;
}

/**
 * PositionedElement represents an element with absolute positioning
 */
export interface PositionedElement {
  x: number;
  y: number;
  width: number;
  height: number;
  content: any;
  type: string;
  style?: any;
  page: number;
  column: number;
}

/**
 * Abstract renderer class for absolute-positioned rendering
 */
abstract class Renderer {
  protected song: Song;

  protected startTime = 0;

  protected renderTime = 0;

  // Absolute positioning coordinates
  protected x = 0;

  protected y = 0;

  protected currentColumn = 1;

  // Column/page management
  protected elements: PositionedElement[] = [];

  protected currentPage = 1;

  constructor(song: Song) {
    this.song = song;
    this.startTime = performance.now();
  }

  //
  // PUBLIC API - Methods that formatters will call
  //

  /**
   * Initialize the renderer with the song
   */
  initialize(): void {
    this.x = this.getMinX();
    this.y = this.getMinY();
    this.currentColumn = 1;
    this.currentPage = 1;
    this.elements = [];
    this.initializeBackend();
  }

  /**
   * Main render method - the only method that formatters should call
   * @param paragraphLayouts The layouts to render
   * @param config Additional configuration options
   */
  render(paragraphLayouts: ParagraphLayout[], _config?: any): void {
    this.initialize();

    // Render the main content
    this.renderParagraphs(paragraphLayouts);

    // Render supplementary content
    this.renderChordDiagrams();

    // Render headers and footers
    this.renderHeadersAndFooters();

    // Finalize the rendering (commit elements to output)
    this.finalizeRendering();

    // Record rendering time
    this.recordRenderingTime();
  }

  /**
   * Get the bottom Y position available for content
   */
  getContentBottomY(): number {
    return this.getColumnBottomY();
  }

  /**
   * Get metadata about the rendered document
   */
  abstract getDocumentMetadata(): Record<string, any>;

  /**
   * Get the font configuration for a specific object type
   */
  abstract getFontConfiguration(objectType: string): FontConfiguration;

  /**
   * Get the current rendering time in seconds
   */
  getRenderTime(): number {
    return this.renderTime;
  }

  //
  // PROTECTED METHODS - Core rendering logic for absolute positioned elements
  //

  /**
   * Renders all paragraph layouts
   */
  protected renderParagraphs(paragraphLayouts: ParagraphLayout[]): void {
    paragraphLayouts.forEach((layout) => {
      layout.units.forEach((lines) => {
        this.renderLines(lines);
      });

      if (layout.addSpacing) {
        this.y += this.getParagraphSpacing();
      }
    });
  }

  /**
   * Render lines of content with chords, lyrics, and other elements
   */
  protected renderLines(lines: LineLayout[]): void {
    lines.forEach((lineLayout) => {
      const { items, lineHeight, line } = lineLayout;

      // Filter items that are column breaks and handle them first
      const hasColumnBreak = items.length === 1 && items[0].item instanceof Tag && isColumnBreak(items[0].item);
      if (hasColumnBreak) {
        this.moveToNextColumn();
        return; // Skip to the next iteration of lines
      }

      // Check if the line will fit in the current column
      if (this.y + lineHeight > this.getColumnBottomY()) {
        this.moveToNextColumn();
      }

      const yOffset = this.y;
      const { chordsYOffset, lyricsYOffset } = this.calculateChordLyricYOffsets(items, yOffset);

      let currentX = this.x;

      // Process each item in the line
      items.forEach((measuredItem) => {
        const { item, width } = measuredItem;

        if (item instanceof ChordLyricsPair) {
          let { chords } = item;
          const { lyrics } = item;

          if (chords) {
            chords = this.processChords(chords, line as Line);
          }

          // Add chord element if not lyrics-only mode
          if (!this.isLyricsOnly() && chords) {
            const chordBaseline = this.calculateChordBaseline(chordsYOffset, items, chords);
            this.addTextElement(chords, currentX, chordBaseline, 'chord');
          }

          // Always add lyrics if present
          if (lyrics && lyrics.trim() !== '') {
            this.addTextElement(lyrics, currentX, lyricsYOffset, 'lyrics');
          }
        } else if (item instanceof Tag) {
          if (item.isSectionDelimiter()) {
            this.addSectionLabel(item.label, currentX, yOffset);
          } else if (isComment(item)) {
            this.addComment(item.value, currentX, yOffset);
          }
        } else if (item instanceof SoftLineBreak) {
          this.addTextElement(item.content, currentX, lyricsYOffset, 'lyrics');
        }

        currentX += width;
      });

      // Update the vertical position after rendering the line
      this.y += lineHeight;

      // Reset x to the left margin for the next line
      this.x = this.getColumnStartX();
    });
  }

  /**
   * Move to the next column or page
   */
  protected moveToNextColumn(): void {
    this.currentColumn += 1;

    if (this.currentColumn > this.getColumnCount()) {
      this.startNewPage();
      this.currentColumn = 1;
    }

    this.x = this.getColumnStartX();
    this.y = this.getMinY();
  }

  /**
   * Start a new page
   */
  protected startNewPage(): void {
    this.currentPage += 1;
    this.createNewPage();
  }

  /**
   * Calculate chord and lyrics Y offsets based on the line content
   */
  protected calculateChordLyricYOffsets(
    items: MeasuredItem[],
    yOffset: number,
  ): { chordsYOffset: number; lyricsYOffset: number } {
    // Determine line types
    const hasChords = items.some(({ item }) => item instanceof ChordLyricsPair && item.chords);
    const hasLyrics = items.some(
      ({ item }) => item instanceof ChordLyricsPair && item.lyrics && item.lyrics.trim() !== '',
    );

    let chordsYOffset = yOffset;
    let lyricsYOffset = yOffset;
    const chordLyricSpacing = this.getChordLyricSpacing();

    if (hasChords && hasLyrics) {
      chordsYOffset = yOffset;
      lyricsYOffset = chordsYOffset + this.getMaxChordHeight(items) + chordLyricSpacing;
    } else if (hasChords && !hasLyrics) {
      chordsYOffset = yOffset;
    } else if (!hasChords && hasLyrics) {
      lyricsYOffset = yOffset;
    }

    return { chordsYOffset, lyricsYOffset };
  }

  /**
   * Get the maximum chord height for a line
   */
  protected getMaxChordHeight(items: MeasuredItem[]): number {
    return items.reduce((maxHeight, { chordHeight }) => Math.max(maxHeight, chordHeight || 0), 0);
  }

  /**
   * Process chords for display (handle modifiers, normalization)
   */
  protected processChords(chords: string, line: Line): string {
    return renderChord(
      chords,
      line,
      this.song,
      {
        renderKey: null,
        useUnicodeModifier: this.useUnicodeModifiers(),
        normalizeChords: this.normalizeChords(),
        decapo: this.getConfiguration().decapo,
      },
    );
  }

  /**
   * Add a text element to the elements array
   */
  protected addTextElement(text: string, x: number, y: number, type: string): void {
    const font = this.getFontForType(type);
    const { width, height } = this.measureText(text, font);

    this.elements.push({
      x,
      y,
      width,
      height,
      content: text,
      type,
      style: font,
      page: this.currentPage,
      column: this.currentColumn,
    });
  }

  /**
   * Add a section label element
   */
  protected addSectionLabel(label: string, x: number, y: number): void {
    this.addTextElement(label, x, y, 'sectionLabel');
  }

  /**
   * Add a comment element
   */
  protected addComment(comment: string, x: number, y: number): void {
    this.addTextElement(comment, x, y, 'comment');
  }

  /**
   * Get the font configuration for a specific element type
   */
  protected getFontForType(type: string): FontConfiguration {
    switch (type) {
      case 'chord':
        return this.getFontConfiguration('chord');
      case 'lyrics':
        return this.getFontConfiguration('text');
      case 'sectionLabel':
        return this.getFontConfiguration('sectionLabel');
      case 'comment':
        return this.getFontConfiguration('comment');
      default:
        return this.getFontConfiguration('text');
    }
  }

  /**
   * Get the total number of pages in the document
   */
  protected getTotalPages(): number {
    return this.currentPage;
  }

  /**
   * Get the starting X position for the current column
   */
  protected getColumnStartX(): number {
    const marginLeft = this.getLeftMargin();
    const columnWidth = this.getColumnWidth();
    const columnSpacing = this.getColumnSpacing();

    return marginLeft + (this.currentColumn - 1) * (columnWidth + columnSpacing);
  }

  /**
   * Get the bottom Y position for the current column
   */
  protected getColumnBottomY(): number {
    return this.getPageHeight() - this.getBottomMargin() - this.getFooterHeight();
  }

  /**
   * Get the width of a column
   */
  protected getColumnWidth(): number {
    const availableWidth = this.getPageWidth() - this.getLeftMargin() - this.getRightMargin();
    const columnCount = this.getColumnCount();
    const columnSpacing = this.getColumnSpacing();

    return (availableWidth - (columnCount - 1) * columnSpacing) / columnCount;
  }

  /**
   * Get the minimum X coordinate (left margin)
   */
  protected getMinX(): number {
    return this.getLeftMargin();
  }

  /**
   * Get the minimum Y coordinate (top margin + header)
   */
  protected getMinY(): number {
    return this.getTopMargin() + this.getHeaderHeight();
  }

  /**
   * Record the rendering time
   */
  protected recordRenderingTime(): void {
    const endTime = performance.now();
    this.renderTime = (endTime - this.startTime) / 1000;
    // eslint-disable-next-line no-console
    console.log(`Rendered in ${this.renderTime.toFixed(2)} seconds`);
  }

  /**
   * Get the elements for a specific page
   */
  protected getElementsForPage(page: number): PositionedElement[] {
    return this.elements.filter((element) => element.page === page);
  }

  //
  // ABSTRACT METHODS - Must be implemented by concrete renderers
  //

  /**
   * Initialize the backend rendering system
   */
  protected abstract initializeBackend(): void;

  /**
   * Create a new page in the backend
   */
  protected abstract createNewPage(): void;

  /**
   * Render chord diagrams
   */
  protected abstract renderChordDiagrams(): void;

  /**
   * Render headers and footers
   */
  protected abstract renderHeadersAndFooters(): void;

  /**
   * Measure text with the given font
   */
  protected abstract measureText(text: string, font: FontConfiguration): { width: number; height: number };

  /**
   * Calculate chord baseline position
   */
  protected abstract calculateChordBaseline(yOffset: number, items: MeasuredItem[], chordText: string): number;

  /**
   * Finalize the rendering process
   */
  protected abstract finalizeRendering(): void;

  //
  // CONFIGURATION GETTERS - Must be implemented by concrete renderers
  //

  protected abstract getConfiguration(): any;

  /**
   * Get the page width
   */
  protected abstract getPageWidth(): number;

  /**
   * Get the page height
   */
  protected abstract getPageHeight(): number;

  /**
   * Get the left margin
   */
  protected abstract getLeftMargin(): number;

  /**
   * Get the right margin
   */
  protected abstract getRightMargin(): number;

  /**
   * Get the top margin
   */
  protected abstract getTopMargin(): number;

  /**
   * Get the bottom margin
   */
  protected abstract getBottomMargin(): number;

  /**
   * Get the header height
   */
  protected abstract getHeaderHeight(): number;

  /**
   * Get the footer height
   */
  protected abstract getFooterHeight(): number;

  /**
   * Get the column count
   */
  protected abstract getColumnCount(): number;

  /**
   * Get the column spacing
   */
  protected abstract getColumnSpacing(): number;

  /**
   * Get the chord-to-lyrics spacing
   */
  protected abstract getChordLyricSpacing(): number;

  /**
   * Get the paragraph spacing
   */
  protected abstract getParagraphSpacing(): number;

  /**
   * Whether to use Unicode modifiers for chord rendering
   */
  protected abstract useUnicodeModifiers(): boolean;

  /**
   * Whether to normalize chords
   */
  protected abstract normalizeChords(): boolean;

  /**
   * Whether to render lyrics only (no chords)
   */
  protected abstract isLyricsOnly(): boolean;
}

export default Renderer;
