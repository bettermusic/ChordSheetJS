import ChordChartParser from './chord_chart_parser';
import ChordChartSerializer from '../chord_chart_serializer';

/**
 * Parses a ChordPro chord sheet
 */
class ChordProParser {
  /**
   * Parses a ChordPro chord sheet into a song
   * @param {string} chordProChordChart the ChordPro chord sheet
   * @returns {Song} The parsed song
   */
  parse(chordProChordChart) {
    /**
     * All warnings raised during parsing the ChordPro chord sheet
     * @member
     * @type {Array<ParserWarning>}
     */
    const ast = ChordChartParser.parse(chordProChordChart);
    this.song = new ChordChartSerializer().deserialize(ast);
    return this.song;
  }

  /**
   * All warnings raised during parsing the ChordPro chord sheet
   * @member
   * @type {ParserWarning[]}
   */
  get warnings() {
    return this.song.warnings;
  }
}

export default ChordProParser;
