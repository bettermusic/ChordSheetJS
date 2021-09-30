import ChordSymbol from '../../src/chord/chord_symbol';
import '../chord-matchers';

describe('ChordSymbol', () => {
  describe('clone', () => {
    it('assigns the right instance variables', () => {
      const chord = new ChordSymbol({
        base: 'E',
        modifier: 'b',
        suffix: 'sus4',
        bassBase: 'G',
        bassModifier: '#',
      });

      const clonedChord = chord.clone();
      expect(clonedChord).toBeChord('E', 'b', 'sus4', 'G', '#');
    });
  });
});
