import {
  DimensionOpts, PositionOpts, Renderer, SizeOpts,
} from './renderer';

type ViewBox = [number, number, number, number];

class SVGRenderer implements Renderer {
  content = '';

  viewBox: ViewBox;

  constructor({ viewBox }: { viewBox: ViewBox }) {
    this.viewBox = viewBox;
  }

  output() {
    return this.svgWrapper(this.content);
  }

  svgWrapper(innerHTML: string) {
    return `
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      version="1.1" 
      xmlns:xlink="http://www.w3.org/1999/xlink" 
      xmlns:svgjs="http://svgjs.com/svgjs" 
      preserveAspectRatio="xMidYMid meet" 
      viewBox="0 0 400 596.3553184509277"
    >
      ${innerHTML}
    </svg>
  `;
  }

  circle({
    x, y, size, fill,
  }: PositionOpts & SizeOpts & { fill?: boolean }) {
    this.content += `
      <circle 
        r="${size / 2}" 
        cx="${x}"
        cy="${y}"
        fill="${fill ? '#000000' : 'none'}" 
        stroke-width="2" 
        stroke="#000000" 
      ></circle>
    `;
  }

  line({
    x1, y1, x2, y2, strokeWidth,
  }: {
    x1: number, y1: number, x2: number, y2: number, strokeWidth: number,
  }): void {
    this.content += `
      <line 
        x1="${x1}" 
        y1="${y1}" 
        x2="${x2}" 
        y2="${y2}" 
        stroke-width="${strokeWidth}"
        stroke="#000000"
      ></line>
    `;
  }

  rect({
    x, y, width, height,
  }: PositionOpts & DimensionOpts): void {
    this.content += `
      <rect 
        width="${width}"
        height="${height}"
        x="${x}"
        y="${y}"
        fill="#000000" 
        stroke-width="0" 
        stroke="#000000" 
        rx="15.600000000000001" 
        ry="15.600000000000001" 
      ></rect>
    `;
  }

  text(text: string, { fontSize, x, y } : { fontSize: number, x: number, y: number }): void {
    this.content += `
      <text 
        x="${x}" 
        y="${y}" 
        font-family="Arial, &quot;Helvetica Neue&quot;, Helvetica, sans-serif" 
        font-size="${fontSize}" 
        text-anchor="middle" 
        fill="#000000" 
      >${text}</text>
    `;
  }
}

export default SVGRenderer;
