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
    const styles: string[] = [];
    const playbackConfig = this.configuration.layout.playback;
    
    if (!playbackConfig?.highlighted) {
      return '';
    }

    const prefix = this.configuration.cssClassPrefix || 'cs-';
    const highlightClass = `${prefix}highlighted`;
    const scopePrefix = scope ? `${scope} ` : '';

    // Container styles (border, background, etc.)
    if (playbackConfig.highlighted.container) {
      const containerStyles: string[] = [];
      const container = playbackConfig.highlighted.container;
      
      if (container.border) containerStyles.push(`border: ${container.border}`);
      if (container.borderRadius) containerStyles.push(`border-radius: ${container.borderRadius}`);
      if (container.backgroundColor) containerStyles.push(`background-color: ${container.backgroundColor}`);
      if (container.boxShadow) containerStyles.push(`box-shadow: ${container.boxShadow}`);
      if (container.padding) containerStyles.push(`padding: ${container.padding}`);
      
      if (containerStyles.length > 0) {
        styles.push(`${scopePrefix}.${highlightClass} { ${containerStyles.join('; ')}; }`);
      }
    }

    // Font styles for chord and text elements
    if (playbackConfig.highlighted.fonts) {
      const fonts = playbackConfig.highlighted.fonts;
      
      // Chord font overrides
      if (fonts.chord) {
        const chordStyles = this.generateFontStyles(fonts.chord);
        if (chordStyles.length > 0) {
          styles.push(`${scopePrefix}.${highlightClass} .${prefix}chord { ${chordStyles.join('; ')}; }`);
        }
      }
      
      // Text/lyrics font overrides
      if (fonts.text) {
        const textStyles = this.generateFontStyles(fonts.text);
        if (textStyles.length > 0) {
          styles.push(`${scopePrefix}.${highlightClass} .${prefix}lyrics { ${textStyles.join('; ')}; }`);
        }
      }
      
      // Section label font overrides
      if (fonts.sectionLabel) {
        const labelStyles = this.generateFontStyles(fonts.sectionLabel);
        if (labelStyles.length > 0) {
          styles.push(`${scopePrefix}.${highlightClass} .${prefix}sectionLabel { ${labelStyles.join('; ')}; }`);
        }
      }
      
      // Comment font overrides
      if (fonts.comment) {
        const commentStyles = this.generateFontStyles(fonts.comment);
        if (commentStyles.length > 0) {
          styles.push(`${scopePrefix}.${highlightClass} .${prefix}comment { ${commentStyles.join('; ')}; }`);
        }
      }
    }

    return styles.join('\n');
  }

  /**
   * Generates CSS property strings from font configuration
   */
  private generateFontStyles(fontConfig: Partial<any>): string[] {
    const styles: string[] = [];
    
    if (fontConfig.name) styles.push(`font-family: ${fontConfig.name}`);
    if (fontConfig.size) styles.push(`font-size: ${fontConfig.size}px`);
    if (fontConfig.weight) styles.push(`font-weight: ${fontConfig.weight}`);
    if (fontConfig.style) styles.push(`font-style: ${fontConfig.style}`);
    if (fontConfig.color) {
      const color = typeof fontConfig.color === 'number' 
        ? `#${fontConfig.color.toString(16).padStart(6, '0')}` 
        : fontConfig.color;
      styles.push(`color: ${color}`);
    }
    if (fontConfig.underline !== undefined) {
      styles.push(`text-decoration: ${fontConfig.underline ? 'underline' : 'none'}`);
    }
    if (fontConfig.textTransform) styles.push(`text-transform: ${fontConfig.textTransform}`);
    if (fontConfig.letterSpacing) styles.push(`letter-spacing: ${fontConfig.letterSpacing}`);
    
    return styles;
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
