import { BaseMeasurer, TextDimensions } from './measurer';
import { FontConfiguration } from '../pdf_formatter/types';

/**
 * Measures text using HTML5 Canvas API for client-side measurement
 */
export class CanvasMeasurer extends BaseMeasurer {
  private ctx: CanvasRenderingContext2D;
  private measureCache: Map<string, TextDimensions> = new Map();

  constructor() {
    super();
    // Create a canvas element for text measurement
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      this.ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    } else {
      throw new Error('CanvasMeasurer requires a browser environment with document support');
    }
  }

  measureText(text: string, fontConfig: FontConfiguration): TextDimensions {
    // Create cache key from text and font config
    const cacheKey = `${text}|${fontConfig.family}|${fontConfig.size}|${fontConfig.style || 'normal'}`;
    
    // Return cached result if available
    if (this.measureCache.has(cacheKey)) {
      return this.measureCache.get(cacheKey)!;
    }

    // Set font on canvas context
    const fontStyle = fontConfig.style || 'normal';
    this.ctx.font = `${fontStyle} ${fontConfig.size}px ${fontConfig.family}`;
    
    // Measure text width
    const metrics = this.ctx.measureText(text);
    
    // Calculate height (Canvas doesn't directly provide height)
    // Use font metrics or approximation based on font size
    let height: number;
    if (metrics.fontBoundingBoxAscent && metrics.fontBoundingBoxDescent) {
      height = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
    } else {
      // Approximate height as 1.2x font size if metrics not available
      const lineHeight = fontConfig.lineHeight || 1.2;
      height = fontConfig.size * lineHeight;
    }

    const dimensions: TextDimensions = {
      width: metrics.width,
      height
    };

    // Cache the result
    this.measureCache.set(cacheKey, dimensions);
    return dimensions;
  }
  
  /**
   * Clear the measurement cache
   */
  clearCache(): void {
    this.measureCache.clear();
  }
}
