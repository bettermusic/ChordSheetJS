import Chord from '../src/chord';

import './chord-matchers';

describe('Chord.parse', () => {
  it('is still supported', () => {
    // eslint-disable-next-line import/no-named-as-default-member
    const chord = Chord.parse('E');
    expect(chord).toBeChord('E', null, null, null, null);
  });
});
