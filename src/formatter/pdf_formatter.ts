import Formatter from './formatter';
import jsPDF from 'jspdf';
import { isChordLyricsPair, isComment, lineHasContents } from '../template_helpers';
import Song from '../chord_sheet/song';

class PdfFormatter extends Formatter {
  song: Song = new Song();
  y: number = 0;
  x: number = 0;
  doc: jsPDF = new jsPDF;
  startTime: number = 0;
  currentColumn: number = 1;
  columnWidth: number = 0;

  // Configuration settings for the PDF document
  get pdfConfiguration() {
    return {
      // Font settings for various elements
      fonts: {
        title: { name: 'helvetica', style: 'bold', size: 24, color: 'black' },
        subtitle: { name: 'helvetica', style: 'normal', size: 10, color: 100 },
        metadata: { name: 'helvetica', style: 'normal', size: 10, color: 100 },
        text: { name: 'helvetica', style: 'normal', size: 10, color: 'black' },
        chord: { name: 'helvetica', style: 'bold', size: 10, color: 'black' },
        comment: { name: 'helvetica', style: 'bold', size: 10, color: 'black' },
        annotation: { name: 'helvetica', style: 'normal', size: 10, color: 'black' }
      },
      // Layout settings
      margintop: 40,
      marginbottom: 40,
      marginleft: 40,
      marginright: 40,
      lineHeight: 5,
      chordLyricSpacing: 0,
      linePadding: 10,
      numberOfSpacesToAdd: 2,
      columnCount: 2,
      columnWidth: 0,
      columnSpacing: 25
    };
  }

  // Main function to format and save the song as a PDF
  format(song: Song) {
    this.startTime = performance.now();
    this.song = song;
    this.y = this.pdfConfiguration.margintop;
    this.doc = this.setupDoc();
    this.formatTitles();
    this.formatParagraphs();
    this.recordFormattingTime();
  }

  // Save the formatted document as a PDF file
  save() {
    this.doc.save(`${this.song.title || 'untitled'}.pdf`);
  }

  // Generate the PDF as a Blob object
  async generatePDF() {
    return new Promise((resolve) => {
      const blob = this.doc.output('blob');
      resolve(blob);
    });
  }

  // Document setup configurations
  setupDoc() {
    const doc = new jsPDF('portrait', 'px');
    doc.setLineWidth(0);
    doc.setDrawColor(0,0,0,0);
    this.columnWidth = (doc.internal.pageSize.getWidth() - this.pdfConfiguration.marginleft - this.pdfConfiguration.marginright - ((this.pdfConfiguration.columnCount - 1) * this.pdfConfiguration.columnSpacing)) / this.pdfConfiguration.columnCount;
    this.x = this.pdfConfiguration.marginleft;
    return doc;
  }

  // Formatting helpers
  formatTitles() {
    const { title, subtitle, artist, key } = this.song;
  
    this.y = this.pdfConfiguration.margintop;
  
    if (title) {
      this.setFontStyle('title');
      const titleDimensions = this.getTextDimensions(title);
      this.doc.text(title, this.pdfConfiguration.marginleft, this.y);
      this.y += titleDimensions.h - 5;
    }
  
    if (artist || subtitle) {
      this.setFontStyle('subtitle');
      this.doc.text(artist + ' ' + subtitle, this.pdfConfiguration.marginleft, this.y);
      let artistDimensions = this.getTextDimensions(artist + ' ' + subtitle);
      this.y += artistDimensions.h;
    }
  
    let metaDataString = `Key of ${key}`;
    this.setFontStyle('metadata');
    this.doc.text(metaDataString, this.pdfConfiguration.marginleft, this.y);
    let metaDataDimensions = this.getTextDimensions(metaDataString);
    this.y += metaDataDimensions.h + this.pdfConfiguration.linePadding;
  }

  formatParagraphs() {
    const columnHeight = this.doc.internal.pageSize.getHeight() - this.pdfConfiguration.margintop - this.pdfConfiguration.marginbottom;
    const bodyParagraphs = this.song.bodyParagraphs;
  
    bodyParagraphs.forEach((paragraph) => {
      this.formatParagraph(paragraph, columnHeight);
    });
  }
  
  formatParagraph(paragraph, columnHeight) {
    paragraph.lines.forEach((line) => {
      if (lineHasContents(line)) {
        if (this.y + this.pdfConfiguration.lineHeight > columnHeight) {
          this.moveToNextColumn(columnHeight);
        }
        this.formatLine(line);
        this.y += this.pdfConfiguration.lineHeight;
      }
    });
  }

  formatLine(line) {
    let x = this.x;
    let maxChordHeight = this.getMaxChordHeight(line);
    const spaceWidth = this.getSpaceWidth();
  
    line.items.forEach((item) => {
      if (isChordLyricsPair(item)) {
        let chordWidth = 0;
        let lyricWidth = 0;
        let extraSpace = 0;
  
        // Render and position chords
        if (item.chords) {
          this.setFontStyle('chord');
          let chordDimensions = this.getTextDimensions(item.chords);
          chordWidth = chordDimensions.w;
          let chordBaseline = this.y + maxChordHeight - chordDimensions.h;
          this.doc.text(item.chords, x, chordBaseline);
        }
  
        // Render and position lyrics
        if (item.lyrics && item.lyrics.trim() !== '') {
          this.setFontStyle('text');
          let lyricDimensions = this.getTextDimensions(item.lyrics);
          lyricWidth = lyricDimensions.w;
          let lyricsY = this.y + maxChordHeight + this.pdfConfiguration.chordLyricSpacing;
          this.doc.text(item.lyrics, x, lyricsY);
        }
  
        // Calculate additional space for chord-lyric alignment
        if (chordWidth > lyricWidth) {
          let numberOfSpacesToAdd = this.pdfConfiguration.numberOfSpacesToAdd || 0;
          extraSpace = numberOfSpacesToAdd * spaceWidth;
        }
  
        // Update x for the next chord-lyric pair
        x += Math.max(chordWidth, lyricWidth) + extraSpace;
      }
  
      if (isComment(item)) {
        this.formatComment(item.value);
      }
  
      // Handle other item types...
    });
  
    // Update y for the next line
    this.y += maxChordHeight + this.pdfConfiguration.chordLyricSpacing + this.pdfConfiguration.linePadding;
  }  

  formatComment(commentText) {
    this.setFontStyle('comment');
    const textY = this.y;
  
    // Print comment text
    this.doc.text(commentText, this.x, textY);
  
    // Underline the comment
    const textWidth = this.getTextDimensions(commentText).w;
    this.doc.setDrawColor(0);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.x, textY + 1, this.x + textWidth, textY + 1);
  
    // Update y for next element
    this.y += this.getTextDimensions(commentText).h;
  }  

  // Utility functions
  spacer(size) {
    this.y += size;
  }
  
  getFontConfiguration(objectType) {
    return this.pdfConfiguration.fonts[objectType];
  }
  
  getMaxChordHeight(line) {
    let maxHeight = 0;
    line.items.forEach((item) => {
      if (isChordLyricsPair(item) && item.chords) {
        this.setFontStyle('chord');
        let dimensions = this.getTextDimensions(item.chords);
        maxHeight = Math.max(maxHeight, dimensions.h);
      }
    });
    return maxHeight;
  }
  
  getTextDimensions(text) {
    return this.doc.getTextDimensions(text);
  }
  
  setFontStyle(style) {
    const { name: fontName, style: fontStyle, size, color } = this.pdfConfiguration.fonts[style];
    this.doc.setFontSize(size);
    this.doc.setTextColor(color);
    this.doc.setFont(fontName, fontStyle);
  }
  
  recordFormattingTime() {
    const endTime = performance.now();
    const timeTaken = ((endTime - this.startTime) / 1000).toFixed(5);
    
    this.setFontStyle('text');
    this.doc.setTextColor(100);
  
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const timeTextWidth = this.getTextDimensions(timeTaken + 's').w;
    const timeTextX = pageWidth - timeTextWidth - this.pdfConfiguration.marginright;
    const timeTextY = this.pdfConfiguration.margintop / 2;
  
    this.doc.text(timeTaken + 's', timeTextX, timeTextY);
  }
  
  moveToNextColumn(columnHeight) {
    this.currentColumn++;
    if (this.currentColumn > this.pdfConfiguration.columnCount) {
      this.doc.addPage();
      this.currentColumn = 1;
      this.x = this.pdfConfiguration.marginleft;
    } else {
      this.x = (this.currentColumn - 1) * this.columnWidth + this.pdfConfiguration.columnSpacing + this.pdfConfiguration.marginleft;
    }
    this.y = this.pdfConfiguration.margintop;
  }
  
  getSpaceWidth() {
    return this.doc.getTextDimensions(' ').w;
  }
  
}

export default PdfFormatter;
