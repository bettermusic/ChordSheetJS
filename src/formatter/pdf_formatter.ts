import { Blob } from 'buffer';
import JsPDF from 'jspdf';

import Song from '../chord_sheet/song';
import { JsPdfMeasurer } from '../index';
import { PDFFormatterConfiguration } from './configuration';
import { LayoutConfig, LayoutEngine } from '../layout/engine';

import { PdfConstructor } from './pdf_formatter/types';
import { getPDFDefaultConfig } from './configuration/default_config_manager';
import MeasurementBasedFormatter from './measurement_based_formatter';
import JsPdfRenderer from '../rendering/js_pdf_renderer';

class PdfFormatter extends MeasurementBasedFormatter<PDFFormatterConfiguration> {
  private song: Song = new Song();

  private renderer: JsPdfRenderer | null = null;

  /**
   * Get the default configuration for PDF formatter
   */
  protected getDefaultConfiguration(): PDFFormatterConfiguration {
    return getPDFDefaultConfig();
  }

  /**
   * Formats a song into a PDF
   * @param {Song} song The song to format
   * @param {PdfConstructor} docConstructor The PDF document constructor
   */
  format(
    song: Song,
    docConstructor: PdfConstructor = JsPDF,
  ): void {
    this.song = song;

    // Create the PDF renderer
    this.renderer = new JsPdfRenderer(
      song,
      docConstructor,
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
      paragraphSpacing: this.configuration.layout.sections.global.paragraphSpacing || 0,
      columnBottomY: this.renderer.getContentBottomY(),
      displayLyricsOnly: !!this.configuration.layout.sections?.base?.display?.lyricsOnly,
    };

    // Return the layout engine
    return new LayoutEngine(
      this.song,
      new JsPdfMeasurer(this.renderer.getDoc()),
      layoutConfig,
    );
  }

  /**
   * Save the formatted document as a PDF file
   */
  save(): void {
    if (this.renderer) {
      this.renderer.save(`${this.song.title || 'untitled'}.pdf`);
    }
  }

  /**
   * Generate the PDF as a Blob object
   */
  async generatePDF(): Promise<Blob> {
    if (this.renderer) {
      return this.renderer.generatePDF();
    }
    throw new Error('Renderer not initialized');
  }
}

export default PdfFormatter;
