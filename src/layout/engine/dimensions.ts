import { ColumnConfig, Margins, MeasurementBasedLayoutConfig } from '../../formatter/configuration';

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

  /**
   * Calculates the optimal number of columns based on available width and column constraints
   */
  calculateOptimalColumnCount(
    availableWidth: number,
    columnSpacing: number,
    minColumnWidth?: number,
    maxColumnWidth?: number,
  ): number {
    // If no constraints are provided, default to single column
    if (!minColumnWidth && !maxColumnWidth) {
      return 1;
    }

    // If only maxColumnWidth is provided, fit as many columns as possible
    if (maxColumnWidth && !minColumnWidth) {
      return Math.max(
        1,
        Math.floor((availableWidth + columnSpacing) / (maxColumnWidth + columnSpacing)),
      );
    }

    // If only minColumnWidth is provided, fit as many columns as possible
    // while ensuring each column meets the minimum width requirement
    if (minColumnWidth && !maxColumnWidth) {
      // For n columns, we need: n * minColumnWidth + (n-1) * columnSpacing <= availableWidth
      // Solving for n: n <= (availableWidth + columnSpacing) / (minColumnWidth + columnSpacing)
      const maxColumns = Math.floor((availableWidth + columnSpacing) / (minColumnWidth + columnSpacing));

      // Verify the calculation by checking if the columns actually fit
      const actualColumns = Math.max(1, maxColumns);
      const totalSpacingNeeded = (actualColumns - 1) * columnSpacing;
      const totalWidthNeeded = actualColumns * minColumnWidth + totalSpacingNeeded;

      // If our calculation is correct, this should always be true, but let's be safe
      if (totalWidthNeeded <= availableWidth) {
        return actualColumns;
      }

      // Fallback: try one less column
      return Math.max(1, actualColumns - 1);
    }

    // Both constraints provided - find the optimal column count
    if (minColumnWidth && maxColumnWidth) {
      // Start with the minimum number of columns that respect minColumnWidth
      const maxPossibleColumns = Math.floor(
        (availableWidth + columnSpacing) / (minColumnWidth + columnSpacing),
      );

      // Test each possible column count to find the best fit
      for (let columnCount = 1; columnCount <= maxPossibleColumns; columnCount += 1) {
        const totalSpacing = (columnCount - 1) * columnSpacing;
        const columnWidth = (availableWidth - totalSpacing) / columnCount;

        // If this column width fits within our constraints, it's valid
        if (columnWidth >= minColumnWidth && columnWidth <= maxColumnWidth) {
          // Check if the next column count would still be valid
          const nextColumnCount = columnCount + 1;
          const nextTotalSpacing = (nextColumnCount - 1) * columnSpacing;
          const nextColumnWidth = (availableWidth - nextTotalSpacing) / nextColumnCount;

          // If the next column count would be too narrow, use current count
          if (nextColumnWidth < minColumnWidth) {
            return columnCount;
          }
        } else if (columnWidth < minColumnWidth) {
          // This and higher column counts will be too narrow
          return Math.max(1, columnCount - 1);
        }
      }

      return Math.max(1, maxPossibleColumns);
    }

    return 1;
  }

  /**
   * Calculates the effective column spacing, adjusting it when columns would exceed maxColumnWidth
   * Note: Single columns are not constrained by maxColumnWidth and use full available width
   * When only minColumnWidth is specified, columns expand to fill available space equally
   */
  calculateEffectiveColumnSpacing(
    columnCount: number,
    availableWidth: number,
    baseColumnSpacing: number,
    maxColumnWidth?: number,
    minColumnWidth?: number,
  ): number {
    // Single columns use full width regardless of constraints
    if (columnCount <= 1) {
      return baseColumnSpacing;
    }

    // When only minColumnWidth is specified, keep base spacing and let columns expand
    if (minColumnWidth && !maxColumnWidth) {
      return baseColumnSpacing;
    }

    // When maxColumnWidth is specified, adjust spacing if columns would be too wide
    if (maxColumnWidth) {
      // Calculate what the column width would be with base spacing
      const baseTotalSpacing = (columnCount - 1) * baseColumnSpacing;
      const baseColumnWidth = (availableWidth - baseTotalSpacing) / columnCount;

      // If columns would be larger than maxColumnWidth, add the difference to spacing
      if (baseColumnWidth > maxColumnWidth) {
        const excessWidth = baseColumnWidth - maxColumnWidth;
        const totalExcessWidth = excessWidth * columnCount;
        const additionalSpacingPerGap = totalExcessWidth / (columnCount - 1);

        return baseColumnSpacing + additionalSpacingPerGap;
      }
    }

    return baseColumnSpacing;
  }

  get effectiveColumnCount(): number {
    const {
      columnCount,
      columnSpacing,
      minColumnWidth,
      maxColumnWidth,
    } = this.columns;

    // Calculate available space for columns
    const { left, right } = this.margins;
    const availableSpace = this.pageWidth - left - right;

    // If min/max constraints are provided, always calculate optimal column count
    // This ensures we maximize columns when only minColumnWidth is specified
    if (minColumnWidth || maxColumnWidth) {
      return this.calculateOptimalColumnCount(
        availableSpace,
        columnSpacing,
        minColumnWidth,
        maxColumnWidth,
      );
    }

    // If columnCount is explicitly set and no constraints, use it directly
    if (columnCount) {
      return columnCount;
    }

    // Fallback to configured column count
    return columnCount || 1;
  }

  get effectiveColumnSpacing(): number {
    const effectiveCount = this.effectiveColumnCount;
    const { left, right } = this.margins;
    const availableSpace = this.pageWidth - left - right;
    const baseSpacing = this.columns.columnSpacing;
    const { maxColumnWidth, minColumnWidth } = this.columns;

    return this.calculateEffectiveColumnSpacing(
      effectiveCount,
      availableSpace,
      baseSpacing,
      maxColumnWidth,
      minColumnWidth,
    );
  }

  get columnWidth(): number {
    const effectiveCount = this.effectiveColumnCount;
    const spacing = this.effectiveColumnSpacing;

    const { left, right } = this.margins;
    const availableSpace = this.pageWidth - left - right;
    const totalColumnSpacing = (effectiveCount - 1) * spacing;
    const columnWidth = (availableSpace - totalColumnSpacing) / effectiveCount;

    const { maxColumnWidth, minColumnWidth } = this.columns;

    // Single columns should use the full available width
    if (effectiveCount === 1) {
      return columnWidth;
    }

    // When only minColumnWidth is specified, columns expand to fill space equally
    if (minColumnWidth && !maxColumnWidth) {
      return columnWidth; // Let columns expand beyond minColumnWidth to fill space
    }

    // When maxColumnWidth is specified, enforce the constraint for multiple columns
    if (maxColumnWidth && columnWidth > maxColumnWidth && effectiveCount > 1) {
      return maxColumnWidth;
    }

    return columnWidth;
  }
}

export default Dimensions;
