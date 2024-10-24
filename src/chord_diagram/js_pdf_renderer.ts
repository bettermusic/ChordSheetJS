import JsPDF from 'jspdf';
import {
  DimensionOpts,
  FillOpts, PositionOpts, RadiusOpts, Renderer, SizeOpts, ThicknessOpts,
} from './renderer';

class JsPDFRenderer implements Renderer {
  doc: JsPDF;

  #x: number;

  #y: number;

  #scale: number;

  constructor(doc: JsPDF, { x, y, scale }: { x: number; y: number, scale: number }) {
    this.doc = doc;
    this.#x = x;
    this.#y = y;
    this.#scale = scale;
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
      this.withDrawColor(0, () => {
        this.doc.circle(this.tx(x), this.ty(y), this.scale(size / 2), fill ? 'F' : 'S');
      });
    });
  }

  line({
    x1, y1, x2, y2, thickness,
  }: { x1: number, y1: number, x2: number, y2: number } & ThicknessOpts) {
    this.withLineWidth(thickness, () => {
      this.withDrawColor(0, () => {
        this.doc.line(this.tx(x1), this.ty(y1), this.tx(x2), this.ty(y2));
      });
    });
  }

  rect({
    x, y, width, height, fill, thickness, radius,
  }: DimensionOpts & FillOpts & PositionOpts & RadiusOpts & ThicknessOpts) {
    this.withLineWidth(thickness, () => {
      this.withDrawColor(0, () => {
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
    const previousFontSize = this.doc.getFontSize();
    this.doc.setFontSize(this.scale(fontSize));
    this.doc.text(text, this.tx(x), this.ty(y));
    this.doc.setFontSize(previousFontSize);
  }

  withDrawColor(drawColor: number, callback: () => void) {
    const previousDrawColor = this.doc.getDrawColor();
    this.doc.setDrawColor(drawColor);
    callback();
    this.doc.setDrawColor(previousDrawColor);
  }

  withFillColor(fillColor: string, callback: () => void) {
    const previousFillColor = this.doc.getFillColor();
    this.doc.setFillColor(fillColor);
    callback();
    this.doc.setFillColor(previousFillColor);
  }

  withLineWidth(lineWidth: number, callback: () => void) {
    const previousLineWidth = this.doc.getLineWidth();
    this.doc.setLineWidth(this.scale(lineWidth));
    callback();
    this.doc.setLineWidth(previousLineWidth);
  }
}

export default JsPDFRenderer;
