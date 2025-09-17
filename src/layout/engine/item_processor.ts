import Line from '../../chord_sheet/line';
import ChordLyricsPair from '../../chord_sheet/chord_lyrics_pair';
import Tag from '../../chord_sheet/tag';
import SoftLineBreak from '../../chord_sheet/soft_line_break';
import { FontConfiguration } from '../../formatter/configuration';
import { Measurer } from '../measurement/measurer';
import { LayoutConfig, MeasuredItem } from './types';
import Song from '../../chord_sheet/song';
import {
  isChordLyricsPair, isComment, isSoftLineBreak, isTag, renderChord,
} from '../../template_helpers';

/**
 * Processes and measures different types of items in a chord sheet
 */
export class ItemProcessor {
  // Use property declaration instead of constructor assignment
  public readonly measurer: Measurer;

  public readonly config: LayoutConfig;

  private readonly song: Song;

  // Use parameter properties to initialize class properties
  constructor(measurer: Measurer, config: LayoutConfig, song: Song) {
    this.measurer = measurer;
    this.config = config;
    this.song = song;
  }

  /**
   * Measure all items in a line
   */
  measureLineItems(line: Line, lyricsOnly = false): MeasuredItem[] {
    const items: MeasuredItem[] = [];

    for (let index = 0; index < line.items.length; index += 1) {
      const item = line.items[index];
      const nextItem = line.items[index + 1] ?? null;

      if (isChordLyricsPair(item)) {
        // Process chord-lyrics pair
        const processedItems = this.processChordLyricsPair(item as ChordLyricsPair, nextItem, line, lyricsOnly);
        items.push(...processedItems);
      } else if (isSoftLineBreak(item)) {
        // Process soft line break
        items.push(this.processSoftLineBreak(item as SoftLineBreak));
      } else if (isTag(item)) {
        // Process tag
        const processedTags = this.processTag(item as Tag);
        items.push(...processedTags);
      } else {
        // For now, add a placeholder for unsupported item types
        items.push({ item: null, width: 0 });
      }
    }

    return items;
  }

  /**
   * Process a chord-lyrics pair
   */
  processChordLyricsPair(pair: ChordLyricsPair, nextItemParam: any, line: Line, lyricsOnly = false): MeasuredItem[] {
    const items: MeasuredItem[] = [];
    let lyrics = pair.lyrics || '';
    const nextItem = nextItemParam;

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
        return items;
      }
    }

    // Split the chord-lyrics pair (e.g., on commas)
    const splitItems = this.splitChordLyricsPair(pair, lyricsOnly);

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
            decapo: this.config.decapo,
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
        items.push(this.processSoftLineBreak(splitItem));
      }
    });

    return items;
  }

  /**
   * Process a soft line break
   */
  processSoftLineBreak(softLineBreak: SoftLineBreak): MeasuredItem {
    const width = this.measurer.measureTextWidth(softLineBreak.content, this.config.fonts.lyrics);
    return { item: softLineBreak, width };
  }

  /**
   * Process a tag (comment or section delimiter)
   */
  processTag(tag: Tag): MeasuredItem[] {
    const items: MeasuredItem[] = [];

    if (isComment(tag) || tag.isSectionDelimiter()) {
      const font = isComment(tag) ? this.config.fonts.comment : this.config.fonts.sectionLabel;
      const columnWidth = this.config.width;
      const tagText = tag.label || tag.value || '';
      const tagLines = this.measurer.splitTextToSize(tagText, columnWidth, font);

      tagLines.forEach((tagLine) => {
        const width = this.measurer.measureTextWidth(tagLine, font);
        items.push({ item: new Tag(tag.name, tagLine), width });
      });
    } else {
      // For other types of tags (like column_break)
      items.push({ item: tag, width: 0 });
    }

    return items;
  }

  /**
   * Split a measured item if it doesn't fit in the available width
   */
  splitMeasuredItem(item: MeasuredItem, availableWidth: number): [MeasuredItem, MeasuredItem | null] {
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

  /**
   * Removes hyphens from lyrics for lyrics-only mode
   */
  removeHyphens(lyrics: string): string {
    let cleanedLyrics = lyrics;
    cleanedLyrics = lyrics.replace(/\b(\w+)\s*-\s*(\w+)\b/g, '$1$2');
    cleanedLyrics = cleanedLyrics.replace(/(?:\b(\w+)\s*-\s*$)|(?:-\s*$)|(?:\s+-\s+$)/g, '$1');
    if (/^\s*-\s*$/.test(cleanedLyrics)) {
      return '';
    }
    return cleanedLyrics;
  }

  /**
   * Split a chord-lyrics pair at natural break points (commas)
   */
  splitChordLyricsPair(pair: ChordLyricsPair, lyricsOnly = false): (ChordLyricsPair | SoftLineBreak)[] {
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
          // In lyricsOnly mode, remove leading space from fragments after line breaks
          const adjustedFragment = lyricsOnly ? fragment.trimStart() : fragment;
          items.push(new ChordLyricsPair('', adjustedFragment, ''));
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

  /**
   * Find the next item with lyrics
   */
  findNextItemWithLyrics(
    currentLine: MeasuredItem[],
    items: MeasuredItem[],
    index: number,
  ): MeasuredItem | null {
    const remainingItems = [...currentLine, ...items.slice(index)];
    return remainingItems.find((mi) => mi.item instanceof ChordLyricsPair && mi.item.lyrics?.trim()) || null;
  }

  /**
   * Capitalize the first word of lyrics
   */
  capitalizeFirstWord(lyrics: string): string {
    return lyrics.replace(/^\s*\w/, (c) => c.toUpperCase());
  }

  /**
   * Get the width of a space character
   */
  private getSpaceWidth(fontConfig: FontConfiguration): number {
    return this.measurer.measureTextWidth(' ', fontConfig);
  }

  /**
   * Get chord spacing as a string of spaces
   */
  private getChordSpacingAsSpaces(): string {
    return ' '.repeat(this.config.chordSpacing);
  }
}
