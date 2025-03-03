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
import Paragraph from '../chord_sheet/paragraph';
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
  lineHasContents,
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
import { LayoutConfig, LayoutEngine, LineLayout } from './layout/layout_engine';

declare const performance: Performance;

type ExtendedMetadata = Record<string, number | string | string[]>;

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
    };
    this.layoutEngine = new LayoutEngine(this.song, new JsPdfMeasurer(this.doc), layoutConfig);

    this.y = this.dimensions.minY;
    this.x = this.dimensions.minX;
    this.currentColumn = 1;
    this.formatParagraphs();
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

  // Format paragraphs in the song
  private formatParagraphs() {
    const { bodyParagraphs } = this.song;
    bodyParagraphs.forEach((paragraph) => {
      this.formatParagraph(paragraph);
    });
  }

  private formatParagraph(paragraph: Paragraph) {
    const paragraphSummary: {
      totalHeight: number;
      countChordLyricPairLines: number;
      countNonLyricLines: number;
      lineLayouts: LineLayout[][];
      sectionType: string;
    } = {
      totalHeight: 0,
      countChordLyricPairLines: 0,
      countNonLyricLines: 0,
      lineLayouts: [],
      sectionType: paragraph.type,
    };

    paragraph.lines.forEach((line) => {
      if (lineHasContents(line)) {
        const lineLayouts = this.measureAndComputeLineLayouts(line);
        const lineHeight = lineLayouts.reduce((sum, l) => sum + l.lineHeight, 0);
        paragraphSummary.totalHeight += lineHeight;
        lineLayouts.forEach((lineLayout) => {
          if (lineLayout.type === 'ChordLyricsPair') {
            paragraphSummary.countChordLyricPairLines += 1;
          } else if (lineLayout.type === 'Comment' || lineLayout.type === 'SectionLabel') {
            paragraphSummary.countNonLyricLines += 1;
          }
        });
        paragraphSummary.lineLayouts.push(lineLayouts);
      }
    });

    paragraphSummary.lineLayouts = this.insertColumnBreaks(paragraphSummary);

    // don't render empty chords only sections if lyricsOnly is true
    if (
      paragraphSummary.countNonLyricLines === 1 &&
      paragraphSummary.countChordLyricPairLines === 0 &&
      this.pdfConfiguration.layout.sections.base.display?.lyricsOnly
    ) {
      return;
    }

    paragraphSummary.lineLayouts.forEach((lines) => {
      this.renderLines(lines);
    });

    this.y += this.pdfConfiguration.layout.sections.global.paragraphSpacing || 0;
  }

  private measureAndComputeLineLayouts(line: Line): LineLayout[] {
    if (!this.layoutEngine) {
      throw new Error('Layout engine not initialized');
    }
    return this.layoutEngine.computeLineLayouts(
      line,
      this.columnAvailableWidth(),
      this.pdfConfiguration.layout.sections.base.display?.lyricsOnly,
    );
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

  private insertColumnBreaks(paragraphSummary: {
    totalHeight: number;
    countChordLyricPairLines: number;
    countNonLyricLines: number;
    lineLayouts: LineLayout[][];
  }): LineLayout[][] {
    const { lineLayouts, totalHeight, countChordLyricPairLines } = paragraphSummary;
    let newLineLayouts: LineLayout[][] = [];
    const cumulativeHeight = this.y;
    const columnStartY = this.margins.top + this.pdfConfiguration.layout.header.height;
    const columnBottomY = this.getColumnBottomY();

    // Check if the entire paragraph fits in the current column
    if (cumulativeHeight + totalHeight <= columnBottomY) {
      // The entire paragraph fits; no need for column breaks
      return lineLayouts;
    }

    // Paragraph does not fit entirely in current column
    if (countChordLyricPairLines <= 3) {
      // Paragraphs with 3 chord-lyric lines or less
      // Insert column break before the paragraph if not at the top of the column
      if (cumulativeHeight !== columnStartY) {
        newLineLayouts.push([this.createColumnBreakLineLayout()]);
      }
      newLineLayouts = newLineLayouts.concat(lineLayouts);
      return newLineLayouts;
    }

    if (countChordLyricPairLines === 4) {
      // Paragraphs with 4 chord-lyric lines
      // Try to split after the 2nd chord-lyric line
      newLineLayouts = this.splitParagraphAfterNthChordLyricLine(
        lineLayouts,
        2,
        cumulativeHeight,
      );
      return newLineLayouts;
    }

    if (countChordLyricPairLines >= 5) {
      // Paragraphs with 5 or more chord-lyric lines
      newLineLayouts = this.splitParagraphWithMinimumChordLyricLines(
        lineLayouts,
        cumulativeHeight,
        countChordLyricPairLines,
      );
      return newLineLayouts;
    }

    // Default case: return the original lineLayouts
    return lineLayouts;
  }

  private splitParagraphAfterNthChordLyricLine(
    lineLayouts: LineLayout[][],
    n: number,
    cumulativeHeight: number,
  ): LineLayout[][] {
    let newLineLayouts: LineLayout[][] = [];
    const columnStartY = this.margins.bottom + this.pdfConfiguration.layout.header.height;
    const columnBottomY = this.getColumnBottomY();

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
      if (chordLyricPairLinesSeen >= n) {
        splitIndex = i + 1;
        break;
      }
    }

    if (cumulativeHeight + heightFirstPart <= columnBottomY) {
      // First part fits in current column
      newLineLayouts = newLineLayouts.concat(lineLayouts.slice(0, splitIndex));
      newLineLayouts.push([this.createColumnBreakLineLayout()]);
      newLineLayouts = newLineLayouts.concat(lineLayouts.slice(splitIndex));
    } else {
      // First part doesn't fit; insert column break before paragraph
      if (cumulativeHeight !== columnStartY) {
        newLineLayouts.push([this.createColumnBreakLineLayout()]);
      }
      newLineLayouts = newLineLayouts.concat(lineLayouts);
    }

    return newLineLayouts;
  }

  private splitParagraphWithMinimumChordLyricLines(
    lineLayouts: LineLayout[][],
    cumulativeHeight: number,
    totalChordLyricPairLines: number,
  ): LineLayout[][] {
    let newLineLayouts: LineLayout[][] = [];
    const columnStartY =
      this.margins.top + this.pdfConfiguration.layout.header.height;
    const columnBottomY = this.getColumnBottomY();

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

      const remainingChordLyricLines = totalChordLyricPairLines - chordLyricLinesInFirstPart;

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

      if (cumulativeHeight + split.heightFirstPart <= columnBottomY) {
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
        newLineLayouts.push([this.createColumnBreakLineLayout()]);
        newLineLayouts = newLineLayouts.concat(secondPartLineLayouts);

        splitFound = true;
        break;
      }
    }

    if (!splitFound) {
      // No acceptable split point fits; move entire paragraph to the next column
      if (cumulativeHeight !== columnStartY) {
        newLineLayouts.push([this.createColumnBreakLineLayout()]);
      }
      newLineLayouts = newLineLayouts.concat(lineLayouts);
    }

    return newLineLayouts;
  }

  private createColumnBreakLineLayout(): LineLayout {
    return {
      type: 'Tag',
      items: [{ item: new Tag('column_break'), width: 0 }],
      lineHeight: 0,
    };
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

  // Helper methods for layout calculations
  private columnAvailableWidth(): number {
    const columnStartPosition = this.columnStartX();
    const currentXPosition = this.x;
    const totalColumnWidth = this.dimensions.columnWidth;
    const availableWidth = totalColumnWidth - (currentXPosition - columnStartPosition);
    return availableWidth;
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
  }
}

export default PdfFormatter;
