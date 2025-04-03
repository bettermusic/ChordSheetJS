import { MeasurementBasedLayoutConfig, ColumnConfig, Margins } from '../configuration';

class Dimensions {
  pageWidth: number;

  pageHeight: number;

  layoutConfig: MeasurementBasedLayoutConfig;

  columns: ColumnConfig;

  constructor(
    pageWidth: number,
    pageHeight: number,
    layoutConfig: MeasurementBasedLayoutConfig,
    columns: ColumnConfig,
  ) {
    this.pageWidth = pageWidth;
    this.pageHeight = pageHeight;
    this.layoutConfig = layoutConfig;
    this.columns = columns;
  }

  get margins(): Margins {
    return this.layoutConfig.global.margins;
  }

  get minX() {
    return this.margins.left;
  }

  get maxX() {
    return this.pageWidth - this.margins.right;
  }

  get minY() {
    return this.margins.top + this.layoutConfig.header.height;
  }

  get maxY() {
    return this.pageHeight - this.margins.bottom;
  }

  get columnWidth(): number {
    const { columnCount, columnSpacing } = this.columns;

    const availableSpace = this.pageWidth - this.margins.left - this.margins.right;
    const totalColumnSpacing = (columnCount - 1) * columnSpacing;
    const columnWidth = (availableSpace - totalColumnSpacing) / columnCount;
    return columnWidth;
  }
}

export default Dimensions;
