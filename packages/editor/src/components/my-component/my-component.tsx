import { Component, Prop, h } from '@stencil/core';
// import { format } from '../../utils/utils';
import ChordChartJs from '@praisecharts/chordchartjs';

@Component({
  tag: 'my-component',
  styleUrl: 'my-component.css',
  shadow: true,
})
export class MyComponent {
  /**
   * The first name
   */
  @Prop() first: string;

  /**
   * The middle name
   */
  @Prop() middle: string;

  /**
   * The last name
   */
  @Prop() last: string;

  private getText(): string {
    const chordSheet = `
       Am         C/G        F          C
Let it be, let it be, let it be, let it be
C                G              F  C/E Dm C
Whisper words of wisdom, let it be`.substring(1);

const parser = new ChordChartJs.ChordSheetParser();
const song = parser.parse(chordSheet);
const formatter = new ChordChartJs.ChordProFormatter();
const disp = formatter.format(song);
    return disp
  }

  render() {
    return <div>Hello, World! I'm {this.getText()}</div>;
  }
}
