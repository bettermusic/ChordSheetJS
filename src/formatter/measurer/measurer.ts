import { FontConfiguration } from '../pdf_formatter/types';

export interface TextDimensions {
  width: number;
  height: number;
}

export interface Measurer {
  /**
   * Measures the dimensions of text with the given font configuration
   * @param text The text to measure
   * @param fontConfig The font configuration to apply
   * @returns The dimensions of the text
   */
  measureText(text: string, fontConfig: FontConfiguration): TextDimensions;
  
  /**
   * Measures the width of text with the given font configuration
   * @param text The text to measure
   * @param fontConfig The font configuration to apply
   * @returns The width of the text
   */
  measureTextWidth(text: string, fontConfig: FontConfiguration): number;
  
  /**
   * Measures the height of text with the given font configuration
   * @param text The text to measure
   * @param fontConfig The font configuration to apply
   * @returns The height of the text
   */
  measureTextHeight(text: string, fontConfig: FontConfiguration): number;
}

/**
 * Base class for implementing measurers with common functionality
 */
export abstract class BaseMeasurer implements Measurer {
  abstract measureText(text: string, fontConfig: FontConfiguration): TextDimensions;
  
  measureTextWidth(text: string, fontConfig: FontConfiguration): number {
    return this.measureText(text, fontConfig).width;
  }
  
  measureTextHeight(text: string, fontConfig: FontConfiguration): number {
    return this.measureText(text, fontConfig).height;
  }
}
