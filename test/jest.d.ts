/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
import { TernaryProperties } from '../src/chord_sheet/chord_pro/ternary';
import { ContentType } from '../src/serialized_types';
import StubbedPdfDoc, { RenderedItem, RenderedLine, RenderedText } from './formatter/stubbed_pdf_doc';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeKey({ note, modifier, minor }): CustomMatcherResult;

      toBeChordLyricsPair(chords: string, lyrics: string, annotation?: string): CustomMatcherResult;

      toBeLiteral(string: string): CustomMatcherResult;

      toBeSection(_type: ContentType, _contents: string): CustomMatcherResult;

      toBeTernary(properties: TernaryProperties): CustomMatcherResult;

      toBeComment(_contents: string): CustomMatcherResult;

      toBeTag(_name: string, _value?: string): CustomMatcherResult;

      toBeSoftLineBreak(): CustomMatcherResult;

      toHaveLine(expected: Partial<RenderedLine>): CustomMatcherResult;

      toHaveRenderedItem(expected: Partial<RenderedItem>): CustomMatcherResult;

      toHaveText(expected: Partial<RenderedText>): CustomMatcherResult;
    }
  }
}

export {};
