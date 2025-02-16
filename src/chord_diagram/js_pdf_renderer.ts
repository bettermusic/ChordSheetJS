import {
  DimensionOpts, FillOpts, PositionOpts, RadiusOpts, Renderer, SizeOpts, ThicknessOpts,
} from './renderer';

import DocWrapper from '../formatter/pdf_formatter/doc_wrapper';

const defaultWidth = 272;
const defaultHeight = 568;

class JsPDFRenderer implements Renderer {
  doc: DocWrapper;

  readonly #x: number;

  readonly #y: number;

  readonly #scale: number;

  height: number;

  width: number;

  constructor(doc: DocWrapper, { x, y, width }: { x: number; y: number, width: number }) {
    this.doc = doc;
    this.#x = x;
    this.#y = y;
    this.#scale = width / defaultWidth;
    this.width = width;
    this.height = defaultHeight * this.#scale;
  }

  static calculateHeight(width: number): number {
    return defaultHeight * (width / defaultWidth);
  }

  scale(number: number) {
    return number * this.#scale;
  }

  tx(x: number) {
    return this.#x + this.scale(x);
  }

  ty(y: number) {
    return this.#y + this.scale(y);
  }

  circle({
    x, y, size, fill, thickness,
  }: FillOpts & PositionOpts & SizeOpts & ThicknessOpts) {
    this.withLineWidth(thickness, () => {
      this.doc.withDrawColor(0, () => {
        this.doc.circle(this.tx(x), this.ty(y), this.scale(size / 2), fill ? 'F' : 'S');
      });
    });
  }

  line({
    x1, y1, x2, y2, thickness,
  }: { x1: number, y1: number, x2: number, y2: number } & ThicknessOpts) {
    this.withLineWidth(thickness, () => {
      this.doc.withDrawColor(0, () => {
        this.doc.line(this.tx(x1), this.ty(y1), this.tx(x2), this.ty(y2));
      });
    });
  }

  rect({
    x, y, width, height, fill, thickness, radius,
  }: DimensionOpts & FillOpts & PositionOpts & RadiusOpts & ThicknessOpts) {
    this.withLineWidth(thickness, () => {
      this.doc.withDrawColor(0, () => {
        this.doc.roundedRect(
          this.tx(x),
          this.ty(y),
          this.scale(width),
          this.scale(height),
          this.scale(radius),
          this.scale(radius),
          fill ? 'F' : 'S',
        );
      });
    });
  }

  text(text: string, { fontSize, x, y }: { fontSize: number, x: number, y: number }) {
    this.withFontSize(fontSize, () => {
      const textDimensions = this.doc.getTextDimensions(text);
      this.doc.text(text, this.tx(x) - (textDimensions.w / 2), this.ty(y));
    });
  }

  withFontSize(fontSize: number, callback: () => void) {
    this.doc.withFontSize(this.scale(fontSize), callback);
  }

  withLineWidth(lineWidth: number, callback: () => void) {
    this.doc.withLineWidth(this.scale(lineWidth), callback);
  }
}

export default JsPDFRenderer;
