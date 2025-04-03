import { BaseMeasurer, TextDimensions } from './measurer';
import { FontConfiguration } from '../../formatter/configuration';
declare const document: any;
declare type HTMLElement = any;

/**
 * Measures text using DOM elements
 */
export class DomMeasurer extends BaseMeasurer {
  private measureElement: HTMLElement;

  constructor() {
    super();
    // Create an offscreen span element for measuring
    this.measureElement = document.createElement('span');

    // Set styles needed for accurate measurement
    Object.assign(this.measureElement.style, {
      position: 'absolute',
      visibility: 'hidden',
      whiteSpace: 'pre',
      padding: '0',
      margin: '0',
      border: 'none',
      left: '-9999px',
      top: '-9999px',
    });

    // Add to DOM for measuring
    document.body.appendChild(this.measureElement);
  }

  /**
   * Cleans up the DOM element when no longer needed
   */
  public dispose(): void {
    if (this.measureElement.parentNode) {
      this.measureElement.parentNode.removeChild(this.measureElement);
    }
  }

  /**
   * Sets font configuration on the measurement element
   * @param fontConfig The font configuration to apply
   */
  private setFont(fontConfig: FontConfiguration): void {
    const {
      name, size, weight = 'normal', style = 'normal',
    } = fontConfig;

    Object.assign(this.measureElement.style, {
      fontFamily: name,
      fontSize: `${size}px`,
      fontWeight: weight,
      fontStyle: style,
    });
  }

  measureText(text: string, fontConfig: FontConfiguration): TextDimensions {
    this.setFont(fontConfig);

    // Set the text content
    this.measureElement.textContent = text || '';

    // Get accurate measurements from the DOM
    const rect = this.measureElement.getBoundingClientRect();

    return {
      width: rect.width,
      height: rect.height,
    };
  }

  splitTextToSize(text: string, maxWidth: number, fontConfig: FontConfiguration): string[] {
    this.setFont(fontConfig);

    // Handle empty or null text
    if (!text) return [];

    const lines: string[] = [];
    const paragraphs = text.split(/\r?\n/); // Split text by line breaks

    paragraphs.forEach((paragraph) => {
      // Empty paragraph becomes an empty line
      if (paragraph.length === 0) {
        lines.push('');
        return;
      }

      const words = paragraph.split(' ');
      let currentLine = '';

      words.forEach((word) => {
        const testLine = currentLine.length === 0 ?
          word :
          `${currentLine} ${word}`;

        // Set text and measure
        this.measureElement.textContent = testLine;
        const testWidth = this.measureElement.getBoundingClientRect().width;

        if (testWidth <= maxWidth) {
          // The word fits on the current line
          currentLine = testLine;
        } else if (currentLine.length > 0) {
          // Push the current line and start a new one with the current word
          lines.push(currentLine);
          currentLine = word;
        } else {
          // The single word is too long for a line, we need to split it
          let partialWord = '';
          [...word].forEach((char) => {
            const testChar = partialWord + char;

            // Set text and measure
            this.measureElement.textContent = testChar;
            const charWidth = this.measureElement.getBoundingClientRect().width;

            if (charWidth <= maxWidth) {
              partialWord = testChar;
            } else if (partialWord.length > 0) {
              lines.push(partialWord);
              partialWord = char;
            } else {
              // Even a single character doesn't fit, but we must add it
              lines.push(char);
              partialWord = '';
            }
          });

          // Add any remaining part of the word
          if (partialWord.length > 0) {
            currentLine = partialWord;
          } else {
            currentLine = '';
          }
        }
      });

      // Add the last line if there's anything left
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
    });

    return lines;
  }
}
