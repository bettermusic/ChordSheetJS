import '../matchers';

import PdfFormatter from '../../src/formatter/pdf_formatter';
import Song from '../../src/chord_sheet/song';
import StubbedPdfDoc from './stubbed_pdf_doc';
import defaultConfiguration from '../../src/formatter/pdf_formatter/default_configuration';

import { PDFConfiguration } from '../../src/formatter/pdf_formatter/types';
import { configure } from '../../src/formatter/configuration';
import { exampleSongSymbol } from '../fixtures/song';

describe('PdfFormatter', () => {
  it('correctly formats a basic song', () => {
    const formatter = new PdfFormatter();
    const config = configure({});
    formatter.format(exampleSongSymbol, config, defaultConfiguration, StubbedPdfDoc);
    const doc = formatter.doc.doc as StubbedPdfDoc;

    expect(doc).toHaveText('Written by: ', 45, 95);
    expect(doc).toHaveText('Verse 1', 45, 119);
    expect(doc).toHaveText('Let it ', 45, 144);
    expect(doc).toHaveText('Am', 69, 133);
    expect(doc).toHaveText('be,', 69, 144);
    expect(doc).toHaveText(' ', 84, 144);
    expect(doc).toHaveText(' ', 87, 144);
    expect(doc).toHaveText('let it ', 90, 144);
    expect(doc).toHaveText('C/G', 111, 133);
    expect(doc).toHaveText('be,', 111, 144);
    expect(doc).toHaveText(' ', 132, 144);
    expect(doc).toHaveText('let it ', 134, 144);
    expect(doc).toHaveText('F', 156, 133);
    expect(doc).toHaveText('be,', 156, 144);
    expect(doc).toHaveText(' ', 169, 144);
    expect(doc).toHaveText('let it ', 172, 144);
    expect(doc).toHaveText('C', 193, 133);
    expect(doc).toHaveText('be', 193, 144);
    expect(doc).toHaveText('D', 45, 158);
    expect(doc).toHaveText('Whisper ', 45, 169);
    expect(doc).toHaveText('words of ', 84, 169);
    expect(doc).toHaveText('G', 125, 158);
    expect(doc).toHaveText('wis', 125, 169);
    expect(doc).toHaveText('A', 139, 158);
    expect(doc).toHaveText('dom,', 139, 169);
    expect(doc).toHaveText(' ', 162, 169);
    expect(doc).toHaveText('let it ', 164, 169);
    expect(doc).toHaveText('G', 186, 158);
    expect(doc).toHaveText('be ', 186, 169);
    expect(doc).toHaveText('D/F#', 199, 158);
    expect(doc).toHaveText('Em', 224, 158);
    expect(doc).toHaveText('D', 243, 158);
    expect(doc).toHaveText('Breakdown', 45, 193);
    expect(doc).toHaveText('Em', 45, 207);
    expect(doc).toHaveText('Whisper words of ', 45, 218);
    expect(doc).toHaveText('F', 125, 207);
    expect(doc).toHaveText('wisdom,', 125, 218);
    expect(doc).toHaveText(' ', 162, 218);
    expect(doc).toHaveText('let it ', 164, 218);
    expect(doc).toHaveText('C', 186, 207);
    expect(doc).toHaveText('be ', 186, 218);
    expect(doc).toHaveText('G', 199, 207);
    expect(doc).toHaveText('Chorus 2', 45, 242);
    expect(doc).toHaveText('G', 45, 256);
    expect(doc).toHaveText('Whisper words of ', 45, 267);
    expect(doc).toHaveText('F', 125, 256);
    expect(doc).toHaveText('wisdom,', 125, 267);
    expect(doc).toHaveText(' ', 162, 267);
    expect(doc).toHaveText('let it ', 164, 267);
    expect(doc).toHaveText('C', 186, 256);
    expect(doc).toHaveText('be ', 186, 267);
    expect(doc).toHaveText('G', 199, 256);
    expect(doc).toHaveText('Solo 1', 45, 291);
    expect(doc).toHaveText('G', 45, 305);
    expect(doc).toHaveText('Solo line 1', 45, 316);
    expect(doc).toHaveText('C', 45, 330);
    expect(doc).toHaveText('Solo line 2', 45, 341);
    expect(doc).toHaveText('Tab 1', 45, 365);
    expect(doc).toHaveText('ABC 1', 45, 397);
    expect(doc).toHaveText('LY 1', 45, 429);
    expect(doc).toHaveText('Bridge 1', 45, 461);
    expect(doc).toHaveText('Bridge line', 45, 475);
    expect(doc).toHaveText('Grid 1', 45, 499);

    expect(doc).toHaveText('Am', 67, 539);
    expect(doc).toHaveText('C/G', 135, 539);
    expect(doc).toHaveText('F', 212, 539);
    expect(doc).toHaveText('C', 281, 539);
    expect(doc).toHaveText('G', 351, 539);
    expect(doc).toHaveText('C/E', 416, 539);
    expect(doc).toHaveText('Dm', 487, 539);
  });

  it('renders header content', () => {
    const formatter = new PdfFormatter();

    const song = new Song({
      key: 'Ab',
      tempo: '140',
      time: '7/8',
    });

    const config: PDFConfiguration = {
      ...defaultConfiguration,
      layout: {
        ...defaultConfiguration.layout,
        header: {
          height: 60,
          content: [
            {
              type: 'text',
              template: 'Key of %{key} - BPM %{tempo} - Time %{time}',
              style: {
                name: 'NimbusSansL-Reg', style: 'normal', size: 12, color: 100,
              },
              position: { x: 'left', y: 28 },
            },
          ],
        },
      },
    };

    formatter.format(song, configure({}), config, StubbedPdfDoc);
    const doc = formatter.doc.doc as StubbedPdfDoc;

    expect(doc).toHaveText('Key of Ab - BPM 140 - Time 7/8', 45, 63);
  });

  it('renders footer content', () => {
    const formatter = new PdfFormatter();
    const song = new Song();

    const config: PDFConfiguration = {
      ...defaultConfiguration,
      layout: {
        ...defaultConfiguration.layout,
        header: {
          height: 60,
          content: [],
        },
        footer: {
          height: 60,
          content: [
            {
              type: 'text',
              template: 'Page %{page} of %{pages}',
              style: {
                name: 'NimbusSansL-Reg', style: 'normal', size: 12, color: 100,
              },
              position: { x: 'center', y: 28 },
            },
          ],
        },
      },
    };

    formatter.format(song, configure({}), config, StubbedPdfDoc);
    const doc = formatter.doc.doc as StubbedPdfDoc;

    expect(doc.renderedItems).toHaveLength(1);

    expect(doc).toHaveText('Page 1 of 1', 275, 750);
  });

  it('renders conditional content when the condition matches', () => {
    const formatter = new PdfFormatter();
    const song = new Song();

    const config: PDFConfiguration = {
      ...defaultConfiguration,
      layout: {
        ...defaultConfiguration.layout,
        header: {
          height: 60,
          content: [],
        },
        footer: {
          height: 60,
          content: [
            {
              type: 'text',
              template: 'Page %{page} of %{pages}',
              style: {
                name: 'NimbusSansL-Reg', style: 'normal', size: 12, color: 100,
              },
              position: { x: 'center', y: 28 },
              condition: {
                page: {
                  equals: 1,
                },
              },
            },
          ],
        },
      },
    };

    formatter.format(song, configure({}), config, StubbedPdfDoc);
    const doc = formatter.doc.doc as StubbedPdfDoc;

    expect(doc.renderedItems).toHaveLength(1);

    expect(doc).toHaveText('Page 1 of 1', 275, 750);
  });

  it('does not render conditional content when the condition does not match', () => {
    const formatter = new PdfFormatter();
    const song = new Song();

    const config: PDFConfiguration = {
      ...defaultConfiguration,
      layout: {
        ...defaultConfiguration.layout,
        header: {
          height: 60,
          content: [],
        },
        footer: {
          height: 60,
          content: [
            {
              type: 'text',
              template: 'Page %{page} of %{pages}',
              style: {
                name: 'NimbusSansL-Reg', style: 'normal', size: 12, color: 100,
              },
              position: { x: 'center', y: 28 },
              condition: {
                page: { equals: 2 },
              },
            },
          ],
        },
      },
    };

    formatter.format(song, configure({}), config, StubbedPdfDoc);
    const doc = formatter.doc.doc as StubbedPdfDoc;

    expect(doc.renderedItems).toHaveLength(0);
  });
});
