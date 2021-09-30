import NumericChord from '../../src/chord/numeric_chord';
import '../chord-matchers';

describe('NumericChord', () => {
  describe('switchModifier', () => {
    it('is a noop', () => {
      const chord = new NumericChord({
        base: '3',
        modifier: '#',
        suffix: null,
        bassBase: '4',
        bassModifier: 'b',
      });

      const switchedChord = chord.switchModifier();
      expect(switchedChord).toBeChord(3, '#', null, 4, 'b');
    });
  });
});
