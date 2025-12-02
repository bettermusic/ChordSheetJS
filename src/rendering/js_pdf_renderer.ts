import { Blob } from 'buffer';

import ChordProParser from '../parser/chord_pro_parser';
import Condition from '../layout/engine/condition';
import Dimensions from '../layout/engine/dimensions';
import DocWrapper from '../formatter/pdf_formatter/doc_wrapper';
import JsPDFRenderer from '../chord_diagram/js_pdf_renderer';
import { MeasuredItem } from '../layout/engine';
import Metadata from '../chord_sheet/metadata';
import { PdfConstructor } from '../formatter/pdf_formatter/types';
import Song from '../chord_sheet/song';
import TextFormatter from '../formatter/text_formatter';
import { getCapos } from '../helpers';
import ChordDefinition, { isNonSoundingString, isOpenFret } from '../chord_definition/chord_definition';
import ChordDiagram, { Barre, StringMarker } from '../chord_diagram/chord_diagram';
import { FontConfiguration, PDFFormatterConfiguration } from '../formatter/configuration';
import Renderer, { PositionedElement } from './renderer';

import {
  FingerNumber, Fret, FretNumber, StringNumber,
} from '../constants';

import {
  Alignment,
  ConditionalRule,
  LayoutContentItem,
  LayoutContentItemWithImage,
  LayoutContentItemWithLine,
  LayoutContentItemWithText,
  LayoutItem,
  LayoutSection,
} from '../formatter/configuration';

class JsPdfRenderer extends Renderer {
  private configuration: PDFFormatterConfiguration;

  private _dimensions: Dimensions | null = null;

  private _dimensionCacheKey: string | null = null;

  doc: DocWrapper;

  constructor(
    song: Song,
    docConstructor: PdfConstructor,
    configuration: PDFFormatterConfiguration,
  ) {
    super(song);
    this.doc = DocWrapper.setup(docConstructor);
    this.configuration = configuration;
  }

  //
  // PUBLIC API IMPLEMENTATION
  //

  getFontConfiguration(objectType: string): FontConfiguration {
    return this.configuration.fonts[objectType];
  }

  getDocumentMetadata(): Record<string, any> {
    return {
      pageWidth: this.getPageWidth(),
      pageHeight: this.getPageHeight(),
      marginLeft: this.getLeftMargin(),
      marginRight: this.getRightMargin(),
      marginTop: this.getTopMargin(),
      marginBottom: this.getBottomMargin(),
      columnWidth: this.getColumnWidth(),
      columnCount: this.getColumnCount(),
      currentPage: this.doc.currentPage,
      totalPages: this.doc.totalPages,
      renderTime: this.renderTime,
      dimensions: this.dimensions,
    };
  }

  /**
   * Save the PDF to a file
   */
  save(filename: string): void {
    this.doc.save(filename);
  }

  /**
   * Generate the PDF as a Blob
   */
  async generatePDF(): Promise<Blob> {
    return this.doc.output();
  }

  getDoc(): DocWrapper {
    return this.doc;
  }

  /**
   * Override the base getExtraMetadata method to include PDF-specific metadata
   */
  protected getExtraMetadata(page: number, totalPages: number): Record<string, | string | string[]> {
    // Create base metadata
    const baseMetadata: Record<string, | string | string[]> = {
      page: page.toString(),
      pages: totalPages.toString(),
      renderTime: this.renderTime.toString(),
    };

    // Add capo metadata if present
    const capo = this.song.metadata.getSingle('capo');
    const key = this.song.metadata.getSingle('key');

    if (capo && key) {
      const capoInt = parseInt(capo, 10);
      baseMetadata.capoKey = getCapos(key)[capoInt];
    }

    return baseMetadata;
  }

  //
  // ABSTRACT METHOD IMPLEMENTATIONS
  //

  protected initializeBackend(): void {
    // Any PDF-specific initialization
  }

  protected createNewPage(): void {
    this.doc.newPage();
  }

  protected renderChordDiagrams(): void {
    const { enabled, overrides = { global: {}, byKey: {} } } = this.configuration.layout.chordDiagrams;
    if (!enabled) return;

    const layout = this.calculateDiagramLayout();
    this.initializeDiagramPosition(layout.height);

    let diagramsInRow = 0;
    const songKey = this.song.key || 0;

    this.getChordDefinitions().forEach((def: ChordDefinition) => {
      const result = this.renderSingleChordDiagram(def, songKey, overrides, layout, diagramsInRow);
      if (result !== null) diagramsInRow = result;
    });
  }

  private calculateDiagramLayout(): {
    width: number; height: number; spacing: number; perRow: number;
    } {
    const { renderingConfig } = this.configuration.layout.chordDiagrams;
    const spacing = renderingConfig?.diagramSpacing || 7;
    const maxPerRow = renderingConfig?.maxDiagramsPerRow || null;
    const { columnWidth } = this.dimensions;

    const minWidth = 30;
    const maxWidth = 35;
    const potentialPerRow = Math.floor(columnWidth / (minWidth + spacing));
    const perRow = maxPerRow ? Math.min(maxPerRow, potentialPerRow) : potentialPerRow;
    const totalSpacing = (perRow - 1) * spacing;
    const width = Math.max(minWidth, Math.min(maxWidth, (columnWidth - totalSpacing) / perRow));
    const height = JsPDFRenderer.calculateHeight(width);

    return {
      width, height, spacing, perRow,
    };
  }

  private initializeDiagramPosition(height: number): void {
    if (this.y === this.getMinY() && this.currentPage > 1) {
      this.currentColumn = 1;
      this.x = this.getColumnStartX();
    }
    if (this.y + height > this.getColumnBottomY()) {
      this.moveToNextColumn();
      this.y = this.getMinY();
      this.x = this.getColumnStartX();
    }
  }

  private renderSingleChordDiagram(
    chordDef: ChordDefinition,
    songKey: any,
    overrides: any,
    layout: { width: number; height: number; spacing: number; perRow: number },
    diagramsInRow: number,
  ): number | null {
    const { shouldHide, customDefinition } = this.processChordOverrides(chordDef.name, songKey, overrides);
    if (shouldHide) return null;

    const definition = customDefinition ? ChordDefinition.parse(customDefinition) : chordDef;
    const newRowCount = this.positionForNextDiagram(layout, diagramsInRow);

    this.drawChordDiagram(definition, layout.width, layout.spacing);
    return newRowCount + 1;
  }

  private positionForNextDiagram(
    layout: { width: number; height: number; spacing: number; perRow: number },
    diagramsInRow: number,
  ): number {
    const { columnWidth } = this.dimensions;
    let count = diagramsInRow;

    if (count >= layout.perRow || this.x + layout.width > this.getColumnStartX() + columnWidth) {
      this.y += layout.height + layout.spacing;
      this.x = this.getColumnStartX();
      count = 0;
    }

    if (this.y + layout.height > this.getColumnBottomY()) {
      this.moveToNextColumn();
      this.y = this.getMinY();
      this.x = this.getColumnStartX();
      count = 0;
    }

    return count;
  }

  private drawChordDiagram(definition: ChordDefinition, width: number, spacing: number): void {
    const { fonts } = this.configuration.layout.chordDiagrams;
    const diagram = this.buildChordDiagram(definition);
    const renderer = new JsPDFRenderer(this.doc, {
      x: this.x, y: this.y, width, fonts,
    });
    diagram.render(renderer);
    this.x += width + spacing;
  }

  protected renderHeadersAndFooters(): void {
    if (this.configuration.layout.header) {
      this.doc.eachPage(() => {
        this.renderLayout(this.configuration.layout.header, 'header');
      });
    }
    if (this.configuration.layout.footer) {
      this.doc.eachPage(() => {
        this.renderLayout(this.configuration.layout.footer, 'footer');
      });
    }
  }

  protected measureText(text: string, font: FontConfiguration): { width: number; height: number } {
    const dimensions = this.doc.getTextDimensions(text, font);
    return {
      width: dimensions.w,
      height: dimensions.h,
    };
  }

  protected calculateChordBaseline(yOffset: number, items: MeasuredItem[], chordText: string): number {
    const chordFont = this.getFontConfiguration('chord');
    const chordDimensions = this.doc.getTextDimensions(chordText, chordFont);
    return yOffset + this.getMaxChordHeight(items) - chordDimensions.h;
  }

  protected finalizeRendering(): void {
    // Ensure we create enough pages for our content
    const pageCount = Math.max(this.currentPage, this.doc.totalPages);

    // Make sure we have the correct number of pages
    while (this.doc.totalPages < pageCount) {
      this.doc.newPage();
    }

    // Draw elements for each page
    for (let page = 1; page <= pageCount; page += 1) {
      const pageElements = this.getElementsForPage(page);
      if (pageElements.length > 0) {
        // Go to this page
        this.doc.setPage(page);

        // Draw the elements
        pageElements.forEach((element) => {
          this.drawElement(element);
        });
      }
    }
  }

  //
  // CONFIGURATION GETTERS IMPLEMENTATION
  //
  protected getConfiguration() {
    return this.configuration;
  }

  protected getPageWidth(): number {
    return this.doc.pageSize.width;
  }

  protected getPageHeight(): number {
    return this.doc.pageSize.height;
  }

  protected getLeftMargin(): number {
    return this.dimensions.margins.left;
  }

  protected getRightMargin(): number {
    return this.dimensions.margins.right;
  }

  protected getTopMargin(): number {
    return this.dimensions.margins.top;
  }

  protected getBottomMargin(): number {
    return this.dimensions.margins.bottom;
  }

  protected getHeaderHeight(): number {
    return this.configuration.layout.header?.height ?? 0;
  }

  protected getFooterHeight(): number {
    return this.configuration.layout.footer?.height ?? 0;
  }

  protected getColumnCount(): number {
    return this.dimensions.effectiveColumnCount;
  }

  protected getColumnSpacing(): number {
    return this.configuration.layout.sections.global.columnSpacing;
  }

  protected getChordLyricSpacing(): number {
    return this.configuration.layout.sections.global.chordLyricSpacing;
  }

  protected getParagraphSpacing(): number {
    return this.configuration.layout.sections.global.paragraphSpacing || 0;
  }

  protected useUnicodeModifiers(): boolean {
    return this.configuration.useUnicodeModifiers;
  }

  protected normalizeChords(): boolean {
    return this.configuration.normalizeChords;
  }

  protected isLyricsOnly(): boolean {
    return !!this.configuration.layout.sections?.base?.display?.lyricsOnly;
  }

  //
  // PDF-SPECIFIC METHODS
  //

  get dimensions(): Dimensions {
    const currentKey = this.generateDimensionCacheKey();
    if (this._dimensionCacheKey !== currentKey || this._dimensions === null) {
      this._dimensions = this.buildDimensions();
      this._dimensionCacheKey = currentKey;
    }
    return this._dimensions;
  }

  private drawElement(element: PositionedElement): void {
    // Before drawing, set the appropriate font style
    if (element.style) {
      this.doc.setFontStyle(element.style);
    }

    switch (element.type) {
      case 'chord':
      case 'lyrics':
      case 'sectionLabel':
      case 'comment': {
        // Draw the text at the specified position
        this.doc.text(element.content, element.x, element.y);

        // Add underline if specified in the style (especially for section labels)
        // Skip underline for title separator (content is ' > ')
        const isTitleSeparator = element.content?.trim() === '>';
        if (element.style?.underline && !isTitleSeparator) {
          const { w: textWidth } = this.doc.getTextDimensions(element.content);
          this.doc.setDrawColor(0);
          this.doc.setLineWidth(1.25);
          this.doc.line(element.x, element.y + 3, element.x + textWidth, element.y + 3);
        }
        break;
      }
      // Handle other element types if needed
      default:
        // eslint-disable-next-line no-console
        console.warn(`Unknown element type: ${element.type}`);
        break;
    }
  }

  private processChordOverrides(
    chordName: string,
    songKey: number | string,
    overrides: any,
  ): { shouldHide: boolean; customDefinition: string | null } {
    const keyOverride = overrides?.byKey?.[songKey]?.[chordName];
    if (keyOverride) return this.extractOverrideValues(keyOverride);

    const globalOverride = overrides?.global?.[chordName];
    if (globalOverride) return this.extractOverrideValues(globalOverride);

    return { shouldHide: false, customDefinition: null };
  }

  private extractOverrideValues(override: any): { shouldHide: boolean; customDefinition: string | null } {
    return {
      shouldHide: override.hide ?? false,
      customDefinition: override.definition ?? null,
    };
  }

  private getChordDefinitions(): ChordDefinition[] {
    const chordDefinitions = this.song.chordDefinitions.withDefaults();

    return this.song
      .getChords()
      .map((chord) => chordDefinitions.get(chord))
      .filter((chordDefinition) => chordDefinition !== null);
  }

  private buildChordDiagram(chordDefinition: ChordDefinition): ChordDiagram {
    const openStrings = chordDefinition.frets
      .map((fret: Fret, index: number) => (isOpenFret(fret) ? (index + 1) as StringNumber : null))
      .filter((stringNumber: StringNumber | null) => stringNumber !== null);

    const unusedStrings = chordDefinition.frets
      .map((fret: Fret, index: number) => (isNonSoundingString(fret) ? (index + 1) as StringNumber : null))
      .filter((stringNumber: StringNumber | null) => stringNumber !== null);

    // Collect potential markers and identify barres
    const markers: StringMarker[] = [];
    const barres: Barre[] = [];

    // Process fingerings and detect barres
    this.processFingeringAndBarres(chordDefinition, markers, barres);

    // Filter out strings covered by barres from individual markers
    const finalMarkers = markers.filter((marker) => !barres.some((barre) => marker.string >= barre.from &&
      marker.string <= barre.to &&
      marker.fret === barre.fret));

    const { renderingConfig } = this.configuration.layout.chordDiagrams;

    return new ChordDiagram({
      chord: chordDefinition.name,
      openStrings,
      unusedStrings,
      markers: finalMarkers,
      barres,
      baseFret: chordDefinition.baseFret,
    }, renderingConfig);
  }

  private processFingeringAndBarres(chordDefinition: ChordDefinition, markers: StringMarker[], barres: Barre[]): void {
    if (!chordDefinition.fingers || chordDefinition.fingers.length === 0) {
      this.addMarkersWithoutFingering(chordDefinition.frets, markers);
      return;
    }

    const fretFingerGroups = this.groupFretsByFinger(chordDefinition);
    this.processFretFingerGroups(fretFingerGroups, markers, barres);
  }

  private addMarkersWithoutFingering(frets: Fret[], markers: StringMarker[]): void {
    frets.forEach((fret: Fret, index: number) => {
      if (!isNonSoundingString(fret) && !isOpenFret(fret)) {
        markers.push({ string: (index + 1) as StringNumber, fret, finger: 0 });
      }
    });
  }

  private groupFretsByFinger(chordDefinition: ChordDefinition): Record<number, Record<number, number[]>> {
    const groups: Record<number, Record<number, number[]>> = {};

    chordDefinition.frets.forEach((fret: Fret, index: number) => {
      if (isNonSoundingString(fret) || isOpenFret(fret)) return;

      const finger = chordDefinition.fingers[index] || 0;
      if (finger === 0) return;

      const fretNum = fret as number;
      groups[fretNum] = groups[fretNum] || {};
      groups[fretNum][finger] = groups[fretNum][finger] || [];
      groups[fretNum][finger].push((index + 1) as StringNumber);
    });

    return groups;
  }

  private processFretFingerGroups(
    groups: Record<number, Record<number, number[]>>,
    markers: StringMarker[],
    barres: Barre[],
  ): void {
    Object.entries(groups).forEach(([fretStr, fingers]) => {
      const fret = parseInt(fretStr, 10) as FretNumber;
      Object.entries(fingers).forEach(([fingerStr, strings]) => {
        this.processFingerGroup(fret, parseInt(fingerStr, 10) as FingerNumber, strings, markers, barres);
      });
    });
  }

  private processFingerGroup(
    fret: FretNumber,
    finger: FingerNumber,
    strings: number[],
    markers: StringMarker[],
    barres: Barre[],
  ): void {
    if (strings.length > 1) {
      this.addBarreIfValid(fret, strings, barres);
    } else {
      markers.push({ string: strings[0] as StringNumber, fret: fret as number, finger });
    }
  }

  private addBarreIfValid(fret: FretNumber, strings: number[], barres: Barre[]): void {
    strings.sort((a, b) => a - b);
    const from = strings[0] as StringNumber;
    const to = strings[strings.length - 1] as StringNumber;

    // Validate string numbers (1–6 for standard guitar)
    if (from >= 1 && from <= 6 && to >= 1 && to <= 6 && from <= to) {
      barres.push({ from, to, fret });
    }
  }

  private renderLayout(layoutConfig: LayoutItem, section: LayoutSection): void {
    const { height } = layoutConfig;
    const { height: pageHeight } = this.doc.pageSize;
    const sectionY = section === 'header' ?
      this.dimensions.margins.top :
      pageHeight - height - this.dimensions.margins.bottom;

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

    const metadata = {
      ...this.song.metadata.all(),
      ...this.getExtraMetadata(this.doc.currentPage, this.doc.totalPages),
    };
    return new Condition(contentItem.condition as ConditionalRule, metadata).evaluate();
  }

  private renderTextItem(textItem: LayoutContentItemWithText, sectionY: number): void {
    const {
      value, template = '', style, position,
    } = textItem;

    const metadata = this.song.metadata.merge(
      this.getExtraMetadata(this.doc.currentPage, this.doc.totalPages),
    );

    const textValue = value || this.evaluateTemplate(template, metadata);

    if (!textValue) {
      return;
    }

    this.doc.setFontStyle(style);
    const { width: pageWidth } = this.doc.pageSize;
    const availableWidth = position.width ||
      (pageWidth - this.dimensions.margins.left - this.dimensions.margins.right);
    const y = sectionY + position.y;

    if (position.clip) {
      this.renderClippedText(textValue, position, availableWidth, y);
    } else {
      this.renderMultilineText(textValue, position, availableWidth, y, style);
    }
  }

  private renderClippedText(textValue: string, position: any, availableWidth: number, y: number): void {
    const clippedText = position.ellipsis ?
      this.clipTextWithEllipsis(textValue, availableWidth) :
      this.clipText(textValue, availableWidth);
    const textWidth = this.doc.getTextWidth(clippedText);
    const x = this.calculateX(position.x, textWidth);
    this.doc.text(clippedText, x, y);
  }

  private clipTextWithEllipsis(text: string, maxWidth: number): string {
    let clipped = text;
    while (this.doc.getTextWidth(`${clipped}...`) > maxWidth && clipped.length > 0) {
      clipped = clipped.slice(0, -1);
    }
    return clipped !== text ? `${clipped}...` : text;
  }

  private clipText(text: string, maxWidth: number): string {
    let clipped = text;
    while (this.doc.getTextWidth(clipped) > maxWidth && clipped.length > 0) {
      clipped = clipped.slice(0, -1);
    }
    return clipped;
  }

  private renderMultilineText(
    textValue: string,
    position: any,
    availableWidth: number,
    y: number,
    style: FontConfiguration,
  ): void {
    const lines = this.doc.splitTextToSize(textValue, availableWidth);
    let tempY = y;

    lines.forEach((line: string) => {
      const lineWidth = this.doc.getTextWidth(line);
      const x = this.calculateX(position.x, lineWidth);

      this.doc.text(line, x, tempY);
      tempY += style.size * (style.lineHeight ?? 1.2);
    });
  }

  private renderImage(imageItem: LayoutContentItemWithImage, sectionY: number): void {
    const {
      src, position, size, alias, compression, rotation,
    } = imageItem;

    const x = this.calculateX(position.x, size.width);
    const y = sectionY + position.y;
    const format = src.split('.').pop()?.toUpperCase() as string;

    this.doc.addImage(src, format, x, y, size.width, size.height, alias, compression, rotation);
  }

  private renderLine(lineItem: LayoutContentItemWithLine, sectionY: number): void {
    const { style, position } = lineItem;
    this.doc.setLineStyle(style);

    const x = this.dimensions.margins.left + (position.x || 0);
    const y = sectionY + position.y;

    const { width: pageWidth } = this.doc.pageSize;
    const availableWidth = pageWidth - this.dimensions.margins.left - this.dimensions.margins.right;
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

  private calculateX(alignment: Alignment | number, width = 0): number {
    switch (alignment) {
      case 'center':
        return this.doc.pageSize.width / 2 - width / 2;
      case 'right':
        return this.doc.pageSize.width - this.dimensions.margins.right - width;
      case 'left':
      default:
        if (typeof alignment === 'number') {
          return this.dimensions.margins.left + alignment;
        }
        return this.dimensions.margins.left;
    }
  }

  private buildDimensions(): Dimensions {
    const { width, height } = this.doc.pageSize;
    const {
      columnCount,
      columnSpacing,
      minColumnWidth,
      maxColumnWidth,
    } = this.configuration.layout.sections.global;

    return new Dimensions(width, height, this.configuration.layout, {
      columnCount,
      columnSpacing,
      minColumnWidth,
      maxColumnWidth,
    });
  }

  private generateDimensionCacheKey(): string {
    const { width, height } = this.doc.pageSize;
    const { layout } = this.configuration;
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
      global.minColumnWidth || 0,
      global.maxColumnWidth || 0,
    ].join('-');
  }
}

export default JsPdfRenderer;
