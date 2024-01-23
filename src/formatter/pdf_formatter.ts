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
  pdfConfiguration: any = this.defaultPdfConfiguration;

  // Configuration settings for the PDF document
  get defaultPdfConfiguration() {
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
      margintop: 25,
      marginbottom: 10,
      marginleft: 25,
      marginright: 25,
      lineHeight: 5,
      chordLyricSpacing: 0,
      linePadding: 8,
      numberOfSpacesToAdd: 2,
      columnCount: 2,
      columnWidth: 0,
      columnSpacing: 25,
      layout: {
        header: {
          height: 60,
          content: [
            {
              type: 'text',
              template: '${title}',
              style: { name: 'helvetica', style: 'bold', size: 24, color: 'black' },
              position: { x: 'left', y: 15 },
            },
            {
              type: 'text',
              template: 'Key of ${key} - BPM ${bpm} - Time ${timeSignature}',
              style: { name: 'helvetica', style: 'normal', size: 12, color: 100 },
              position: { x: 'left', y: 28 },
            },
            {
              type: 'text',
              template: 'By ${artist} ${subtitle}',
              style: { name: 'helvetica', style: 'normal', size: 10, color: 100 },
              position: { x: 'left', y: 38 },
            },
          ],
        },
        footer: {
          height: 30,
          content: [
            {
              type: 'text',
              value: '©2024 My Music Publishing',
              style: { name: 'helvetica', style: 'normal', size: 10, color: 'black' },
              position: { x: 'left', y: 0 },
            },
          ],
        },
      }
    };
  }

  // Main function to format and save the song as a PDF
  format(song: Song, configuration = this.defaultPdfConfiguration) {
    this.startTime = performance.now();
    this.song = song;
    this.pdfConfiguration = configuration;
    this.doc = this.setupDoc();
    this.renderLayout(this.pdfConfiguration.layout.header, 'header');
    this.renderLayout(this.pdfConfiguration.layout.footer, 'footer');
    this.y = this.pdfConfiguration.margintop + this.pdfConfiguration.layout.header.height;
    this.x = this.pdfConfiguration.marginleft;
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
    return doc;
  }

  // Renders the layout for header and footer
  renderLayout(layoutConfig, section) {
    const height = layoutConfig.height;
    let sectionY = section === 'header' ? this.pdfConfiguration.margintop : this.doc.internal.pageSize.getHeight() - height - this.pdfConfiguration.marginbottom;

    layoutConfig.content.forEach((contentItem) => {
      if (contentItem.type === 'text') {
        this.renderText(contentItem, sectionY);
      } else if (contentItem.type === 'image') {
        this.renderImage(contentItem, sectionY);
      }
    });
  }

  // Renders individual text items
  renderText(textItem, sectionY) {
    const { value, template, style, position } = textItem;
    const textValue = template ? this.interpolateMetadata(template, this.song) : value;
    this.setFontStyle(style);
    const x = this.calculateX(position.x);
    const y = position.y instanceof Array ? position.y.map(yOffset => sectionY + yOffset) : sectionY + position.y;
    y instanceof Array ? y.forEach((yPosition, index) => {
      this.doc.text(textValue.split('\n')[index] || '', x, yPosition);
    }) : this.doc.text(textValue, x, y);
  }

  // Renders individual image items
  renderImage(imageItem, sectionY) {
    const { src, position, size, alias, compression, rotation } = imageItem;

    // Determine the x position based on the alignment
    const x = this.calculateX(position.x, size.width);

    // Adjust y position based on sectionY and the provided y offset
    const y = sectionY + position.y;

    // Determine the format of the image based on the file extension or provided format
    const format = src.split('.').pop().toUpperCase(); // Assumes src is a filename with extension

    // Add the image to the PDF
    // imageData can be a base64 string, an HTMLImageElement, HTMLCanvasElement, Uint8Array, or RGBAData
    this.doc.addImage(src, format, x, y, size.width, size.height, alias, compression, rotation);
  }

  // Helper method to interpolate metadata
  interpolateMetadata(template, song) {
    return template.replace(/\$\{(\w+)\}/g, (_, key) => {
      return song[key] || '';
    });
  }

  // Helper method to calculate x position based on alignment
  calculateX(alignment, width = 0) {
    let x;
    switch (alignment) {
      case 'center':
        x = (this.doc.internal.pageSize.getWidth() / 2) - (width / 2);
        break;
      case 'right':
        x = this.doc.internal.pageSize.getWidth() - this.pdfConfiguration.marginright - width;
        break;
      case 'left':
      default:
        x = this.pdfConfiguration.marginleft;
        break;
    }
    return x;
  }

  formatParagraphs() {
    console.log(this.doc.internal.pageSize.getHeight());
    const columnHeight = this.doc.internal.pageSize.getHeight() - this.pdfConfiguration.margintop - this.pdfConfiguration.marginbottom - this.pdfConfiguration.layout.footer.height;
    console.log(columnHeight);
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
    let lineY = this.y;
    let maxChordHeight = this.getMaxChordHeight(line);
    const spaceWidth = this.getSpaceWidth();
    const columnWidth = this.columnWidth;
  
    line.items.forEach((item, index, items) => {
      if (isChordLyricsPair(item)) {
        let chordWidth = 0;
        let lyricWidth = 0;
    
        // Calculate widths for chords and lyrics
        if (item.chords) {
          const style = this.pdfConfiguration.fonts['chord'];
          this.setFontStyle(style);
          chordWidth = this.getTextDimensions(item.chords).w;
        }
    
        if (item.lyrics && item.lyrics.trim() !== '') {
          const style = this.pdfConfiguration.fonts['text'];
          this.setFontStyle(style);
          lyricWidth = this.getTextDimensions(item.lyrics).w;
        }
    
        // Check if the chord-lyric pair will fit in the current column
        if (x + Math.max(chordWidth, lyricWidth) > this.x + columnWidth) {
          // Move to the next line if it doesn't fit
          lineY += maxChordHeight + this.pdfConfiguration.chordLyricSpacing + this.pdfConfiguration.linePadding + this.pdfConfiguration.lineHeight;
          this.y = lineY; // Update this.y to the new line position
          x = this.x; // Reset x to the start of the column
          maxChordHeight = this.getMaxChordHeight({ items: items.slice(index) }); // Recalculate max chord height for new line
        }
    
        // Render and position chords
        if (item.chords) {
          let chordBaseline = lineY + maxChordHeight - this.getTextDimensions(item.chords).h;
          const style = this.pdfConfiguration.fonts['chord'];
          this.setFontStyle(style);
          this.doc.text(item.chords, x, chordBaseline);
        }
    
        // Render and position lyrics
        if (item.lyrics && item.lyrics.trim() !== '') {
          let lyricsY = lineY + maxChordHeight + this.pdfConfiguration.chordLyricSpacing;
          const style = this.pdfConfiguration.fonts['text'];
          this.setFontStyle(style);
          this.doc.text(item.lyrics, x, lyricsY);
        }
    
        // Update x for the next chord-lyric pair
        x += chordWidth > lyricWidth ?  chordWidth + (this.pdfConfiguration.numberOfSpacesToAdd || 0) * spaceWidth : lyricWidth;
      }
    
      if (isComment(item)) {
        this.formatComment(item.value);
      }
    });
    
    // Update y for the next line, considering the possibility of line breaks within the current line
    this.y = lineY + maxChordHeight + this.pdfConfiguration.chordLyricSpacing + this.pdfConfiguration.linePadding;
  } 

  formatComment(commentText) {
    const style = this.pdfConfiguration.fonts['comment'];
    this.setFontStyle(style);
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
        const style = this.pdfConfiguration.fonts['chord'];
        this.setFontStyle(style);
        let dimensions = this.getTextDimensions(item.chords);
        maxHeight = Math.max(maxHeight, dimensions.h);
      }
    });
    return maxHeight;
  }
  
  getTextDimensions(text) {
    return this.doc.getTextDimensions(text);
  }
  
  // Sets the font style based on the configuration
  setFontStyle(styleConfig) {
    this.doc.setFont(styleConfig.name, styleConfig.style);
    this.doc.setFontSize(styleConfig.size);
    this.doc.setTextColor(styleConfig.color);
  }
  
  recordFormattingTime() {
    const endTime = performance.now();
    const timeTaken = ((endTime - this.startTime) / 1000).toFixed(5);
    
    const style = this.pdfConfiguration.fonts['text'];
    this.setFontStyle(style);
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
      this.renderLayout(this.pdfConfiguration.layout.header, 'header');
      this.renderLayout(this.pdfConfiguration.layout.footer, 'footer');
    } else {
      this.x = (this.currentColumn - 1) * this.columnWidth + this.pdfConfiguration.columnSpacing + this.pdfConfiguration.marginleft;
    }
    this.y = this.pdfConfiguration.margintop + this.pdfConfiguration.layout.header.height;
  }
  
  getSpaceWidth() {
    return this.doc.getTextDimensions(' ').w;
  }
  
}

export default PdfFormatter;
