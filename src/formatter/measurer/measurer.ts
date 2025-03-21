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

  /**
   * Splits text into lines that fit within the given width
   * @param text The text to split
   * @param maxWidth The maximum width of each line
   * @param fontConfig The font configuration to apply
   * @returns The lines of text
   */
  splitTextToSize(text: string, maxWidth: number, fontConfig: FontConfiguration): string[];
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

  abstract splitTextToSize(text: string, maxWidth: number, fontConfig: FontConfiguration): string[];
}
