import Renderer, { PositionedElement } from './renderer';
import Song from '../chord_sheet/song';
import { FontConfiguration } from '../formatter/configuration';
import { MeasuredItem } from '../layout/engine';
import Dimensions from '../layout/engine/dimensions';
import ChordProParser from '../parser/chord_pro_parser';
import TextFormatter from '../formatter/text_formatter';
import { getCapos } from '../helpers';
import Metadata from '../chord_sheet/metadata';
import {
  Alignment,
  LayoutContentItem,
  LayoutContentItemWithImage,
  LayoutContentItemWithLine,
  LayoutContentItemWithText,
  LayoutSection,
  ConditionalRule,
} from '../formatter/configuration';
import Condition from '../layout/engine/condition';
import { MeasuredHtmlFormatterConfiguration } from '../formatter/configuration/measured_html_configuration';
import HtmlDocWrapper from './html_doc_wrapper';

declare const document: any;
declare type HTMLElement = any;

/**
 * HtmlRenderer renders a song as HTML with absolute positioning
 */
class PositionedHtmlRenderer extends Renderer {
  private configuration: MeasuredHtmlFormatterConfiguration;

  private _dimensions: Dimensions | null = null;

  private _dimensionCacheKey: string | null = null;

  container: HTMLElement;

  doc: HtmlDocWrapper;

  /**
   * Creates a new HtmlRenderer
   */
  constructor(
    song: Song,
    container: HTMLElement,
    configuration: MeasuredHtmlFormatterConfiguration,
  ) {
    super(song);
    this.container = container;
    this.configuration = configuration;

    if (!container) {
      throw new Error('Container element is required');
    }

    // Initialize the HTML wrapper
    this.doc = new HtmlDocWrapper(container, {
      width: this.configuration.pageSize.width,
      height: this.configuration.pageSize.height,
    });
  }

  //
  // PUBLIC API
  //

  /**
   * Gets the font configuration for a specific object type
   */
  getFontConfiguration(objectType: string): FontConfiguration {
    return this.configuration.fonts[objectType];
  }

  /**
   * Gets metadata about the document
   */
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
   * Gets the HTML wrapper
   */
  getDoc(): HtmlDocWrapper {
    return this.doc;
  }

  /**
   * Gets the HTML output container
   */
  getHTML(): HTMLElement {
    return this.container;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.doc) {
      this.doc.dispose();
    }
  }

  //
  // ABSTRACT METHOD IMPLEMENTATIONS
  //

  /**
   * Initializes the HTML backend
   */
  protected initializeBackend(): void {
    // Add custom CSS if provided in configuration
    if (this.configuration.additionalCss) {
      const styleElement = document.createElement('style');
      styleElement.textContent = this.configuration.additionalCss;
      document.head.appendChild(styleElement);
    }
  }

  /**
   * Creates a new page
   */
  protected createNewPage(): void {
    this.doc.newPage();
  }

  /**
   * Renders chord diagrams (stubbed)
   */
  protected renderChordDiagrams(): void {
    // STUB: This is a placeholder for chord diagram rendering

    // eslint-disable-next-line no-console
    console.log('Chord diagram rendering is stubbed out');

    // If we were implementing chord diagrams, we would:
    // 1. Get chord definitions from the song
    // 2. Create diagram elements
    // 3. Position them appropriately
    // 4. Add them to the document
  }

  /**
   * Renders headers and footers
   */
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

  /**
   * Measures text dimensions
   */
  protected measureText(text: string, font: FontConfiguration): { width: number; height: number } {
    const { w, h } = this.doc.getTextDimensions(text, font);
    return { width: w, height: h };
  }

  /**
   * Calculates the baseline position for chords
   */
  protected calculateChordBaseline(yOffset: number, items: MeasuredItem[], chordText: string): number {
    const chordFont = this.getFontConfiguration('chord');
    const { height } = this.measureText(chordText, chordFont);
    return yOffset + this.getMaxChordHeight(items) - height;
  }

  /**
   * Finalizes rendering by drawing all elements
   */
  protected finalizeRendering(): void {
    // Ensure we create enough pages for our content
    const pageCount = Math.max(this.currentPage, this.doc.totalPages);

    // Make sure we have the correct number of pages
    while (this.doc.totalPages < pageCount) {
      this.doc.createPage();
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
    return this.doc.pageSize.height === 'auto' ? 1000000 : this.doc.pageSize.height;
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
    return this.configuration.layout.sections.global.columnCount;
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
  // HTML-SPECIFIC METHODS
  //

  /**
   * Gets the dimensions of the document
   */
  get dimensions(): Dimensions {
    const currentKey = this.generateDimensionCacheKey();
    if (this._dimensionCacheKey !== currentKey || this._dimensions === null) {
      this._dimensions = this.buildDimensions();
      this._dimensionCacheKey = currentKey;
    }
    return this._dimensions;
  }

  /**
   * Draws an element on the current page
   */
  private drawElement(element: PositionedElement): void {
    switch (element.type) {
      case 'chord':
      case 'lyrics':
      case 'sectionLabel':
      case 'comment':
        this.drawTextElement(element);
        break;
      default:
        // eslint-disable-next-line no-console
        console.warn(`Unknown element type: ${element.type}`);
        break;
    }
  }

  /**
   * Draws a text element
   */
  private drawTextElement(element: PositionedElement): void {
    const htmlElement = document.createElement('div');

    // Set element class based on type and config
    const prefix = this.configuration.cssClassPrefix || 'chord-sheet-';
    htmlElement.className = `${prefix}element ${prefix}${element.type}`;

    // Apply custom class if provided in config
    if (this.configuration.cssClasses && this.configuration.cssClasses[element.type]) {
      htmlElement.classList.add(this.configuration.cssClasses[element.type]);
    }

    htmlElement.textContent = element.content;

    // Apply styling based on element type and style
    if (element.style) {
      this.applyElementStyle(htmlElement, element);
    }

    // Add the element to the page
    this.doc.addElement(htmlElement, element.x, element.y);
  }

  /**
   * Applies styles to an HTML element
   */
  private applyElementStyle(htmlElement: HTMLElement, element: PositionedElement): void {
    const { style } = element;

    // Base styles that apply to all elements
    const baseStyles = {
      whiteSpace: 'pre',
      lineHeight: style.lineHeight || 1,
    };

    // Conditional styles based on element properties
    const conditionalStyles = {
      ...(style.name && { fontFamily: style.name }),
      ...(style.size && { fontSize: `${style.size}px` }),
      ...(style.weight && { fontWeight: style.weight }),
      ...(style.style && { fontStyle: style.style }),
      ...(style.color && { color: style.color }),
      ...(style.underline && { textDecoration: 'underline' }),
    };

    // Element-specific styling based on type
    let typeSpecificStyles = {};

    switch (element.type) {
      case 'chord':
        typeSpecificStyles = {
          color: style.color || '#0066cc',
        };
        break;
      case 'sectionLabel':
        typeSpecificStyles = {
          fontWeight: style.weight || 'bold',
        };
        break;
      case 'comment':
        typeSpecificStyles = {
          fontStyle: style.style || 'italic',
          color: style.color || '#666666',
        };
        break;
      default:
        break;
    }

    // Apply all styles using Object.assign
    Object.assign(
      htmlElement.style,
      baseStyles,
      conditionalStyles,
      typeSpecificStyles,
    );
  }

  /**
   * Renders a layout item (header or footer)
   */
  private renderLayout(layoutConfig: any, section: LayoutSection): void {
    const { height } = layoutConfig;
    const { height: pageHeight } = this.doc.pageSize;
    const sectionY = section === 'header' ?
      this.dimensions.margins.top :
      pageHeight - height - this.dimensions.margins.bottom;

    layoutConfig.content.forEach((contentItem: any) => {
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

  /**
   * Determines if a content item should be rendered based on conditions
   */
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

  /**
   * Renders a text item
   */
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

    const { width: pageWidth } = this.doc.pageSize;
    const availableWidth = position.width ||
      (pageWidth - this.dimensions.margins.left - this.dimensions.margins.right);
    const y = sectionY + position.y;

    if (position.clip) {
      this.renderClippedText(textValue, position, availableWidth, y, style);
    } else {
      this.renderMultilineText(textValue, position, availableWidth, y, style);
    }
  }

  /**
   * Renders clipped text with optional ellipsis
   */
  private renderClippedText(
    textValue: string,
    position: any,
    availableWidth: number,
    y: number,
    style: FontConfiguration,
  ): void {
    const textElement = document.createElement('div');
    const prefix = this.configuration.cssClassPrefix || 'chord-sheet-';
    textElement.className = `${prefix}header-text`;
    this.applyFontStyle(textElement, style);

    if (position.ellipsis) {
      textElement.style.whiteSpace = 'nowrap';
      textElement.style.overflow = 'hidden';
      textElement.style.textOverflow = 'ellipsis';
      textElement.style.width = `${availableWidth}px`;
      textElement.textContent = textValue;
    } else {
      // Manual clipping without ellipsis
      let clippedText = textValue;
      let textWidth = this.doc.getTextWidth(clippedText, style);

      while (textWidth > availableWidth && clippedText.length > 0) {
        clippedText = clippedText.slice(0, -1);
        textWidth = this.doc.getTextWidth(clippedText, style);
      }

      textElement.textContent = clippedText;
    }

    const x = this.calculateX(position.x, availableWidth);
    this.doc.addElement(textElement, x, y);
  }

  /**
   * Renders multiline text
   */
  private renderMultilineText(
    textValue: string,
    position: any,
    availableWidth: number,
    y: number,
    style: FontConfiguration,
  ): void {
    const lines = this.doc.splitTextToSize(textValue, availableWidth, style);
    let tempY = y;

    lines.forEach((line: string) => {
      const textElement = document.createElement('div');
      const prefix = this.configuration.cssClassPrefix || 'chord-sheet-';
      textElement.className = `${prefix}header-text`;
      this.applyFontStyle(textElement, style);
      textElement.textContent = line;

      const lineWidth = this.doc.getTextWidth(line, style);
      const x = this.calculateX(position.x, lineWidth);

      this.doc.addElement(textElement, x, tempY);
      tempY += style.size * (style.lineHeight ?? 1.2);
    });
  }

  /**
   * Applies font styles to an HTML element
   */
  private applyFontStyle(element: HTMLElement, style: FontConfiguration): void {
    // Create a styles object with all conditional properties
    const styles = {
      whiteSpace: 'pre', // This is always applied
      ...(style.name && { fontFamily: `${style.name}` }),
      ...(style.size && { fontSize: `${style.size}px` }),
      ...(style.weight && { fontWeight: style.weight }),
      ...(style.style && { fontStyle: style.style }),
      ...(style.color && { color: style.color }),
      ...(style.underline && { textDecoration: 'underline' }),
      ...(style.lineHeight && { lineHeight: `${style.lineHeight}` }),
    };

    // Apply all styles at once
    Object.assign(element.style, styles);
  }

  /**
   * Renders an image
   */
  private renderImage(imageItem: LayoutContentItemWithImage, sectionY: number): void {
    const {
      src, position, size,
    } = imageItem;

    const imgElement = document.createElement('img');
    const prefix = this.configuration.cssClassPrefix || 'chord-sheet-';
    imgElement.className = `${prefix}image`;
    imgElement.src = src;
    imgElement.style.width = `${size.width}px`;
    imgElement.style.height = `${size.height}px`;

    const x = this.calculateX(position.x, size.width);
    const y = sectionY + position.y;

    this.doc.addElement(imgElement, x, y);
  }

  /**
   * Renders a line
   */
  private renderLine(lineItem: LayoutContentItemWithLine, sectionY: number): void {
    const { style, position } = lineItem;

    const lineElement = document.createElement('div');
    const prefix = this.configuration.cssClassPrefix || 'chord-sheet-';
    lineElement.className = `${prefix}line`;

    // Apply line styles
    lineElement.style.borderBottomWidth = `${style.width || 1}px`;
    lineElement.style.borderBottomStyle = style.dash ? 'dashed' : 'solid';
    lineElement.style.borderBottomColor = style.color || '#000000';

    const x = this.dimensions.margins.left + (position.x || 0);
    const y = sectionY + position.y;

    const { width: pageWidth } = this.doc.pageSize;
    const availableWidth = pageWidth - this.dimensions.margins.left - this.dimensions.margins.right;
    const lineWidth = position.width === 'auto' ? availableWidth : position.width;

    lineElement.style.width = `${lineWidth}px`;
    lineElement.style.height = `${position.height || 1}px`;

    this.doc.addElement(lineElement, x, y);
  }

  /**
   * Evaluates a template with metadata
   */
  private evaluateTemplate(template: string, metadata: Metadata): string {
    try {
      const parsed = new ChordProParser().parse(template);
      return new TextFormatter().format(parsed, metadata);
    } catch (e) {
      throw new Error(`Error evaluating template\n\n${template}\n\n: ${(e as Error).message}`);
    }
  }

  /**
   * Calculates the X position based on alignment
   */
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

  /**
   * Builds the dimensions object
   */
  private buildDimensions(): Dimensions {
    const { width, height } = this.doc.pageSize;
    const { columnCount, columnSpacing } = this.configuration.layout.sections.global;

    return new Dimensions(width, height, this.configuration.layout, { columnCount, columnSpacing });
  }

  /**
   * Generates a cache key for dimensions
   */
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
      layout.header?.height || 0,
      global.columnCount,
      global.columnSpacing,
    ].join('-');
  }

  /**
   * Gets extra metadata for templates
   */
  protected getExtraMetadata(page: number, totalPages: number): Record<string, number | string | string[]> {
    // Create base metadata
    const baseMetadata: Record<string, number | string | string[]> = {
      page,
      pages: totalPages,
      renderTime: this.renderTime,
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
}

export default PositionedHtmlRenderer;
