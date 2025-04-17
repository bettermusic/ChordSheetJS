import { Chord, Key } from '../../src';
import '../matchers';

describe('Chord', () => {
  describe('chord symbol', () => {
    describe('toNumeric', () => {
      it('returns a the numeric version', () => {
        const key = Key.parse('Ab');
        expect(Chord.parse('Dsus/F#')?.toNumeric(key).toString()).toEqual('b5sus/b7');
      });

      it('accepts a string key', () => {
        expect(Chord.parse('Dsus/F#')?.toNumeric('Ab').toString()).toEqual('b5sus/b7');
      });

      it('properly transposes the 6m', () => {
        expect(Chord.parse('Bm')?.toNumeric('D').toString()).toEqual('6m');
      });

      it.skip('supports a minor chord', () => {
        expect(Chord.parse('Gm')?.toNumeric('Bb')?.toString()).toEqual('6');
      });

      it('renders minor key in the numbers of relative major', () => {
        expect(Chord.parse('Em')?.toNumeric('Em').toString()).toEqual('6m');
      });

      it('sees numbers with minor refefence key in relative major', () => {
        expect(Chord.parse('6m')?.toNumeric('Em').toString()).toEqual('6m');
      });
    });
  });
});
