import { DomMeasurer } from '../layout/measurement';
import { MeasuredHtmlFormatterConfiguration } from './configuration';
import MeasurementBasedFormatter from './measurement_based_formatter';
import PositionedHtmlRenderer from '../rendering/html/positioned_html_renderer';
import Song from '../chord_sheet/song';
import { getMeasuredHtmlDefaultConfig } from './configuration/default_config_manager';
import { LayoutConfig, LayoutEngine } from '../layout/engine';

declare type HTMLElement = any;

/**
 * MeasuredHtmlFormatter formats a song into HTML with absolute positioning.
 */
class MeasuredHtmlFormatter extends MeasurementBasedFormatter<MeasuredHtmlFormatterConfiguration> {
  private song: Song = new Song();

  private renderer: PositionedHtmlRenderer | null = null;

  private readonly container: HTMLElement;

  /**
   * Creates a new HTML formatter
   * @param container The HTML container element to render into
   */
  constructor(container: HTMLElement) {
    super();
    this.container = container;
  }

  /**
   * Get the default configuration for HTML formatter
   */
  protected getDefaultConfiguration(): MeasuredHtmlFormatterConfiguration {
    return getMeasuredHtmlDefaultConfig();
  }

  /**
   * Formats a song into HTML with absolute positioning.
   * @param song - The song to format.
   */
  format(song: Song): void {
    this.song = song;

    // Clear the container
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }

    // Create the HTML renderer
    this.renderer = new PositionedHtmlRenderer(
      song,
      this.container,
      this.configuration,
    );

    // Initialize the renderer
    this.renderer.initialize();

    // Create the layout engine
    const layoutEngine = this.createLayoutEngine();

    // Compute paragraph layouts
    const paragraphLayouts = layoutEngine.computeParagraphLayouts();

    // Render everything with a single call
    this.renderer.render(paragraphLayouts);
  }

  /**
   * Create the layout engine with the appropriate configuration
   */
  // eslint-disable-next-line max-lines-per-function
  private createLayoutEngine(): LayoutEngine {
    if (!this.renderer) {
      throw new Error('Renderer not initialized');
    }

    // Get dimensions and metadata from the renderer
    const rendererMetadata = this.renderer.getDocumentMetadata();
    const { dimensions } = rendererMetadata;

    // Create the layout configuration
    const layoutConfig: LayoutConfig = {
      width: dimensions.columnWidth,
      fonts: {
        chord: this.configuration.fonts.chord,
        lyrics: this.configuration.fonts.text,
        comment: this.configuration.fonts.comment,
        sectionLabel: this.configuration.fonts.sectionLabel,
      },
      chordSpacing: this.configuration.layout.sections.global.chordSpacing,
      chordLyricSpacing: this.configuration.layout.sections.global.chordLyricSpacing,
      linePadding: this.configuration.layout.sections.global.linePadding,
      useUnicodeModifiers: this.configuration.useUnicodeModifiers,
      normalizeChords: this.configuration.normalizeChords,

      // Column and page layout information
      minY: dimensions.minY,
      columnWidth: dimensions.columnWidth,
      columnCount: this.configuration.layout.sections.global.columnCount,
      columnSpacing: this.configuration.layout.sections.global.columnSpacing,
      minColumnWidth: this.configuration.layout.sections.global.minColumnWidth,
      maxColumnWidth: this.configuration.layout.sections.global.maxColumnWidth,
      paragraphSpacing: this.configuration.layout.sections.global.paragraphSpacing || 0,
      columnBottomY: this.renderer.getContentBottomY(),
      displayLyricsOnly: !!this.configuration.layout.sections?.base?.display?.lyricsOnly,
      decapo: this.configuration.decapo,
      repeatedSections: this.configuration.layout.sections?.base?.display?.repeatedSections,
    };

    // Return the layout engine
    return new LayoutEngine(
      this.song,
      new DomMeasurer(),
      layoutConfig,
    );
  }

  /**
   * Gets the HTML output
   */
  getHTML(): HTMLElement {
    if (!this.renderer) {
      throw new Error('Renderer not initialized');
    }
    return this.renderer.getHTML();
  }

  /**
   * Generates HTML as a string
   */
  getHTMLString(): string {
    if (!this.renderer) {
      throw new Error('Renderer not initialized');
    }
    return this.renderer.getHTML().outerHTML;
  }

  /**
   * Generates CSS string for the highlighted state based on playback config
   * @param scope Optional CSS scope selector
   * @returns CSS string
   */
  cssString(scope = ''): string {
    const playbackConfig = this.configuration.layout.playback;
    if (!playbackConfig?.highlighted) return '';

    const prefix = this.configuration.cssClassPrefix || 'cs-';
    const highlightClass = `${prefix}highlighted`;
    const scopePrefix = scope ? `${scope} ` : '';

    const styles: string[] = [];
    this.addContainerStyles(styles, playbackConfig.highlighted.container, scopePrefix, highlightClass);
    this.addFontStyles(styles, playbackConfig.highlighted.fonts, scopePrefix, highlightClass, prefix);

    return styles.join('\n');
  }

  private addContainerStyles(
    styles: string[],
    container: any,
    scopePrefix: string,
    highlightClass: string,
  ): void {
    if (!container) return;
    const props: string[] = [];
    if (container.border) props.push(`border: ${container.border}`);
    if (container.borderRadius) props.push(`border-radius: ${container.borderRadius}`);
    if (container.backgroundColor) props.push(`background-color: ${container.backgroundColor}`);
    if (container.boxShadow) props.push(`box-shadow: ${container.boxShadow}`);
    if (container.padding) props.push(`padding: ${container.padding}`);
    if (props.length > 0) styles.push(`${scopePrefix}.${highlightClass} { ${props.join('; ')}; }`);
  }

  private addFontStyles(
    styles: string[],
    fonts: any,
    scopePrefix: string,
    highlightClass: string,
    prefix: string,
  ): void {
    if (!fonts) return;
    const fontMap = {
      chord: 'chord',
      text: 'lyrics',
      sectionLabel: 'sectionLabel',
      comment: 'comment',
    };
    Object.entries(fontMap).forEach(([key, cssClass]) => {
      if (fonts[key]) {
        const fontStyles = this.generateFontStyles(fonts[key]);
        if (fontStyles.length > 0) {
          styles.push(`${scopePrefix}.${highlightClass} .${prefix}${cssClass} { ${fontStyles.join('; ')}; }`);
        }
      }
    });
  }

  /**
   * Generates CSS properties from font config.
   * Note: Properties that affect text width (weight, size, name, style, letterSpacing)
   * may cause layout issues with absolute positioning when used for highlighting.
   * Safe properties: color, underline, textDecoration
   */
  private generateFontStyles(fontConfig: Partial<any>): string[] {
    const styles: string[] = [];
    const imp = ' !important';
    if (fontConfig.name) styles.push(`font-family: ${fontConfig.name}${imp}`);
    if (fontConfig.size) styles.push(`font-size: ${fontConfig.size}px${imp}`);
    if (fontConfig.weight !== undefined) styles.push(`font-weight: ${fontConfig.weight}${imp}`);
    if (fontConfig.style) styles.push(`font-style: ${fontConfig.style}${imp}`);
    if (fontConfig.color) styles.push(`color: ${this.formatColor(fontConfig.color)}${imp}`);
    if (fontConfig.underline !== undefined) {
      styles.push(`text-decoration: ${fontConfig.underline ? 'underline' : 'none'}${imp}`);
    }
    if (fontConfig.textTransform) styles.push(`text-transform: ${fontConfig.textTransform}${imp}`);
    if (fontConfig.letterSpacing) styles.push(`letter-spacing: ${fontConfig.letterSpacing}${imp}`);
    return styles;
  }

  private formatColor(color: string | number): string {
    return typeof color === 'number' ? `#${color.toString(16).padStart(6, '0')}` : color;
  }

  /**
   * Clean up resources when the formatter is no longer needed
   */
  dispose(): void {
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
  }
}

export default MeasuredHtmlFormatter;
