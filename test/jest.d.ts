/* eslint-disable no-unused-vars, no-undef */
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeChord(
        {
          base,
          modifier,
          suffix,
          bassBase,
          bassModifier,
        }
        ): CustomMatcherResult;

      toBeNote({ note, type, minor }): CustomMatcherResult;

      toBeKey({ note, modifier }): CustomMatcherResult;

      toBeChordLyricsPair(chords: string, lyrics: string): CustomMatcherResult;

      toBeLiteral(contents: string): CustomMatcherResult;

      toBeTernary({
        variable, valueTest, trueExpression, falseExpression,
      }: {
          variable?: any;
          valueTest?: any;
          trueExpression?: any;
          falseExpression?: any;
      }): CustomMatcherResult;

      toBeComment(_contents: string): CustomMatcherResult;

      toBeTag(_name: string, _value?: string): CustomMatcherResult;
    }
  }
}

export {};
