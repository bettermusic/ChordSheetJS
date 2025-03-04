import { LineLayout, LayoutConfig } from './types';
import Tag from '../../chord_sheet/tag';
import { isColumnBreak } from '../../template_helpers';

/**
 * Create a column break line layout
 */
export function createColumnBreakLineLayout(): LineLayout {
  return {
    type: 'Tag',
    items: [{ item: new Tag('column_break'), width: 0 }],
    lineHeight: 0,
  };
}

/**
 * Calculate the total height of a set of line layouts
 */
export function calculateTotalHeight(lineLayouts: LineLayout[][]): number {
  return lineLayouts.reduce((sum, layouts) => {
    const layoutHeight = layouts.reduce((lineSum, layout) => lineSum + layout.lineHeight, 0);
    return sum + layoutHeight;
  }, 0);
}

/**
 * Check if a line layout represents a column break
 */
export function isColumnBreakLayout(lineLayout: LineLayout[]): boolean {
  return lineLayout.length === 1 &&
         lineLayout[0].items.length === 1 &&
         lineLayout[0].items[0].item instanceof Tag &&
         isColumnBreak(lineLayout[0].items[0].item);
}

/**
 * Update the position based on layout content
 */
export function updatePosition(
  layout: LineLayout[],
  currentY: number,
  currentColumn: number,
  config: LayoutConfig,
): { newY: number; newColumn: number } {
  if (isColumnBreakLayout(layout)) {
    // Column break
    const newColumn = currentColumn + 1 > config.columnCount ? 1 : currentColumn + 1;
    return {
      newY: config.minY,
      newColumn,
    };
  }
  // Normal layout
  const linesHeight = layout.reduce((sum, l) => sum + l.lineHeight, 0);
  return {
    newY: currentY + linesHeight,
    newColumn: currentColumn,
  };
}
