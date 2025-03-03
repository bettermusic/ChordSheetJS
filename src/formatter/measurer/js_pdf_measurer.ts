import { BaseMeasurer, TextDimensions } from './measurer';
import { FontConfiguration } from '../pdf_formatter/types';
import DocWrapper from '../pdf_formatter/doc_wrapper';

/**
 * Measures text using jsPDF
 */
export class JsPdfMeasurer extends BaseMeasurer {
  constructor(private doc: DocWrapper) {
    super();
  }

  measureText(text: string, fontConfig: FontConfiguration): TextDimensions {
    let result: TextDimensions;
    
    this.doc.withFontConfiguration(fontConfig, () => {
      const dimensions = this.doc.getTextDimensions(text);
      result = {
        width: dimensions.w,
        height: dimensions.h
      };
    });

    return result!;
  }
}
