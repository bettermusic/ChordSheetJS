import ChordLyricsPair from '../../chord_sheet/chord_lyrics_pair';
import Line from '../../chord_sheet/line';
import Tag from '../../chord_sheet/tag';
import { isComment } from '../../template_helpers';
import { LayoutConfig, LineLayout, MeasuredItem } from './types';

interface LineContentFlags {
  hasChords: boolean;
  hasLyrics: boolean;
  hasComments: boolean;
  hasSectionLabel: boolean;
  hasTag: boolean;
}

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
    const flags = this.analyzeLineContent(items);
    const type = this.determineLineType(flags);
    const maxChordHeight = Math.max(...items.map((mi) => mi.chordHeight || 0));
    const lineHeight = this.calculateLineHeight(flags, maxChordHeight);

    // Collect timestamps from line and inline items
    const timestamps = this.collectTimestamps(line, items);

    return {
      type, items, lineHeight, line, timestamps,
    };
  }

  /**
   * Collect timestamps from line and measured items
   */
  private collectTimestamps(line: Line, items: MeasuredItem[]): number[] | undefined {
    const timestamps: number[] = [];

    // Add line-level timestamps
    if (line.timestamps && line.timestamps.length > 0) {
      timestamps.push(...line.timestamps);
    }

    // Add inline timestamps from items
    items.forEach((item) => {
      if (item.timestamps && item.timestamps.length > 0) {
        timestamps.push(...item.timestamps);
      }
    });

    return timestamps.length > 0 ? timestamps : undefined;
  }

  private analyzeLineContent(items: MeasuredItem[]): LineContentFlags {
    return {
      hasChords: items.some((mi) => mi.item instanceof ChordLyricsPair && mi.item.chords),
      hasLyrics: items.some((mi) => mi.item instanceof ChordLyricsPair && mi.item.lyrics?.trim()),
      hasComments: items.some((mi) => mi.item instanceof Tag && isComment(mi.item)),
      hasSectionLabel: items.some((mi) => mi.item instanceof Tag && (mi.item as Tag).isSectionDelimiter()),
      hasTag: items.some((mi) => mi.item instanceof Tag),
    };
  }

  private determineLineType(flags: LineContentFlags): LineLayout['type'] {
    if (flags.hasChords || flags.hasLyrics) return 'ChordLyricsPair';
    if (flags.hasComments) return 'Comment';
    if (flags.hasSectionLabel) return 'SectionLabel';
    if (flags.hasTag) return 'Tag';
    return 'Empty';
  }

  private calculateLineHeight(flags: LineContentFlags, maxChordHeight: number): number {
    const { baseHeight, fontConfig } = this.getBaseHeightAndFont(flags, maxChordHeight);
    const lineHeightFactor = fontConfig?.lineHeight || 1;
    return baseHeight * lineHeightFactor;
  }

  private getBaseHeightAndFont(
    flags: LineContentFlags,
    maxChordHeight: number,
  ): { baseHeight: number; fontConfig: { size: number; lineHeight?: number } | null } {
    let baseHeight = this.config.linePadding;

    if (flags.hasChords && flags.hasLyrics) {
      const fontConfig = this.config.fonts.lyrics;
      baseHeight += maxChordHeight + this.config.chordLyricSpacing + fontConfig.size;
      return { baseHeight, fontConfig };
    }
    if (flags.hasChords) return { baseHeight: baseHeight + maxChordHeight, fontConfig: null };
    if (flags.hasLyrics) return this.addFontHeight(baseHeight, this.config.fonts.lyrics);
    if (flags.hasComments) return this.addFontHeight(baseHeight, this.config.fonts.comment);
    if (flags.hasSectionLabel) return this.addFontHeight(baseHeight, this.config.fonts.sectionLabel);

    return { baseHeight, fontConfig: null };
  }

  private addFontHeight(
    baseHeight: number,
    fontConfig: { size: number; lineHeight?: number },
  ): { baseHeight: number; fontConfig: { size: number; lineHeight?: number } } {
    return { baseHeight: baseHeight + fontConfig.size, fontConfig };
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
