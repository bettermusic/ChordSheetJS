// eslint-disable-next-line import/no-cycle
import { Song } from '../index';
import ChordSheetSerializer from '../chord_sheet_serializer';
import ParserWarning from './parser_warning';

/**
 * Parses a chords over words sheet
 */
class PegBasedParser {
  song?: Song;

  /**
   * All warnings raised during parsing the chord sheet
   * @member
   * @type {ParserWarning[]}
   */
  get warnings(): ParserWarning[] {
    return this.song.warnings;
  }

  protected parseWithParser(chordSheet, parser) {
    const ast = parser(chordSheet);
    this.song = new ChordSheetSerializer().deserialize(ast);
    return this.song;
  }
}

export default PegBasedParser;
