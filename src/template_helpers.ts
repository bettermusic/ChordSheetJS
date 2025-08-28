import ChordLyricsPair from './chord_sheet/chord_lyrics_pair';
import Tag from './chord_sheet/tag';
import { INDETERMINATE, NONE } from './constants';
import { hasChordContents, isEmptyString, isEvaluatable } from './utilities';
import Item from './chord_sheet/item';
import Line from './chord_sheet/line';
import Paragraph from './chord_sheet/paragraph';
import Metadata from './chord_sheet/metadata';
import {
  Configuration, defaultDelegate, Delegate, HtmlTemplateCssClasses,
} from './formatter/configuration';
import Evaluatable from './chord_sheet/chord_pro/evaluatable';
import Font from './chord_sheet/font';
import { renderChord } from './helpers';
import When from './template_helpers/when';
import { Literal, SoftLineBreak } from './index';
import WhenCallback from './template_helpers/when_callback';
import { MetadataRule, MetadataConfiguration } from './formatter/configuration/base_configuration';

type EachCallback = (_item: any) => string;

export { hasChordContents, isEvaluatable } from './utilities';
export { renderChord } from './helpers';

export function isChordLyricsPair(item: Item): boolean {
  return item instanceof ChordLyricsPair;
}

export function lineHasContents(line: Line): boolean {
  return line.items.some((item: Item) => item.isRenderable());
}

export function isTag(item: Item): boolean {
  return item instanceof Tag;
}

export function isLiteral(item: Item): boolean {
  return item instanceof Literal;
}

export function isComment(item: Tag): boolean {
  return item.name === 'comment';
}

export function isColumnBreak(item: Item): boolean {
  return item instanceof Tag && item.name === 'column_break';
}

export function isSoftLineBreak(item: Item): boolean {
  return item instanceof SoftLineBreak;
}

export function stripHTML(string: string): string {
  return string
    .trim()
    .replace(/(<\/[a-z]+>)\s+(<)/g, '$1$2')
    .replace(/(>)\s+(<\/[a-z]+>)/g, '$1$2')
    .replace(/(\n)\s+/g, '');
}

export function newlinesToBreaks(string: string): string {
  return string.replace(/\n/g, '<br>');
}

export function renderSection(paragraph: Paragraph, configuration: Configuration): string {
  const delegate: Delegate = configuration.delegates[paragraph.type] || defaultDelegate;

  return delegate(paragraph.contents);
}

export function each(collection: any[], callback: EachCallback): string {
  return collection.map(callback).join('');
}

export function when(condition: any, callback?: WhenCallback): When {
  return new When(condition, callback);
}

export function hasTextContents(line: Line): boolean {
  return line.items.some((item) => (
    (item instanceof ChordLyricsPair && !isEmptyString(item.lyrics)) ||
    (item instanceof Tag && item.isRenderable()) ||
    isEvaluatable(item)
  ));
}

export function lineClasses(line: Line, cssClasses: HtmlTemplateCssClasses): string {
  const classes = [cssClasses.row];

  if (!lineHasContents(line)) {
    classes.push(cssClasses.emptyLine);
  }

  return classes.join(' ');
}

export function paragraphClasses(paragraph: Paragraph, cssClasses: HtmlTemplateCssClasses): string {
  const classes = [cssClasses.paragraph];

  if (paragraph.type !== INDETERMINATE && paragraph.type !== NONE) {
    classes.push(paragraph.type);
  }

  return classes.join(' ');
}

export function evaluate(item: Evaluatable, metadata: Metadata, configuration: Configuration): string {
  return item.evaluate(metadata, configuration.metadata.separator);
}

export function fontStyleTag(font: Font): string {
  const cssString = font.toCssString();

  if (cssString) {
    return ` style="${cssString}"`;
  }

  return '';
}

function findMatchingKeys(
  metadata: Record<string, string | string[]>,
  rule: MetadataRule,
): string[] {
  const keys = Object.keys(metadata);

  if (typeof rule.match === 'string') {
    return keys.filter((key) => key === rule.match);
  }

  if (Array.isArray(rule.match)) {
    return keys.filter((key) => (rule.match as string[]).includes(key));
  }

  if (rule.match instanceof RegExp) {
    return keys.filter((key) => (rule.match as RegExp).test(key));
  }

  if (typeof rule.match === 'function') {
    return keys.filter((k) => (rule.match as (key: string) => boolean)(k));
  }

  return [];
}

function sortKeys(
  keys: string[],
  rule: MetadataRule,
): string[] {
  switch (rule.sortMethod) {
    case 'alphabetical':
      return [...keys].sort();

    case 'custom':
      if (rule.customSort) {
        return [...keys].sort(rule.customSort);
      }
      return keys;

    case 'preserve':
    default:
      // If match is an array, preserve its order for matching keys
      if (Array.isArray(rule.match)) {
        const orderMap = new Map(rule.match.map((key, index) => [key, index]));
        return [...keys].sort((a, b) => {
          const aIndex = orderMap.get(a) ?? Infinity;
          const bIndex = orderMap.get(b) ?? Infinity;
          return aIndex - bIndex;
        });
      }
      return keys;
  }
}

export function processMetadata(
  metadata: Record<string, string | string[]>,
  config: MetadataConfiguration,
): [string, string | string[]][] {
  const processedKeys = new Set<string>();
  const result: [string, string | string[]][] = [];

  // Process the order array sequentially
  config.order.forEach((orderItem) => {
    if (typeof orderItem === 'string') {
      // Simple string - look for exact match
      if (metadata[orderItem] !== undefined && !processedKeys.has(orderItem)) {
        result.push([orderItem, metadata[orderItem]]);
        processedKeys.add(orderItem);
      }
    } else {
      // Rule - find all matching keys
      const matchingKeys = findMatchingKeys(metadata, orderItem);
      const visibleKeys = matchingKeys.filter((key) => {
        if (orderItem.visible === false) return false;
        return !processedKeys.has(key);
      });

      // Sort the matching keys according to the rule
      const sortedKeys = sortKeys(visibleKeys, orderItem);

      // Add to result
      sortedKeys.forEach((key) => {
        result.push([key, metadata[key]]);
        processedKeys.add(key);
      });
    }
  });

  return result;
}

export default {
  isLiteral,
  isSoftLineBreak,
  isEvaluatable,
  isChordLyricsPair,
  lineHasContents,
  isTag,
  isComment,
  isColumnBreak,
  stripHTML,
  each,
  when,
  hasTextContents,
  lineClasses,
  paragraphClasses,
  evaluate,
  fontStyleTag,
  renderChord,
  hasChordContents,
  processMetadata,
};
