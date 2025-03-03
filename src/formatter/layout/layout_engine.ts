import { Measurer } from '../measurer/measurer';
import { FontConfiguration } from '../pdf_formatter/types';
import Song from '../../chord_sheet/song';
import Line from '../../chord_sheet/line';
import ChordLyricsPair from '../../chord_sheet/chord_lyrics_pair';
import Tag from '../../chord_sheet/tag';
import Comment from '../../chord_sheet/comment';
import { isChordLyricsPair, isComment, isTag } from '../../template_helpers';

/**
 * Represents a break point in text for line wrapping
 */
export interface BreakPoint {
  index: number;
  type: 'space' | 'hyphen' | 'comma' | 'other';
}

/**
 * Represents a measured chord-lyrics pair with position information
 */
export interface MeasuredItem {
  item: ChordLyricsPair | Comment | Tag;
  text: string;
  chord?: string;
  textWidth: number;
  textHeight: number;
  chordWidth: number;
  chordHeight: number;
  xPosition: number;
  breakPoints: BreakPoint[];
}

/**
 * Represents a single line in the layout
 */
export interface LineLayout {
  lineIndex: number;
  type: string;
  totalWidth: number;
  totalHeight: number;
  fitsContainer: boolean;
  items: MeasuredItem[];
}

/**
 * Represents a paragraph in the layout
 */
export interface ParagraphLayout {
  paragraphIndex: number;
  lines: LineLayout[];
  totalHeight: number;
}

/**
 * Complete layout for a song
 */
export interface SongLayout {
  paragraphs: ParagraphLayout[];
  totalHeight: number;
}

/**
 * Configuration for the layout engine
 */
export interface LayoutConfig {
  width: number;
  fonts: {
    chord: FontConfiguration;
    lyrics: FontConfiguration;
    title: FontConfiguration;
    subtitle: FontConfiguration;
    comment: FontConfiguration;
    label: FontConfiguration;
  };
  chordSpacing: number;
}

export class LayoutEngine {
  constructor(
    private measurer: Measurer,
    private config: LayoutConfig
  ) {}

  /**
   * Compute a complete layout for a song
   */
  computeLayout(song: Song): SongLayout {
    const layout: SongLayout = {
      paragraphs: [],
      totalHeight: 0
    };

    song.paragraphs.forEach((paragraph, paragraphIndex) => {
      const paragraphLayout: ParagraphLayout = {
        paragraphIndex,
        lines: [],
        totalHeight: 0
      };

      paragraph.lines.forEach((line, lineIndex) => {
        if (this.lineHasContents(line)) {
          const lineLayout = this.computeLineLayout(line, lineIndex);
          paragraphLayout.totalHeight += lineLayout.totalHeight;
          paragraphLayout.lines.push(lineLayout);
        }
      });

      layout.paragraphs.push(paragraphLayout);
      layout.totalHeight += paragraphLayout.totalHeight;
    });

    return layout;
  }

  /**
   * Compute layout for a single line
   */
  private computeLineLayout(line: Line, lineIndex: number): LineLayout {
    const measuredItems = this.measureLineItems(line);
    
    // Calculate total dimensions
    let totalWidth = 0;
    let maxHeight = 0;
    
    measuredItems.forEach(item => {
      const itemWidth = Math.max(item.textWidth, item.chordWidth);
      totalWidth += itemWidth;
      maxHeight = Math.max(maxHeight, item.textHeight, item.chordHeight);
    });
    
    // Check if line fits container width
    const fitsContainer = totalWidth <= this.config.width;
    
    return {
      lineIndex,
      type: line.type || 'normal',
      totalWidth,
      totalHeight: maxHeight,
      fitsContainer,
      items: measuredItems
    };
  }

  /**
   * Measure all items in a line
   */
  private measureLineItems(line: Line): MeasuredItem[] {
    const items: MeasuredItem[] = [];
    let xPosition = 0;

    line.items.forEach(item => {
      if (isChordLyricsPair(item)) {
        const chordText = item.chords || '';
        const lyricText = item.lyrics || '';
        
        // Measure chord and lyric dimensions
        const chordDimensions = this.measurer.measureText(chordText, this.config.fonts.chord);
        const lyricDimensions = this.measurer.measureText(lyricText, this.config.fonts.lyrics);
        
        // Find break points in lyrics
        const breakPoints = this.findBreakPoints(lyricText);
        
        const measuredItem: MeasuredItem = {
          item,
          text: lyricText,
          chord: chordText,
          textWidth: lyricDimensions.width,
          textHeight: lyricDimensions.height,
          chordWidth: chordDimensions.width,
          chordHeight: chordDimensions.height,
          xPosition,
          breakPoints
        };
        
        items.push(measuredItem);
        
        // Update x position for next item, ensuring enough space for chord
        const itemWidth = Math.max(lyricDimensions.width, chordDimensions.width) + this.config.chordSpacing;
        xPosition += itemWidth;
      } else if (isComment(item)) {
        const commentText = item.comment || '';
        const dimensions = this.measurer.measureText(commentText, this.config.fonts.comment);
        
        items.push({
          item,
          text: commentText,
          textWidth: dimensions.width,
          textHeight: dimensions.height,
          chordWidth: 0,
          chordHeight: 0,
          xPosition,
          breakPoints: []
        });
        
        xPosition += dimensions.width + this.config.chordSpacing;
      } else if (isTag(item)) {
        const tagText = item.name || '';
        const dimensions = this.measurer.measureText(tagText, this.config.fonts.label);
        
        items.push({
          item,
          text: tagText,
          textWidth: dimensions.width,
          textHeight: dimensions.height,
          chordWidth: 0,
          chordHeight: 0,
          xPosition,
          breakPoints: []
        });
        
        xPosition += dimensions.width + this.config.chordSpacing;
      }
    });
    
    return items;
  }

  /**
   * Find potential break points in text for line wrapping
   */
  private findBreakPoints(text: string): BreakPoint[] {
    const breakPoints: BreakPoint[] = [];
    
    // Search for spaces, hyphens, and other potential break points
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char === ' ') {
        breakPoints.push({ index: i, type: 'space' });
      } else if (char === '-') {
        breakPoints.push({ index: i, type: 'hyphen' });
      } else if (char === ',') {
        breakPoints.push({ index: i, type: 'comma' });
      }
    }
    
    return breakPoints;
  }

  /**
   * Check if a line has any renderable contents
   */
  private lineHasContents(line: Line): boolean {
    if (!line.items || line.items.length === 0) {
      return false;
    }

    return line.items.some(item => {
      if (isChordLyricsPair(item)) {
        return !!(item.chords || item.lyrics);
      }
      if (isComment(item)) {
        return !!item.comment;
      }
      if (isTag(item)) {
        return !!item.name;
      }
      return false;
    });
  }
  
  /**
   * Apply line breaking based on container width
   * Creates new lines as needed for text that doesn't fit
   */
  applyLineBreaking(layout: SongLayout): SongLayout {
    const newLayout: SongLayout = {
      paragraphs: [],
      totalHeight: 0
    };
    
    layout.paragraphs.forEach(paragraph => {
      const newParagraph: ParagraphLayout = {
        paragraphIndex: paragraph.paragraphIndex,
        lines: [],
        totalHeight: 0
      };
      
      paragraph.lines.forEach(line => {
        // If the line fits, keep it as is
        if (line.fitsContainer) {
          newParagraph.lines.push(line);
          newParagraph.totalHeight += line.totalHeight;
        } else {
          // Line breaking logic for lines that don't fit
          const brokenLines = this.breakLine(line);
          brokenLines.forEach(brokenLine => {
            newParagraph.lines.push(brokenLine);
            newParagraph.totalHeight += brokenLine.totalHeight;
          });
        }
      });
      
      newLayout.paragraphs.push(newParagraph);
      newLayout.totalHeight += newParagraph.totalHeight;
    });
    
    return newLayout;
  }
  
  /**
   * Break a line that doesn't fit into multiple lines
   */
  private breakLine(line: LineLayout): LineLayout[] {
    // Implementation for line breaking algorithm
    // Based on the PDF formatter's line breaking logic
    // This is a simplified version - actual implementation would be more complex
    const lines: LineLayout[] = [];
    let currentLine: LineLayout = {
      lineIndex: line.lineIndex,
      type: line.type,
      totalWidth: 0,
      totalHeight: line.totalHeight,
      fitsContainer: true,
      items: []
    };
    
    let currentWidth = 0;
    
    line.items.forEach(item => {
      if (currentWidth + item.textWidth <= this.config.width) {
        // Item fits in the current line
        currentLine.items.push({
          ...item,
          xPosition: currentWidth
        });
        currentWidth += Math.max(item.textWidth, item.chordWidth) + this.config.chordSpacing;
      } else {
        // Need to find a break point and split the item
        // ... Complex breaking logic would go here
        // For now, just add the current line and start a new one
        
        lines.push(currentLine);
        
        currentLine = {
          lineIndex: line.lineIndex,
          type: line.type,
          totalWidth: 0,
          totalHeight: line.totalHeight,
          fitsContainer: true,
          items: [{ ...item, xPosition: 0 }]
        };
        
        currentWidth = Math.max(item.textWidth, item.chordWidth) + this.config.chordSpacing;
      }
    });
    
    // Add the last line if it has items
    if (currentLine.items.length > 0) {
      currentLine.totalWidth = currentWidth;
      lines.push(currentLine);
    }
    
    return lines;
  }
}
