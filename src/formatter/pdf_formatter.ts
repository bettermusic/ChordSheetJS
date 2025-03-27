import { Blob } from 'buffer';
import JsPDF from 'jspdf';
import { Performance } from 'perf_hooks';

import ChordDefinition, { isNonSoundingString, isOpenFret } from '../chord_definition/chord_definition';
import ChordDiagram, { Barre, StringMarker } from '../chord_diagram/chord_diagram';
import Configuration, { defaultConfiguration } from './configuration';
import Dimensions from './pdf_formatter/dimensions';
import Formatter from './formatter';
import JsPDFRenderer from '../chord_diagram/js_pdf_renderer';
import Line from '../chord_sheet/line';
import Song from '../chord_sheet/song';
import defaultPDFConfiguration from './pdf_formatter/default_configuration';
import {
  ChordLyricsPair,
  JsPdfMeasurer,
  SoftLineBreak,
  Tag,
} from '../index';
import {
  FingerNumber,
  Fret,
  FretNumber,
  StringNumber,
} from '../constants';
import { getCapos } from '../helpers';
import Condition from './pdf_formatter/condition';

import {
  isColumnBreak,
  isComment,
  renderChord,
} from '../template_helpers';

import {
  Alignment,
  FontConfiguration,
  LayoutContentItem,
  LayoutContentItemWithImage,
  LayoutContentItemWithLine,
  LayoutContentItemWithText,
  LayoutItem,
  LayoutSection,
  Margins,
  MeasuredItem,
  PDFConfiguration,
  PdfConstructor,
} from './pdf_formatter/types';

import DocWrapper from './pdf_formatter/doc_wrapper';
import ChordProParser from '../parser/chord_pro_parser';
import TextFormatter from './text_formatter';
import Metadata from '../chord_sheet/metadata';
import { LayoutEngine } from './layout/layout_engine';
import { LayoutConfig, LineLayout } from './layout';

declare const performance: Performance;

type ExtendedMetadata = Record<string, number | string | string[]>;

interface ParagraphLayout {
  units: LineLayout[][];
  addSpacing: boolean;
}

class PdfFormatter extends Formatter {
  song: Song = new Song();

  y = 0;

  paragraphY = 0;

  x = 0;

  doc: DocWrapper = DocWrapper.setup(JsPDF);

  startTime = 0;

  currentColumn = 1;

  configuration: Configuration = defaultConfiguration;

  pdfConfiguration: PDFConfiguration = defaultPDFConfiguration;

  margins: Margins = defaultPDFConfiguration.layout.global.margins;

  _dimensions: Dimensions | null = null;

  _dimensionCacheKey: string | null = null;

  renderTime = 0;

  songMetadata: Record<string, string | string[]> = {};

  layoutEngine: LayoutEngine|null = null;

  get dimensions(): Dimensions {
    const currentKey = this.generateDimensionCacheKey();
    if (this._dimensionCacheKey !== currentKey || this._dimensions === null) {
      this._dimensions = this.buildDimensions();
      this._dimensionCacheKey = currentKey;
    }
    return this._dimensions;
  }

  // Main function to format and save the song as a PDF
  format(
    song: Song,
    configuration: Configuration,
    pdfConfiguration: PDFConfiguration = defaultPDFConfiguration,
    docConstructor: PdfConstructor = JsPDF,
  ): void {
    this.startTime = performance.now();
    this.song = song;
    this.songMetadata = this.song.metadata.all();
    this.configuration = configuration;
    this.pdfConfiguration = pdfConfiguration;
    this.doc = DocWrapper.setup(docConstructor);

    const layoutConfig: LayoutConfig = {
      width: this.dimensions.columnWidth,
      fonts: {
        chord: this.pdfConfiguration.fonts.chord,
        lyrics: this.pdfConfiguration.fonts.text,
        comment: this.pdfConfiguration.fonts.comment,
        sectionLabel: this.pdfConfiguration.fonts.sectionLabel,
      },
      chordSpacing: this.pdfConfiguration.layout.sections.global.chordSpacing,
      chordLyricSpacing: this.pdfConfiguration.layout.sections.global.chordLyricSpacing,
      linePadding: this.pdfConfiguration.layout.sections.global.linePadding,
      useUnicodeModifiers: this.configuration.useUnicodeModifiers,
      normalizeChords: this.configuration.normalizeChords,

      // Column and page layout information
      minY: this.dimensions.minY,
      columnWidth: this.dimensions.columnWidth,
      columnCount: this.pdfConfiguration.layout.sections.global.columnCount,
      columnSpacing: this.pdfConfiguration.layout.sections.global.columnSpacing,
      paragraphSpacing: this.pdfConfiguration.layout.sections.global.paragraphSpacing || 0,
      columnBottomY: this.getColumnBottomY(),
      displayLyricsOnly: !!this.pdfConfiguration.layout.sections.base.display?.lyricsOnly,
    };
    this.layoutEngine = new LayoutEngine(this.song, new JsPdfMeasurer(this.doc), layoutConfig);

    this.y = this.dimensions.minY;
    this.x = this.dimensions.minX;
    this.currentColumn = 1;

    const paragraphLayouts = this.layoutEngine.computeParagraphLayouts();
    this.renderParagraphs(paragraphLayouts);

    this.renderChordDiagrams();
    this.recordFormattingTime();

    // Must render the footer and header after all formatting
    // to ensure the correct total number of pages
    this.renderHeadersAndFooters();
  }

  private renderHeadersAndFooters() {
    this.doc.eachPage(() => {
      this.renderLayout(this.pdfConfiguration.layout.header, 'header');
      this.renderLayout(this.pdfConfiguration.layout.footer, 'footer');
    });
  }

  get chordDefinitions(): ChordDefinition[] {
    const chordDefinitions = this.song.chordDefinitions.withDefaults();

    return this.song
      .getChords()
      .map((chord) => chordDefinitions.get(chord))
      .filter((chordDefinition) => chordDefinition !== null);
  }

  newPage() {
    this.doc.newPage();
    this.currentColumn = 1;
    this.x = this.dimensions.minX;
    this.y = this.dimensions.minY;
  }

  renderChordDiagrams() {
    const {
      renderingConfig,
      enabled,
      fonts,
      overrides = { global: {}, byKey: {} },
    } = this.pdfConfiguration.layout.chordDiagrams;

    if (!enabled) {
      return;
    }

    const diagramSpacing = renderingConfig?.diagramSpacing || 7;
    const maxDiagramsPerRow = renderingConfig?.maxDiagramsPerRow || null;

    const { columnWidth } = this.dimensions;
    const yMargin = diagramSpacing; // Vertical spacing

    // Define minimum and maximum widths for readability
    const minChordDiagramWidth = 30; // Minimum width for legibility
    const maxChordDiagramWidth = 35; // Maximum width to prevent excessive growth

    // Estimate how many diagrams can fit per row, considering spacing
    const potentialDiagramsPerRow = Math.floor(columnWidth / (minChordDiagramWidth + diagramSpacing));
    const diagramsPerRow = maxDiagramsPerRow ?
      Math.min(maxDiagramsPerRow, potentialDiagramsPerRow) :
      potentialDiagramsPerRow;

    // Calculate the actual width per diagram, ensuring it stays within bounds
    const totalSpacing = (diagramsPerRow - 1) * diagramSpacing;
    const chordDiagramWidth = Math.max(
      minChordDiagramWidth,
      Math.min(maxChordDiagramWidth, (columnWidth - totalSpacing) / diagramsPerRow),
    );
    const chordDiagramHeight = JsPDFRenderer.calculateHeight(chordDiagramWidth);

    // Initialize position
    this.x = this.columnStartX();
    const currentPageBottom = this.getColumnBottomY();

    // Handle column continuation or new page
    if (this.currentColumn > 1 && this.y + chordDiagramHeight > currentPageBottom) {
      this.newPage();
      this.y = this.dimensions.minY;
      this.x = this.columnStartX();
    }

    const songKey = this.song.key || 0;

    // Multi-column: wrap horizontally with dynamic width
    let diagramsInRow = 0;
    this.chordDefinitions.forEach((chordDefinitionFromSong: ChordDefinition) => {
      let chordDefinition = chordDefinitionFromSong;
      const chordName = chordDefinition.name;

      // Check for overrides, prioritizing key-specific > global > defaults
      let shouldHide = false;
      let customDefinition: string|null = null;

      // Check key-specific overrides first
      if (overrides?.byKey?.[songKey]?.[chordName]) {
        const keyOverride = overrides.byKey[songKey][chordName];
        if (keyOverride.hide !== undefined) {
          shouldHide = keyOverride.hide;
        }
        if (keyOverride.definition) {
          customDefinition = keyOverride.definition;
        }
      }

      // Fall back to global overrides if no key-specific override exists or if byKey[songKey] is undefined
      if (!overrides?.byKey?.[songKey]?.[chordName]) {
        if (overrides?.global?.[chordName]) {
          const globalOverride = overrides.global[chordName];
          if (globalOverride.hide !== undefined) {
            shouldHide = globalOverride.hide;
          }
          if (globalOverride.definition) {
            customDefinition = globalOverride.definition;
          }
        }
      }

      if (shouldHide) {
        return;
      }

      if (customDefinition) {
        chordDefinition = ChordDefinition.parse(customDefinition);
      }

      if (diagramsInRow >= diagramsPerRow || this.x + chordDiagramWidth > this.columnStartX() + columnWidth) {
        this.y += chordDiagramHeight + yMargin;
        this.x = this.columnStartX();
        diagramsInRow = 0;
      }
      if (this.y + chordDiagramHeight > currentPageBottom) {
        this.moveToNextColumn();
        this.y = this.dimensions.minY;
        this.x = this.columnStartX();
        diagramsInRow = 0;
      }
      const chordDiagram = this.buildChordDiagram(chordDefinition);
      const renderer = new JsPDFRenderer(this.doc, {
        x: this.x,
        y: this.y,
        width: chordDiagramWidth,
        fonts,
      });
      chordDiagram.render(renderer);
      this.x += chordDiagramWidth + diagramSpacing;
      diagramsInRow += 1;
    });
  }

  buildChordDiagram(chordDefinition: ChordDefinition): ChordDiagram {
    const openStrings = chordDefinition.frets
      .map((fret: Fret, index: number) => (isOpenFret(fret) ? (index + 1) as StringNumber : null))
      .filter((stringNumber: StringNumber | null) => stringNumber !== null);

    const unusedStrings = chordDefinition.frets
      .map((fret: Fret, index: number) => (isNonSoundingString(fret) ? (index + 1) as StringNumber : null))
      .filter((stringNumber: StringNumber | null) => stringNumber !== null);

    // Collect potential markers and identify barres
    const markers: StringMarker[] = [];
    const barres: Barre[] = []; // Use the Barre interface type

    // Only proceed with barre detection if fingerings are provided
    if (!chordDefinition.fingers || chordDefinition.fingers.length === 0) {
      // No fingerings provided, treat all non-open/non-muted frets as individual markers
      chordDefinition.frets.forEach((fret: Fret, index: number) => {
        if (!isNonSoundingString(fret) && !isOpenFret(fret)) {
          const stringNumber = (index + 1) as StringNumber;
          markers.push({
            string: stringNumber,
            fret,
            finger: 0,
          });
        }
      });
    } else {
      // Group strings by fret and finger to detect barres, using provided fingerings
      const fretFingerGroups: Record<number, Record<number, number[]>> = {};

      chordDefinition.frets.forEach((fret: Fret, index: number) => {
        if (!isNonSoundingString(fret) && !isOpenFret(fret)) {
          const stringNumber = (index + 1) as StringNumber;
          const finger = chordDefinition.fingers[index] || 0; // Default to 0 if undefined

          if (finger !== 0) { // Ignore muted/unused strings
            const fretNum = fret as number;

            if (!fretFingerGroups[fretNum]) {
              fretFingerGroups[fretNum] = {};
            }
            if (!fretFingerGroups[fretNum][finger]) {
              fretFingerGroups[fretNum][finger] = [];
            }
            fretFingerGroups[fretNum][finger].push(stringNumber);
          }
        }
      });

      // Process each fret and finger combination to identify barres
      Object.entries(fretFingerGroups).forEach(([fretStr, fingers]) => {
        const fret = parseInt(fretStr, 10) as FretNumber; // Cast to FretNumber
        Object.entries(fingers).forEach(([fingerStr, strings]) => {
          const finger = parseInt(fingerStr, 10) as FingerNumber;
          if (strings.length > 1) {
            // This finger is used on multiple strings at the same fret—it's a barre
            strings.sort((a, b) => a - b); // Sort strings for consistent ordering
            const from = strings[0] as StringNumber; // First string (lowest number)
            const to = strings[strings.length - 1] as StringNumber; // Last string (highest number)

            // Validate string numbers (1–6 for standard guitar)
            if (from < 1 || from > 6 || to < 1 || to > 6 || from > to) {
              return; // Skip invalid barres
            }

            barres.push({
              from,
              to,
              fret,
            });
          } else {
            // Single string, create a regular marker
            const string = strings[0] as StringNumber;
            markers.push({
              string,
              fret: fret as number, // Ensure type compatibility
              finger,
            });
          }
        });
      });
    }

    // Filter out strings covered by barres from individual markers
    const finalMarkers = markers.filter((marker) => !barres.some((barre) => marker.string >= barre.from &&
      marker.string <= barre.to &&
      marker.fret === barre.fret));

    const { renderingConfig } = this.pdfConfiguration.layout.chordDiagrams;

    return new ChordDiagram({
      chord: chordDefinition.name,
      openStrings,
      unusedStrings,
      markers: finalMarkers,
      barres,
      baseFret: chordDefinition.baseFret,
    }, renderingConfig);
  }

  // Save the formatted document as a PDF file
  save(): void {
    this.doc.save(`${this.song.title || 'untitled'}.pdf`);
  }

  // Generate the PDF as a Blob object
  async generatePDF(): Promise<Blob> {
    return new Promise((resolve): void => {
      resolve(this.doc.output());
    });
  }

  buildDimensions() {
    const { width, height } = this.doc.pageSize;
    const { columnCount, columnSpacing } = this.pdfConfiguration.layout.sections.global;

    return new Dimensions(width, height, this.pdfConfiguration.layout, { columnCount, columnSpacing });
  }

  private generateDimensionCacheKey(): string {
    const { width, height } = this.doc.pageSize;
    const { layout } = this.pdfConfiguration;
    const { global } = layout.sections;

    return [
      width,
      height,
      layout.global.margins.left,
      layout.global.margins.right,
      layout.global.margins.top,
      layout.global.margins.bottom,
      layout.header.height,
      global.columnCount,
      global.columnSpacing,
    ].join('-');
  }

  private getFontConfiguration(objectType: string): FontConfiguration {
    return this.pdfConfiguration.fonts[objectType];
  }

  // Renders the layout for header and footer
  private renderLayout(layoutConfig: LayoutItem, section: LayoutSection) {
    const { height } = layoutConfig;
    const { height: pageHeight } = this.doc.pageSize;
    const sectionY = section === 'header' ? this.margins.top : pageHeight - height - this.margins.bottom;

    layoutConfig.content.forEach((contentItem) => {
      const item = contentItem as LayoutContentItem;

      if (this.shouldRenderContent(item)) {
        if (item.type === 'text') {
          this.renderTextItem(item as LayoutContentItemWithText, sectionY);
        } else if (item.type === 'image') {
          this.renderImage(item as LayoutContentItemWithImage, sectionY);
        } else if (item.type === 'line') {
          this.renderLine(item as LayoutContentItemWithLine, sectionY);
        }
      }
    });
  }

  private shouldRenderContent(contentItem: LayoutContentItem): boolean {
    if (!contentItem.condition) {
      return true;
    }

    const metadata = { ...this.song.metadata.all(), ...this.extraMetadata };
    return new Condition(contentItem.condition, metadata).evaluate();
  }

  private get extraMetadata(): ExtendedMetadata {
    let metadata: ExtendedMetadata = {
      page: this.doc.currentPage,
      pages: this.doc.totalPages,
      renderTime: this.renderTime,
    };

    const capo = this.song.metadata.getSingle('capo');
    const key = this.song.metadata.getSingle('key');

    if (capo && key) {
      const capoInt = parseInt(capo, 10);

      metadata = {
        ...metadata,
        capoKey: getCapos(key)[capoInt],
      };
    }

    return metadata;
  }

  private renderTextItem(textItem: LayoutContentItemWithText, sectionY: number) {
    const {
      value, template = '', style, position,
    } = textItem;

    const metadata = this.song.metadata.merge(this.extraMetadata);
    const textValue = value || this.evaluateTemplate(template, metadata);

    if (!textValue) {
      return;
    }

    this.doc.setFontStyle(style);
    const { width: pageWidth } = this.doc.pageSize;
    const availableWidth = position.width ||
      (pageWidth - this.margins.left - this.margins.right);
    let y = sectionY + position.y;

    if (position.clip) {
      if (position.ellipsis) {
        let clippedText = textValue;
        let textWidth = this.doc.getTextWidth(clippedText);

        while (textWidth > availableWidth) {
          clippedText = clippedText.slice(0, -1);
          textWidth = this.doc.getTextWidth(`${clippedText}...`);
        }

        if (clippedText !== textValue) {
          clippedText += '...';
        }

        const x = this.calculateX(position.x, textWidth);

        this.doc.text(clippedText, x, y);
      } else {
        let clippedText = textValue;
        let textWidth = this.doc.getTextWidth(clippedText);

        while (textWidth > availableWidth) {
          clippedText = clippedText.slice(0, -1);
          textWidth = this.doc.getTextWidth(clippedText);
        }

        const x = this.calculateX(position.x, textWidth);

        this.doc.text(clippedText, x, y);
      }
    } else {
      const lines = this.doc.splitTextToSize(textValue, availableWidth);

      lines.forEach((line: string) => {
        const lineWidth = this.doc.getTextWidth(line);
        const x = this.calculateX(position.x, lineWidth);

        this.doc.text(line, x, y);
        y += style.size * (style.lineHeight ?? 1.2);
      });
    }
  }

  // Renders individual image items
  private renderImage(imageItem: LayoutContentItemWithImage, sectionY: number) {
    const {
      src, position, size, alias, compression, rotation,
    } = imageItem;

    const x = this.calculateX(position.x, size.width);
    const y = sectionY + position.y;
    const format = src.split('.').pop()?.toUpperCase() as string;

    this.doc.addImage(src, format, x, y, size.width, size.height, alias, compression, rotation);
  }

  // Renders individual line items
  private renderLine(lineItem: LayoutContentItemWithLine, sectionY: number) {
    const { style, position } = lineItem;
    this.doc.setLineStyle(style);

    const x = this.margins.left + (position.x || 0);
    const y = sectionY + position.y;

    const { width: pageWidth } = this.doc.pageSize;
    const availableWidth = pageWidth - this.margins.left - this.margins.right;
    const lineWidth = position.width === 'auto' ? availableWidth : position.width;

    this.doc.line(x, y, x + lineWidth, y + (position.height || 0));
    this.doc.resetDash();
  }

  private evaluateTemplate(template: string, metadata: Metadata): string {
    try {
      const parsed = new ChordProParser().parse(template);
      return new TextFormatter().format(parsed, metadata);
    } catch (e) {
      throw new Error(`Error evaluating template\n\n${template}\n\n: ${(e as Error).message}`);
    }
  }

  // Helper method to calculate x position based on alignment
  private calculateX(alignment: Alignment | number, width = 0): number {
    switch (alignment) {
      case 'center':
        return this.doc.pageSize.width / 2 - width / 2;
      case 'right':
        return this.doc.pageSize.width - this.margins.right - width;
      case 'left':
      default:
        if (typeof alignment === 'number') {
          return this.margins.left + alignment;
        }
        return this.margins.left;
    }
  }

  /**
   * Renders pre-computed paragraph layouts
   */
  private renderParagraphs(paragraphLayouts: ParagraphLayout[]) {
    paragraphLayouts.forEach((layout) => {
      layout.units.forEach((lines) => {
        this.renderLines(lines);
      });
      if (layout.addSpacing) {
        this.y += this.pdfConfiguration.layout.sections.global.paragraphSpacing || 0;
      }
    });
  }

  private getChordLyricYOffset(items: MeasuredItem[], yOffset) {
    // Determine line types
    const hasChords = items.some(({ item }) => item instanceof ChordLyricsPair && item.chords);
    const hasLyrics = items.some(
      ({ item }) => item instanceof ChordLyricsPair && item.lyrics && item.lyrics.trim() !== '',
    );

    const { chordLyricSpacing } = this.pdfConfiguration.layout.sections.global;
    let chordsYOffset = yOffset;
    let lyricsYOffset = yOffset;

    if (hasChords && hasLyrics) {
      chordsYOffset = yOffset;
      lyricsYOffset = chordsYOffset + this.maxChordHeight(items) + chordLyricSpacing;
    } else if (hasChords && !hasLyrics) {
      chordsYOffset = yOffset;
    } else if (!hasChords && hasLyrics) {
      lyricsYOffset = yOffset;
    }

    return { chordsYOffset, lyricsYOffset };
  }

  // Render lines
  private renderLines(lines: LineLayout[]): void {
    const chordFont = this.getFontConfiguration('chord');
    const lyricsFont = this.getFontConfiguration('text');

    lines.forEach((lineLayout) => {
      const { items, lineHeight, line } = lineLayout;

      // Filter items that are column breaks and handle them first.
      const hasColumnBreak = items.length === 1 && items[0].item instanceof Tag && isColumnBreak(items[0].item);
      if (hasColumnBreak) {
        this.moveToNextColumn();
        return; // Skip to the next iteration of lines.
      }

      const yOffset = this.y;
      const { chordsYOffset, lyricsYOffset } = this.getChordLyricYOffset(items, yOffset);

      let { x } = this;

      // Render each item in the line
      items.forEach((measuredItem) => {
        const { item, width } = measuredItem;

        if (item instanceof ChordLyricsPair) {
          let { chords } = item;
          const { lyrics } = item;

          chords = renderChord(
            chords,
            (line as Line),
            this.song,
            {
              renderKey: null,
              useUnicodeModifier: this.configuration.useUnicodeModifiers,
              normalizeChords: this.configuration.normalizeChords,
            },
          );

          // Render chords only if `lyricsOnly` is false
          if (!this.pdfConfiguration.layout.sections.base.display?.lyricsOnly && chords) {
            const chordDimensions = this.doc.getTextDimensions(chords, chordFont);
            const chordBaseline = chordsYOffset + this.maxChordHeight(items) - chordDimensions.h;
            this.doc.text(chords, x, chordBaseline, chordFont);
          }

          // Always render lyrics
          if (lyrics && lyrics.trim() !== '') {
            this.doc.text(lyrics, x, lyricsYOffset, lyricsFont);
          }

          x += width;
        } else if (item instanceof Tag) {
          if (isColumnBreak(item)) {
            // Column break already handled at the beginning, so we don't need `continue`.

          } else if (item.isSectionDelimiter()) {
            this.formatSectionLabel(item.label, x, yOffset);
            x += width;
          } else if (isComment(item)) {
            this.formatComment(item.value, x, yOffset);
            x += width;
          }
        } else if (item instanceof SoftLineBreak) {
          this.doc.text(item.content, x, lyricsYOffset, lyricsFont);
          x += width;
        }
      });

      // Update the vertical position after rendering the line
      this.y += lineHeight;

      // Reset x to the left margin for the next line
      this.x = this.columnStartX();
    });
  }

  // Get the maximum chord height
  private maxChordHeight(items: MeasuredItem[]): number {
    return items.reduce((maxHeight, { chordHeight }) => Math.max(maxHeight, chordHeight || 0), 0);
  }

  // Move to the next column or page
  private moveToNextColumn() {
    this.currentColumn += 1;

    const {
      columnCount,
    } = this.pdfConfiguration.layout.sections.global;

    if (this.currentColumn > columnCount) {
      this.doc.newPage();
      this.currentColumn = 1;
    }

    this.x = this.columnStartX();
    this.y = this.margins.top + this.pdfConfiguration.layout.header.height;
  }

  // Get the bottom Y coordinate of the column
  private getColumnBottomY(): number {
    const { height: pageHeight } = this.doc.pageSize;
    const { layout } = this.pdfConfiguration;
    const footerHeight = layout.footer.height;
    return pageHeight - this.margins.bottom - footerHeight;
  }

  private columnStartX(): number {
    const { columnSpacing } = this.pdfConfiguration.layout.sections.global;
    return this.margins.left + (this.currentColumn - 1) * (this.dimensions.columnWidth + columnSpacing);
  }

  private formatSectionLabel(label: string, x: number, y: number): void {
    this.doc.text(label, x, y, this.getFontConfiguration('sectionLabel'));
  }

  private formatComment(commentText: string, x: number, y: number): void {
    this.doc.text(commentText, x, y, this.getFontConfiguration('comment'));
  }

  // Record formatting time
  private recordFormattingTime(): void {
    const endTime = performance.now();
    this.renderTime = ((endTime - this.startTime) / 1000);
    // eslint-disable-next-line no-console
    console.log(`Rendered in ${this.renderTime.toFixed(2)} seconds`);
  }
}

export default PdfFormatter;
