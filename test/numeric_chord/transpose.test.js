import NumericChord from '../../src/chord/numeric_chord';
import '../chord-matchers';

describe('NumericChord', () => {
  describe('transpose', () => {
    it('is a noop', () => {
      const chord = new NumericChord({
        base: '3',
        modifier: '#',
        suffix: null,
        bassBase: '4',
        bassModifier: 'b',
      });

      const transposedChord = chord.transpose(5);
      expect(transposedChord).toBeChord(3, '#', null, 4, 'b');
    });
  });
});
