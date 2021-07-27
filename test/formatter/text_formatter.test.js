import { TextFormatter } from '../../src';

import '../matchers';
import song from '../fixtures/song';
import songWithIntro from '../fixtures/song_with_intro';

describe('TextFormatter', () => {
  it('formats a song to a text chord sheet correctly', () => {
    const formatter = new TextFormatter();

    const expectedChordChart = `
LET IT BE
ChordChartJS example version

Written by: John Lennon,Paul McCartney

       Am         C/G        F          C
Let it be, let it be, let it be, let it be
C                F  G           F  C/E Dm C
Whisper words of wisdom, let it be

Breakdown
Am               Bb             F  C
Whisper words of wisdom, let it be`.substring(1);

    expect(formatter.format(song)).toEqual(expectedChordChart);
  });

  it('omits the lyrics line when it is empty', () => {
    const formatter = new TextFormatter();

    const expectedChordChart = `
Intro:  C
       Am         C/G        F          C
Let it be, let it be, let it be, let it be`.substring(1);

    expect(formatter.format(songWithIntro)).toEqual(expectedChordChart);
  });
});
