import { Measurer } from '../measurer/measurer';
import { FontConfiguration } from '../pdf_formatter/types';
import Line from '../../chord_sheet/line';
import ChordLyricsPair from '../../chord_sheet/chord_lyrics_pair';
import Tag from '../../chord_sheet/tag';
import {
  isChordLyricsPair, isColumnBreak, isComment, isSoftLineBreak, isTag, lineHasContents, renderChord,
} from '../../template_helpers';
import SoftLineBreak from '../../chord_sheet/soft_line_break';
import Song from '../../chord_sheet/song';
import Paragraph from '../../chord_sheet/paragraph';
import { ParagraphSplitter } from './paragraph_splitter';
import {
  LineLayout, MeasuredItem, LayoutConfig, ParagraphLayoutResult,
} from './types';
import {
  calculateTotalHeight,
} from './layout_helpers';

export class LayoutEngine {
  private paragraphSplitter: ParagraphSplitter;

  constructor(
    private song: Song,
    private measurer: Measurer,
    private config: LayoutConfig,
  ) {
    this.song = song;
    this.measurer = measurer;
    this.config = config;

    // Initialize the paragraph splitter
    this.paragraphSplitter = new ParagraphSplitter();
  }

  public computeParagraphLayouts(): ParagraphLayoutResult[] {
    const layouts: ParagraphLayoutResult[] = [];

    // Initialize position tracking
    let currentY = this.config.minY;
    let currentColumn = 1;

    this.song.bodyParagraphs.forEach((paragraph) => {
      const lineLayouts = this.computeParagraphLayout(
        paragraph,
        this.config.columnWidth,
        this.config.displayLyricsOnly,
      );

      // Count various line types to determine if paragraph should be skipped
      const countChordLyricPairLines = lineLayouts.flat().filter(
        (ll) => ll.type === 'ChordLyricsPair',
      ).length;

      const countNonLyricLines = lineLayouts.flat().filter(
        (ll) => ll.type === 'Comment' || ll.type === 'SectionLabel',
      ).length;

      const skipParagraph = (
        countNonLyricLines === 1 &&
        countChordLyricPairLines === 0 &&
        this.config.displayLyricsOnly
      );

      if (!skipParagraph) {
        // Determine if column breaks are needed
        const totalHeight = calculateTotalHeight(lineLayouts);

        // Check if the entire paragraph fits in the current column
        let adjustedLayouts: LineLayout[][] = lineLayouts;

        if (currentY + totalHeight > this.config.columnBottomY) {
          // Paragraph doesn't fit entirely, use paragraph splitter
          adjustedLayouts = this.paragraphSplitter.splitParagraph(
            lineLayouts,
            currentY,
            this.config.minY,
            this.config.columnBottomY,
            countChordLyricPairLines,
          );
        }

        // Update simulated position based on content
        adjustedLayouts.forEach((lines) => {
          const hasColumnBreak = lines.length === 1 &&
                                 lines[0].items.length === 1 &&
                                 lines[0].items[0].item instanceof Tag &&
                                 isColumnBreak(lines[0].items[0].item);

          if (hasColumnBreak) {
            // Simulate column break
            currentColumn += 1;
            if (currentColumn > this.config.columnCount) {
              currentColumn = 1;
            }
            currentY = this.config.minY;
          } else {
            // Calculate height and update position
            const linesHeight = lines.reduce((sum, l) => sum + l.lineHeight, 0);
            currentY += linesHeight;
          }
        });

        // Add paragraph spacing in simulation
        currentY += this.config.paragraphSpacing;

        layouts.push({
          units: adjustedLayouts,
          addSpacing: true,
          sectionType: paragraph.type,
        });
      }
    });

    return layouts;
  }

  // Compute layout for a single paragraph
  private computeParagraphLayout(
    paragraph: Paragraph,
    availableWidth: number,
    lyricsOnly = false,
  ): LineLayout[][] {
    const paragraphLineLayouts: LineLayout[][] = [];

    paragraph.lines.forEach((line) => {
      if (lineHasContents(line)) {
        const lineLayouts = this.computeLineLayouts(line, availableWidth, lyricsOnly);
        paragraphLineLayouts.push(lineLayouts);
      }
    });

    return paragraphLineLayouts;
  }

  public computeLineLayouts(line: Line, availableWidth: number, lyricsOnly = false): LineLayout[] {
    const measuredItems = this.measureLineItems(line, lyricsOnly);
    const lines: LineLayout[] = [];
    let currentLine: MeasuredItem[] = [];
    let currentWidth = 0;
    let lastSoftLineBreakIndex = -1;
    let i = 0;

    while (i < measuredItems.length) {
      let item = measuredItems[i];
      let itemWidth = item.width;

      if (currentWidth + itemWidth > availableWidth) {
        let breakIndex = -1;

        if (lastSoftLineBreakIndex >= 0) {
          breakIndex = lastSoftLineBreakIndex;
          currentLine.splice(breakIndex, 1);
          currentWidth = currentLine.reduce((sum, mi) => sum + mi.width, 0);
        } else if (itemWidth > availableWidth) {
          const [firstPart, secondPart] = this.splitMeasuredItem(item, availableWidth - currentWidth);
          if (secondPart) {
            measuredItems.splice(i + 1, 0, secondPart);
          }
          item = firstPart;
          itemWidth = item.width;
          currentLine.push(item);
          currentWidth += itemWidth;
          i += 1;
          breakIndex = currentLine.length;
        } else if (currentLine.length === 0) {
          currentLine.push(item);
          currentWidth += itemWidth;
          i += 1;
          breakIndex = currentLine.length;
        } else {
          breakIndex = currentLine.length;
        }

        if (breakIndex >= 0) {
          const lineItems = currentLine.slice(0, breakIndex);
          const lastItem = lineItems[lineItems.length - 1];
          if (lastItem?.item instanceof ChordLyricsPair && lastItem.item.lyrics?.endsWith(',')) {
            lastItem.item.lyrics = lastItem.item.lyrics.slice(0, -1) || '';
            lastItem.width = this.measurer.measureTextWidth(lastItem.item.lyrics, this.config.fonts.lyrics);
          }

          lines.push(this.createLineLayout(lineItems, line));
          currentLine = currentLine.slice(breakIndex);
          currentWidth = currentLine.reduce((sum, mi) => sum + mi.width, 0);
          lastSoftLineBreakIndex = -1;

          // Capitalize next item's lyrics
          const nextItemWithLyrics = this.findNextItemWithLyrics(currentLine, measuredItems, i);
          if (nextItemWithLyrics && nextItemWithLyrics.item instanceof ChordLyricsPair) {
            const currentLyrics = nextItemWithLyrics.item.lyrics ?? '';
            nextItemWithLyrics.item.lyrics = this.capitalizeFirstWord(currentLyrics);
            nextItemWithLyrics.width = this.measurer.measureTextWidth(
              nextItemWithLyrics.item.lyrics, // Now guaranteed to be a string
              this.config.fonts.lyrics,
            );
          }
        }
      } else {
        currentLine.push(item);
        currentWidth += itemWidth;
        if (item.item instanceof SoftLineBreak) {
          lastSoftLineBreakIndex = currentLine.length - 1;
        }
        i += 1;
      }
    }

    if (currentLine.length > 0) {
      lines.push(this.createLineLayout(currentLine, line));
    }

    return lines;
  }

  private measureLineItems(line: Line, lyricsOnly = false): MeasuredItem[] {
    const items: MeasuredItem[] = [];

    for (let index = 0; index < line.items.length; index += 1) {
      const item = line.items[index];
      const nextItem = line.items[index + 1] ?? null;

      if (isChordLyricsPair(item)) {
        const pair = item as ChordLyricsPair;
        let lyrics = pair.lyrics || '';

        // Handle lyricsOnly mode
        if (lyricsOnly) {
          lyrics = this.removeHyphens(lyrics);
          if (nextItem && isChordLyricsPair(nextItem)) {
            const nextLyrics = (nextItem as ChordLyricsPair).lyrics || '';
            if (nextLyrics.startsWith(' -') || nextLyrics.startsWith('-')) {
              lyrics = lyrics.trimEnd();
              (nextItem as ChordLyricsPair).lyrics = this.removeHyphens(nextLyrics);
            }
          }
          if (lyrics === '') {
            items.push({ item: null, width: 0 });
          }
        }

        const splitItems = this.splitChordLyricsPair(pair);
        splitItems.forEach((splitItem) => {
          if (splitItem instanceof ChordLyricsPair) {
            let splitChords = splitItem.chords || '';
            let splitLyrics = splitItem.lyrics || '';

            if (lyricsOnly) {
              splitChords = ''; // No chords in lyricsOnly mode
              splitLyrics = this.removeHyphens(splitLyrics);
              if (splitLyrics === '') {
                items.push({ item: null, width: 0 });
                return;
              }
            }

            const nextItemHasChords = nextItem &&
              isChordLyricsPair(nextItem) &&
              (nextItem as ChordLyricsPair).chords?.trim() !== '';

            const renderedChords = renderChord(
              splitChords,
              line,
              this.song,
              {
                renderKey: null,
                useUnicodeModifier: this.config.useUnicodeModifiers,
                normalizeChords: this.config.normalizeChords,
              },
            );

            const chordFont = this.config.fonts.chord;
            const lyricsFont = this.config.fonts.lyrics;

            const chordWidth = renderedChords ? this.measurer.measureTextWidth(renderedChords, chordFont) : 0;
            const lyricsWidth = splitLyrics ? this.measurer.measureTextWidth(splitLyrics, lyricsFont) : 0;
            const spaceWidth = this.getSpaceWidth(lyricsFont);

            let adjustedChordWidth = chordWidth;
            if (!lyricsOnly && nextItemHasChords && chordWidth >= (lyricsWidth - spaceWidth)) {
              const spacing = this.getChordSpacingAsSpaces();
              adjustedChordWidth = this.measurer.measureTextWidth(renderedChords + spacing, chordFont);
            }

            const totalWidth = Math.max(adjustedChordWidth, lyricsWidth);
            const chordHeight = renderedChords ? this.measurer.measureTextHeight(renderedChords, chordFont) : 0;

            items.push({
              item: new ChordLyricsPair(splitChords, splitLyrics), // Use original chords without spacing
              width: totalWidth,
              chordHeight,
            });
          } else if (splitItem instanceof SoftLineBreak) {
            const width = this.measurer.measureTextWidth(splitItem.content, this.config.fonts.lyrics);
            items.push({ item: splitItem, width });
          }
        });
      } else if (isSoftLineBreak(item)) {
        const softLineBreak = item as SoftLineBreak;
        const width = this.measurer.measureTextWidth(softLineBreak.content, this.config.fonts.lyrics);
        items.push({ item: softLineBreak, width });
      } else if (isTag(item)) {
        const tag = item as Tag;
        if (isComment(tag) || tag.isSectionDelimiter()) {
          const font = isComment(tag) ? this.config.fonts.comment : this.config.fonts.sectionLabel;
          const columnWidth = this.config.width; // Adjust based on your context
          const tagText = tag.label || tag.value || '';
          const tagLines = this.measurer.splitTextToSize(tagText, columnWidth, font);

          tagLines.forEach((tagLine) => {
            const width = this.measurer.measureTextWidth(tagLine, font);
            items.push({ item: new Tag(tag.name, tagLine), width });
          });
        }
      } else {
        // TODO: add support for Literal
        items.push({ item: null, width: 0 });
      }
    }

    return items;
  }

  private removeHyphens(lyrics: string): string {
    let cleanedLyrics = lyrics;
    cleanedLyrics = lyrics.replace(/\b(\w+)\s*-\s*(\w+)\b/g, '$1$2');
    cleanedLyrics = cleanedLyrics.replace(/(?:\b(\w+)\s*-\s*$)|(?:-\s*$)|(?:\s+-\s+$)/g, '$1');
    if (/^\s*-\s*$/.test(cleanedLyrics)) {
      return '';
    }
    return cleanedLyrics;
  }

  private getChordSpacingAsSpaces(): string {
    return ' '.repeat(this.config.chordSpacing); // e.g., 2 spaces if chordSpacing is 2
  }

  private getSpaceWidth(fontConfig: FontConfiguration): number {
    return this.measurer.measureTextWidth(' ', fontConfig);
  }

  private createLineLayout(items: MeasuredItem[], line: Line): LineLayout {
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

  private splitChordLyricsPair(pair: ChordLyricsPair): (ChordLyricsPair | SoftLineBreak)[] {
    const { chords, lyrics, annotation } = pair;

    if (!lyrics || lyrics.trim() === '') {
      return [pair];
    }

    const lyricFragments = lyrics.split(/,\s*/);

    const items: (ChordLyricsPair | SoftLineBreak)[] = [];

    lyricFragments.forEach((fragment, index) => {
      if (index > 0 && index !== 0) {
        items.push(new SoftLineBreak(' '));
        if (fragment.trim() !== '') {
          items.push(new ChordLyricsPair('', fragment, ''));
        }
      }

      if (index === 0 && lyricFragments.length === 1) {
        items.push(new ChordLyricsPair(chords, fragment, annotation));
      } else if (index === 0 && lyricFragments.length > 1) {
        let commaAdjustedFragment = fragment;
        commaAdjustedFragment += ',';
        items.push(new ChordLyricsPair(chords, commaAdjustedFragment, annotation));
      }
    });

    return items;
  }

  private splitMeasuredItem(item: MeasuredItem, availableWidth: number): [MeasuredItem, MeasuredItem | null] {
    if (!(item.item instanceof ChordLyricsPair) || !item.item.lyrics) return [item, null];
    const { lyrics } = item.item;
    const lyricsFont = this.config.fonts.lyrics;
    const splitLines = this.measurer.splitTextToSize(lyrics, availableWidth, lyricsFont);
    if (splitLines.length === 1) return [item, null];

    const firstLyrics = splitLines[0];
    const secondLyrics = splitLines.slice(1).join(' ');
    return [
      {
        item: new ChordLyricsPair(item.item.chords, firstLyrics),
        width: this.measurer.measureTextWidth(firstLyrics, lyricsFont),
        chordHeight: item.chordHeight,
      },
      {
        item: new ChordLyricsPair('', secondLyrics),
        width: this.measurer.measureTextWidth(secondLyrics, lyricsFont),
        chordHeight: 0,
      },
    ];
  }

  private findNextItemWithLyrics(
    currentLine: MeasuredItem[],
    items: MeasuredItem[],
    index: number,
  ): MeasuredItem | null {
    const remainingItems = [...currentLine, ...items.slice(index)];
    return remainingItems.find((mi) => mi.item instanceof ChordLyricsPair && mi.item.lyrics?.trim()) || null;
  }

  private capitalizeFirstWord(lyrics: string): string {
    return lyrics.replace(/^\s*\w/, (c) => c.toUpperCase());
  }
}
