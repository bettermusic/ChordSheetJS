import Formatter from './formatter';
import jsPDF from 'jspdf';
import { evaluate, hasChordContents, hasTextContents, isChordLyricsPair, isComment, isEvaluatable, isTag, lineHasContents, renderChord } from '../template_helpers';
import ChordLyricsPair from '../chord_sheet/chord_lyrics_pair';
import Tag from '../chord_sheet/tag';
import Evaluatable from '../chord_sheet/chord_pro/evaluatable';
import Item from '../chord_sheet/item';

/**
 * Formats a song into a ChordPro chord sheet
 */
class PdfFormatter extends Formatter {
  song: any;
  y: number = 0;
  doc: jsPDF = new jsPDF;
  get pdfConfiguration() {
    return {
      fonts: {
        title: { // Default is “Times-Bold” at size 14.
          name: 'Helvetica',
          size: 18,
          color: 'black',
        },

        subtitle: { // Default is the setting for text.
          name: 'Helvetica',
          size: 14,
          color: 'black',
        },

        metadata: { // (made up) Default is the setting for text.
          name: 'Helvetica',
          size: 10,
          color: 'black',
        },

        text: { // Default is “Times-Roman” at size 12.
          name: 'Helvetica',
          size: 10,
          color: 'black',
        },

        chord: { // Default is “Helvetica-Oblique” at size 10.
          name: 'Helvetica',
          size: 10,
          color: 'red',
        },

        comment: { // Default is “Helvetica” at size 12, with a grey background.
          name: 'Helvetica',
          size: 10,
          color: 'black',
        },

        annotation: { // Defaults to the chord font.
          name: 'Helvetica',
          size: 10,
          color: 'black',
        }
      },

      margintop: 80,
      marginbottom: 40,
      marginleft: 40,
      marginright: 40,
    };
  }
  
  format(song) {
    this.song = song;
    this.y = this.pdfConfiguration.margintop;
    this.doc = this.setupDoc();
    this.formatTitles();
    this.formatMetadata();
    this.formatParagraphs();
  }
  
  save() {
    this.doc.save(`${this.song.title || 'untitled'}.pdf`)
  }

  async generatePDF() {
    return new Promise((resolve, reject) => {
        const blob = this.doc.output('blob');
        resolve(blob);
    });
}

  setupDoc() {
    const doc = new jsPDF('portrait', 'px');
    doc.setLineWidth(0);
    doc.setDrawColor(0,0,0,0)
    return doc;
  }
  
  text(text, style) {
    const { name: fontName, size, color } = this.pdfConfiguration.fonts[style];
    const { marginleft } = this.pdfConfiguration;
    this.doc.setFontSize(size);
    this.doc.setTextColor(color);
    this.doc.setFont(fontName);
    this.doc.text(text, marginleft, this.y);
    this.y += size;
  }
  
  spacer(size) {
    this.y += size;
  }
  
  getFontConfiguration(objectType) {
    const { name: fontName, size: fontSize, color } = this.pdfConfiguration.fonts[objectType];
    return { color, fontName, fontSize };
  }
  
  formatTitles() {
    const { title, subtitle } = this.song;
    
    if (title) this.text(title, 'title');
    if (subtitle) this.text(subtitle, 'subtitle');
    if (title || subtitle) this.spacer(20);
  }
  
  formatMetadata() {
    const { metadata } = this.song.metadata;

    const keys =
      Object
        .keys(metadata)
        .filter((key) => !['title', 'subtitle'].includes(key));

    if (keys.length > 0) {
      keys.forEach((key) => {
        this.text(`${key}: ${metadata[key]}`, 'metadata');
      });

      this.spacer(50);
    }
  }
  
  formatParagraphs() {
    const bodyParagraphs =
      this.configuration.expandChorusDirective ?
        this.song.expandedBodyParagraphs :
        this.song.bodyParagraphs;

    bodyParagraphs.forEach((paragraph, index, { length }) => {
      this.formatParagraph(paragraph);
    });
  }
  
  formatParagraph(paragraph) {
    paragraph.lines.forEach((line) => {
      if (lineHasContents(line)) {
        this.formatLine(line);
      }
    });
  }
  
  formatLine(line: any) {
    const chordFont = this.getFontConfiguration('chord');
    const lyricFont = this.getFontConfiguration('text');
    const commentFont = this.getFontConfiguration('comment');
    const annotationFont = this.getFontConfiguration('annotation');
    const { key, useUnicodeModifiers, normalizeChords } = this.configuration;
    const { metadata } = this.song;
    
    const topLine: string[] = [];
    const bottomLine: string[] = [];
    
    if (hasChordContents(line)) {
      line.items.forEach((item: ChordLyricsPair) => {
        if (isChordLyricsPair(item)) {
          const chord: string = renderChord(
            item.chords,
            line,
            this.song,
            {
              renderKey: key,
              useUnicodeModifier: useUnicodeModifiers,
              normalizeChords,
            },
          );
          topLine.push(chord);
        }
      });
    }
    
    if (hasTextContents(line)) {
      line.items.forEach((item: Item) => {
        if (isChordLyricsPair(item)) {
          const chordLyricsPairItem = item as ChordLyricsPair;
          bottomLine.push(chordLyricsPairItem.lyrics ?? '');
        } else if (isTag(item)) {
          const tagItem = item as Tag;
          if (isComment(tagItem)) {
            bottomLine.push(tagItem.value ?? '');
          } else if (tagItem.hasRenderableLabel()) {
            bottomLine.push(tagItem.value);
          }
        } else if (isEvaluatable(item)) {
          const evaluatableItem = item as Evaluatable;
          const evaluated: string = evaluate(evaluatableItem, metadata, this.configuration);
          bottomLine.push(evaluated);
        }
      });
    }
    
    this.table([topLine, bottomLine].filter(line => line.length > 0));
  }
  
  table(rows) {
    const { size: fontSize } = this.pdfConfiguration.fonts.text;
    
    const styles = {
      autoSize: true,
      printHeaders: false,
      columnWidths: 80,
      fontSize,
    };
    
    const data = rows.map((row) => (
      row.reduce((acc, cell, index) => ({
        ...acc,
        [`r${index}`]: cell,
      }), {})
    ));
    
    const headers = rows[0].reduce((acc, cell, index) => [...acc, `r${index}`], []);
    const { marginleft } = this.pdfConfiguration;
    this.doc.table(marginleft, this.y, data, headers, styles);
    this.y += (rows.length * fontSize * 1.5);
  }
}

export default PdfFormatter;
