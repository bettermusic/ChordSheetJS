interface FillOpts { fill?: boolean }
interface HeightOpts { height: number }
export interface PositionOpts { x: number, y: number }
export interface SizeOpts { size: number }
interface WidthOpts { width: number }
export type DimensionOpts = WidthOpts & HeightOpts;

export interface Renderer {
  circle({
    x, y, size, fill,
  }: PositionOpts & SizeOpts & FillOpts): void

  line({
    x1, y1, x2, y2, strokeWidth,
  }: { x1: number, y1: number, x2: number, y2: number, strokeWidth: number }): void

  rect({
    x, y, width, height,
  }: PositionOpts & DimensionOpts): void

  text(text: string, { fontSize, x, y } : { fontSize: number, x: number, y: number }): void;
}
