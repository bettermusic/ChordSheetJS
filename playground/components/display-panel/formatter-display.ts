import { formatterState } from '../../stores/formatter-store';
import { songState } from '../../stores/song-store';
import { APP_EVENTS, initStore } from '../../stores/init-store';
import { MeasuredHtmlFormatter, Song } from '../../../src';

/**
 * Web component for displaying formatted output
 */
export class FormatterDisplay extends HTMLElement {
  private contentContainer: HTMLDivElement | null = null;

  private initialized = false;

  private pdfBlobUrl: string | null = null;

  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    if (!this.initialized) {
      this.createInitialStructure();
      this.initialized = true;
    }

    this.setupEventListeners();

    // Set as ready
    initStore.setComponentReady('formatterDisplay', true);
  }

  disconnectedCallback() {
    this.removeEventListeners();

    // Clean up any blob URLs
    this.cleanupBlobUrls();

    // Disconnect resize observer if it exists
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Mark as not ready
    initStore.setComponentReady('formatterDisplay', false);
  }

  createInitialStructure() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
          // width: 300px;
          overflow: auto;
          padding: 16px;
          box-sizing: border-box;
          background-color: #fcfcfc;
          font-family: monospace;
          position: relative;
        }

        .content-container {
          font-family: inherit;
          height: 100%;
          width: 100%;
          overflow: auto; /* Enable scrolling for auto-height content */
        }

        .text-content {
          white-space: pre-wrap;
        }

        .formatter-info {
          position: absolute;
          top: 4px;
          right: 8px;
          font-size: 12px;
          color: #666;
          background-color: rgba(255, 255, 255, 0.8);
          padding: 2px 4px;
          border-radius: 4px;
          z-index: 10;
        }

        /* HTML-specific styling */
        .html-content {
          font-family: Arial, sans-serif;
        }

        /* PDF styling */
        .pdf-container {
          height: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .pdf-iframe {
          flex: 1;
          border: none;
          width: 100%;
          min-height: 500px;
          background-color: #f0f0f0;
        }

        .pdf-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          color: #333;
        }

        .pdf-loading .icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .pdf-error {
          color: #d32f2f;
          margin-top: 8px;
          text-align: center;
          padding: 8px;
          background-color: #ffebee;
          border-radius: 4px;
        }

        .no-content {
          display: flex;
          height: 100%;
          align-items: center;
          justify-content: center;
          color: #666;
          font-style: italic;
        }
      </style>

      <div class="formatter-info">${formatterState.currentFormatter}</div>
      <div class="content-container"></div>
    `;

    this.contentContainer = this.shadowRoot.querySelector('.content-container');

    // Initially update the display
    this.updateDisplay();
  }

  setupEventListeners() {
    // Listen for formatter changes
    document.addEventListener(APP_EVENTS.FORMATTER_CHANGED, this.handleFormatterChange);

    // Listen for formatter output updates
    document.addEventListener(
      'formatter-output-updated',
      this.handleOutputUpdate as unknown as (e: Event) => void,
    );

    // Listen for song key or capo changes
    document.addEventListener(APP_EVENTS.SONG_PARSED, this.handleSongParsed);

    // Listen for formatter configuration updates
    document.addEventListener(APP_EVENTS.FORMATTER_CONFIG_UPDATED, this.handleConfigUpdate);
  }

  removeEventListeners() {
    document.removeEventListener(APP_EVENTS.FORMATTER_CHANGED, this.handleFormatterChange);
    document.removeEventListener(
      'formatter-output-updated',
      this.handleOutputUpdate as unknown as (e: Event) => void,
    );
    document.removeEventListener(APP_EVENTS.SONG_PARSED, this.handleSongParsed);
    document.removeEventListener(APP_EVENTS.FORMATTER_CONFIG_UPDATED, this.handleConfigUpdate);
  }

  // Event handlers as arrow functions to preserve 'this' context
  handleFormatterChange = () => {
    console.log('Formatter changed, updating display');
    this.updateFormatterInfo();

    // Clean up any existing blob URLs
    this.cleanupBlobUrls();

    const { currentFormatter } = formatterState;

    if (currentFormatter === 'MeasuredHTML') {
      if (!this.resizeObserver) {
        this.resizeObserver = new ResizeObserver(() => {
          if (formatterState.currentFormatter === 'MeasuredHTML') {
            this.updateDisplay();
          }
        });
        this.resizeObserver.observe(this.contentContainer);
      }
    } else if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.updateDisplay();
  };

  handleOutputUpdate = (e: CustomEvent) => {
    if (e.detail && e.detail.content) {
      this.updateDisplay(e.detail.content);
    }
  };

  handleSongParsed = () => {
    // The formatter will handle updating the output in response to this event
    this.updateDisplay();
  };

  handleConfigUpdate = () => {
    const { currentFormatter } = formatterState;

    if (currentFormatter === 'PDF') {
      this.cleanupBlobUrls();
      this.generateAndDisplayPDF();
    } else if (currentFormatter === 'MeasuredHTML') {
      this.updateDisplay();
    }
    // For other formatters, the formatter-output-updated event will handle updates
  };

  // Update the formatter info in the UI
  updateFormatterInfo() {
    if (!this.shadowRoot) return;

    const infoElement = this.shadowRoot.querySelector('.formatter-info');
    if (infoElement) {
      infoElement.textContent = formatterState.currentFormatter;
    }
  }

  // Clean up any blob URLs to prevent memory leaks
  cleanupBlobUrls() {
    if (this.pdfBlobUrl) {
      URL.revokeObjectURL(this.pdfBlobUrl);
      this.pdfBlobUrl = null;
    }
  }

  // Generate PDF and display it in an iframe
  async generateAndDisplayPDF() {
    if (!this.contentContainer) return;

    // Show loading state
    this.contentContainer.innerHTML = `
      <div class="pdf-container">
        <div class="pdf-loading">
          <div class="icon">📄</div>
          <p>Generating PDF...</p>
          <p>Key: ${songState.key || 'None'}, Capo: ${songState.capo || '0'}</p>
        </div>
      </div>
    `;

    try {
      // Get the PDF formatter instance
      const pdfFormatter = formatterState.formatter_instances.PDF;

      if (!pdfFormatter || !songState.parsedSong) {
        throw new Error('PDF formatter or song not available');
      }

      // Format the song and generate PDF
      console.log('Formatting song for PDF generation');
      pdfFormatter.configure(formatterState.currentConfig).format(songState.parsedSong as Song);

      // Then generate the PDF as a blob
      const pdfBlob = await pdfFormatter.generatePDF();

      // Clean up any existing blob URLs
      this.cleanupBlobUrls();

      // Create a blob URL
      this.pdfBlobUrl = URL.createObjectURL(pdfBlob);

      // Display the PDF in an iframe
      this.contentContainer.innerHTML = `
        <div class="pdf-container">
          <iframe class="pdf-iframe" src="${this.pdfBlobUrl}" title="PDF Preview"></iframe>
        </div>
      `;

      console.log('PDF generated and displayed');
    } catch (error) {
      console.error('Error generating PDF:', error);

      // Show error state
      this.contentContainer.innerHTML = `
        <div class="pdf-container">
          <div class="pdf-loading">
            <div class="icon">❌</div>
            <p>PDF Generation Failed</p>
            <div class="pdf-error">${error instanceof Error ? error.message : 'Unknown error'}</div>
          </div>
        </div>
      `;
    }
  }

  // Public method to expose the content container for external use (e.g., TimestampManager)
  getContentContainer(): HTMLElement | null {
    return this.contentContainer;
  }

  // Dispatch a custom event when MeasuredHTML rendering completes
  dispatchRenderComplete() {
    const event = new CustomEvent('measured-html-rendered', {
      bubbles: true,
      composed: true,
      detail: { container: this.contentContainer },
    });
    this.dispatchEvent(event);
    console.log('Dispatched measured-html-rendered event');
  }

  // Update the displayed content
  updateDisplay(content?: string) {
    if (!this.contentContainer) return;

    const { currentFormatter } = formatterState;

    if (currentFormatter === 'PDF') {
      this.contentContainer.className = 'content-container';
      this.generateAndDisplayPDF();
    } else if (currentFormatter === 'MeasuredHTML') {
      let song = songState.parsedSong;
      if (song) {
        // Measure the container's dimensions
        const width = this.contentContainer.clientWidth;

        // Check if the container is visible
        if (width === 0) {
          // Delay update until the container is laid out
          setTimeout(() => this.updateDisplay(), 50);
          return;
        }

        // Merge stored config with dynamic pageSize
        // Use 'auto' height for continuous scrolling (needed for audio sync)
        const configWithPageSize = {
          ...formatterState.currentConfig,
          pageSize: { width, height: 'auto' },
        };

        const metadata = configWithPageSize.metadata || {};

        Object.entries(metadata).forEach(([key, value]) => {
          song = song.changeMetadata(key, value as string);
        });

        // Create and configure the formatter
        const formatter = new MeasuredHtmlFormatter(this.contentContainer);
        formatter.configure(configWithPageSize).format(song as Song);

        // Inject generated CSS for highlighting
        const generatedCSS = formatter.cssString();
        if (generatedCSS) {
          // Add or update the style element
          let styleElement = this.shadowRoot?.getElementById('formatter-generated-css') as HTMLStyleElement;
          if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'formatter-generated-css';
            this.shadowRoot?.appendChild(styleElement);
          }
          styleElement.textContent = generatedCSS;
        }

        // Dispatch event after rendering completes
        // Use setTimeout to ensure DOM updates are complete
        setTimeout(() => this.dispatchRenderComplete(), 0);
      } else {
        this.contentContainer.innerHTML = '<div class="no-content">No song to display</div>';
      }
    } else {
      const displayContent = content || formatterState.formattedOutput || '';

      if (currentFormatter === 'HTML') {
        this.contentContainer.className = 'content-container html-content';
        this.contentContainer.innerHTML = displayContent;
      } else {
        this.contentContainer.className = 'content-container text-content';
        if (displayContent.trim()) {
          this.contentContainer.textContent = displayContent;
        } else {
          this.contentContainer.innerHTML = '<div class="no-content">No content to display</div>';
        }
      }
    }
  }
}

// Register the web component
customElements.define('formatter-display', FormatterDisplay);
