import ChordLyricsPair from '../../chord_sheet/chord_lyrics_pair';
import Line from '../../chord_sheet/line';
import Tag from '../../chord_sheet/tag';
import { isComment } from '../../template_helpers';
import { LayoutConfig, LineLayout, MeasuredItem } from './types';

/**
 * Factory for creating different types of layouts
 */
export class LayoutFactory {
  private readonly config: LayoutConfig;

  constructor(config: LayoutConfig) {
    this.config = config;
  }

  /**
   * Create a line layout from measured items
   */
  createLineLayout(items: MeasuredItem[], line: Line): LineLayout {
    const hasChords = items.some((mi) => mi.item instanceof ChordLyricsPair && mi.item.chords);
    const hasLyrics = items.some((mi) => mi.item instanceof ChordLyricsPair && mi.item.lyrics?.trim());
    const hasComments = items.some((mi) => mi.item instanceof Tag && isComment(mi.item));
    const hasSectionLabel = items.some((mi) => mi.item instanceof Tag && (mi.item as Tag).isSectionDelimiter());

    let type: LineLayout['type'] = 'Empty';
    if (hasChords || hasLyrics) type = 'ChordLyricsPair';
    else if (hasComments) type = 'Comment';
    else if (hasSectionLabel) type = 'SectionLabel';
    else if (items.some((mi) => mi.item instanceof Tag)) type = 'Tag';

    const maxChordHeight = Math.max(...items.map((mi) => mi.chordHeight || 0));
    let baseHeight = this.config.linePadding;
    let fontConfiguration: { size: number; lineHeight?: number } | null = null;

    if (hasChords && hasLyrics) {
      fontConfiguration = this.config.fonts.lyrics;
      baseHeight += maxChordHeight + this.config.chordLyricSpacing + fontConfiguration.size;
    } else if (hasChords) {
      baseHeight += maxChordHeight;
      // No fontConfiguration needed since height is based solely on chords
    } else if (hasLyrics) {
      fontConfiguration = this.config.fonts.lyrics;
      baseHeight += fontConfiguration.size;
    } else if (hasComments) {
      fontConfiguration = this.config.fonts.comment;
      baseHeight += fontConfiguration.size;
    } else if (hasSectionLabel) {
      fontConfiguration = this.config.fonts.sectionLabel;
      baseHeight += fontConfiguration.size;
    }

    // Apply the line height factor if a font configuration is selected
    let lineHeightFactor = 1;
    if (fontConfiguration && fontConfiguration.lineHeight) {
      lineHeightFactor = fontConfiguration.lineHeight;
    }
    const lineHeight = baseHeight * lineHeightFactor;

    return {
      type,
      items,
      lineHeight,
      line,
    };
  }

  /**
   * Create a column break line layout
   */
  createColumnBreakLayout(): LineLayout {
    return {
      type: 'Tag',
      line: new Line(),
      items: [{ item: new Tag('column_break'), width: 0 }],
      lineHeight: 0,
    };
  }
}
