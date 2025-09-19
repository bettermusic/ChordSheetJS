import { FontConfiguration } from '../../formatter/configuration';
import { BaseMeasurer, TextDimensions } from './measurer';

declare const document: any;
declare type CanvasRenderingContext2D = any;
declare type HTMLCanvasElement = any;

/**
 * Measures text using Canvas API
 */
export class CanvasMeasurer extends BaseMeasurer {
  private canvas: HTMLCanvasElement;

  private context: CanvasRenderingContext2D;

  constructor() {
    super();
    // Create canvas element in memory (no need to add to DOM)
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }
    this.context = ctx;
  }

  /**
   * Sets font configuration on the canvas context
   * @param fontConfig The font configuration to apply
   */
  private setFont(fontConfig: FontConfiguration): void {
    const {
      name, size, weight = 'normal', style = 'normal', letterSpacing,
    } = fontConfig;

    // Set basic font properties
    this.context.font = `${style} ${weight} ${size}px ${name}`;

    // Set additional text properties if supported
    if (letterSpacing !== undefined) {
      this.context.letterSpacing = letterSpacing;
    }
  }

  measureText(text: string, fontConfig: FontConfiguration): TextDimensions {
    this.setFont(fontConfig);

    const metrics = this.context.measureText(text);

    // Get width from metrics
    const { width } = metrics;

    // Calculate height based on font metrics or size
    // Note: For more accurate height calculation, we need font metrics
    let height: number;

    if (metrics.fontBoundingBoxAscent && metrics.fontBoundingBoxDescent) {
      // Modern browsers provide these metrics
      height = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
    } else if (metrics.actualBoundingBoxAscent && metrics.actualBoundingBoxDescent) {
      // Alternative metrics for this specific text
      height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    } else {
      // Fallback to approximation based on font size
      height = fontConfig.size * 1.2; // Common approximation
    }

    return { width, height };
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
        return; // Use return instead of continue in a forEach callback
      }

      const words = paragraph.split(' ');
      let currentLine = '';

      words.forEach((word) => {
        const testLine = currentLine.length === 0 ?
          word :
          `${currentLine} ${word}`;

        const metrics = this.context.measureText(testLine);

        if (metrics.width <= maxWidth) {
          // The word fits on the current line
          currentLine = testLine;
        } else if (currentLine.length > 0) {
          // Word doesn't fit, but current line has content
          // Push the current line and start a new one with the current word
          lines.push(currentLine);
          currentLine = word;
        } else {
          // The single word is too long for a line, we need to split it
          let partialWord = '';

          [...word].forEach((char) => {
            const testChar = partialWord + char;
            const charMetrics = this.context.measureText(testChar);

            if (charMetrics.width <= maxWidth) {
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
