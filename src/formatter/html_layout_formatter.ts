import Song from '../chord_sheet/song';
import Formatter from './formatter';
import { CanvasMeasurer } from './measurer/canvas_measurer';
import { LayoutEngine, SongLayout } from './layout/layout_engine';
import { isChordLyricsPair, isComment, isTag } from '../template_helpers';

export interface HtmlLayoutFormatterOptions {
  width?: number;
  fonts?: {
    chord?: {
      family?: string;
      size?: number;
      style?: string;
    };
    lyrics?: {
      family?: string;
      size?: number;
      style?: string;
    };
    title?: {
      family?: string;
      size?: number;
      style?: string;
    };
    subtitle?: {
      family?: string;
      size?: number;
      style?: string;
    };
    comment?: {
      family?: string;
      size?: number;
      style?: string;
    };
    label?: {
      family?: string;
      size?: number;
      style?: string;
    };
  };
  chordSpacing?: number;
  renderChords?: boolean;
  cssPrefix?: string;
  transposeKey?: string;
}

/**
 * Formatter that produces HTML output with precise layout based on text measurements
 */
export default class HtmlLayoutFormatter extends Formatter {
  private measurer: CanvasMeasurer;
  private layoutEngine: LayoutEngine;
  private layout: SongLayout | null = null;
  private cssPrefix: string;
  private renderChords: boolean;

  constructor(options: HtmlLayoutFormatterOptions = {}) {
    super();
    
    // Set up default options
    const width = options.width || 800;
    const chordSpacing = options.chordSpacing || 5;
    this.cssPrefix = options.cssPrefix || 'chord-sheet';
    this.renderChords = options.renderChords !== false; // Default to true
    
    // Default fonts
    const fonts = {
      chord: {
        family: options.fonts?.chord?.family || 'Arial',
        size: options.fonts?.chord?.size || 14,
        style: options.fonts?.chord?.style || 'bold'
      },
      lyrics: {
        family: options.fonts?.lyrics?.family || 'Arial',
        size: options.fonts?.lyrics?.size || 14,
        style: options.fonts?.lyrics?.style || 'normal'
      },
      title: {
        family: options.fonts?.title?.family || 'Arial',
        size: options.fonts?.title?.size || 20,
        style: options.fonts?.title?.style || 'bold'
      },
      subtitle: {
        family: options.fonts?.subtitle?.family || 'Arial',
        size: options.fonts?.subtitle?.size || 16,
        style: options.fonts?.subtitle?.style || 'normal'
      },
      comment: {
        family: options.fonts?.comment?.family || 'Arial',
        size: options.fonts?.comment?.size || 14,
        style: options.fonts?.comment?.style || 'italic'
      },
      label: {
        family: options.fonts?.label?.family || 'Arial',
        size: options.fonts?.label?.size || 14,
        style: options.fonts?.label?.style || 'bold'
      }
    };

    // Create measurer and layout engine
    this.measurer = new CanvasMeasurer();
    this.layoutEngine = new LayoutEngine(this.measurer, {
      width,
      fonts,
      chordSpacing
    });
  }

  /**
   * Format a song into HTML with precise layout
   */
  format(song: Song): string {
    // First, compute the layout
    this.layout = this.layoutEngine.computeLayout(song);
    
    // Apply line breaking
    const finalLayout = this.layoutEngine.applyLineBreaking(this.layout);
    
    // Generate HTML from the layout
    const html = this.renderLayout(song, finalLayout);
    
    return html;
  }

  /**
   * Render HTML from the computed layout
   */
  private renderLayout(song: Song, layout: SongLayout): string {
    let html = `<div class="${this.cssPrefix}">`;
    
    // Render title and metadata if present
    if (song.title) {
      html += `<div class="${this.cssPrefix}-title">${song.title}</div>`;
    }
    
    if (song.subtitle) {
      html += `<div class="${this.cssPrefix}-subtitle">${song.subtitle}</div>`;
    }
    
    // Render paragraphs
    layout.paragraphs.forEach(paragraph => {
      html += `<div class="${this.cssPrefix}-paragraph">`;
      
      // Render each line
      paragraph.lines.forEach(line => {
        const lineClasses = [this.cssPrefix + '-line'];
        if (line.type) {
          lineClasses.push(this.cssPrefix + '-line-' + line.type);
        }
        
        html += `<div class="${lineClasses.join(' ')}">`;
        
        // Render items in each line
        line.items.forEach(item => {
          if (isChordLyricsPair(item.item)) {
            html += `<div class="${this.cssPrefix}-item" style="display: inline-block; position: relative;">`;
            
            // Render chord if present and rendering is enabled
            if (this.renderChords && item.chord) {
              html += `<div class="${this.cssPrefix}-chord" data-chord="${item.chord}">${item.chord}</div>`;
            }
            
            // Render lyrics
            if (item.text) {
              html += `<div class="${this.cssPrefix}-lyrics">${item.text}</div>`;
            }
            
            html += '</div>';
          } else if (isComment(item.item)) {
            html += `<div class="${this.cssPrefix}-comment">${item.text}</div>`;
          } else if (isTag(item.item)) {
            html += `<div class="${this.cssPrefix}-tag">${item.text}</div>`;
          }
        });
        
        html += '</div>'; // Close line
      });
      
      html += '</div>'; // Close paragraph
    });
    
    html += '</div>'; // Close chord-sheet
    
    return html;
  }
  
  /**
   * Generate CSS styles for the formatted HTML
   */
  generateStyles(): string {
    return `
      .${this.cssPrefix} {
        font-family: Arial, sans-serif;
        line-height: 1.4;
      }
      
      .${this.cssPrefix}-title {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 10px;
      }
      
      .${this.cssPrefix}-subtitle {
        font-size: 16px;
        margin-bottom: 20px;
      }
      
      .${this.cssPrefix}-paragraph {
        margin-bottom: 20px;
      }
      
      .${this.cssPrefix}-line {
        margin-bottom: 5px;
        white-space: nowrap;
      }
      
      .${this.cssPrefix}-item {
        display: inline-block;
        margin-right: 5px;
        vertical-align: top;
      }
      
      .${this.cssPrefix}-chord {
        font-weight: bold;
        min-height: 1.5em;
      }
      
      .${this.cssPrefix}-comment {
        font-style: italic;
      }
      
      .${this.cssPrefix}-tag {
        font-weight: bold;
      }
      
      .${this.cssPrefix}-line-chorus {
        font-weight: bold;
        padding-left: 20px;
      }
    `;
  }
}
