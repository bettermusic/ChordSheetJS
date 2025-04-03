import Line from './chord_sheet/line';
import ChordLyricsPair from './chord_sheet/chord_lyrics_pair';
import Item from './chord_sheet/item';
import { GRADE_TO_KEY } from './scales';
import SUFFIX_MAPPING from './normalize_mappings/suffix-normalize-mapping';

import {
  ChordType, MAJOR, MINOR, Modifier, ModifierMaybe, NO_MODIFIER, NUMERAL, SHARP,
} from './constants';

export function hasChordContents(line: Line): boolean {
  return line.items.some((item) => (item instanceof ChordLyricsPair) && !!item.chords);
}

export function hasRemarkContents(line: Line): boolean {
  return line.items.some((item) => (item instanceof ChordLyricsPair) && (item.chords || item.annotation));
}

export function isEvaluatable(item: Item): boolean {
  return ('evaluate' in item) && (typeof item.evaluate === 'function');
}

export function padLeft(string: string, length: number): string {
  let paddedString = string;
  for (let l = string.length; l < length; l += 1, paddedString += ' ');
  return paddedString;
}

type ObjectWithLength = any[] | string | null;

export function isPresent(object: ObjectWithLength): boolean {
  return !!object && object.length > 0;
}

export function isString(obj: any): boolean {
  return typeof obj === 'string';
}

function dasherize(string: string): string {
  return string.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function scopeSelector(selector: string, scope: string): string {
  return selector
    .split(',')
    .map((s) => `${scope} ${s.trim()}`.trim())
    .join(',\n');
}

type CssObject = Record<string, Record<string, string>>;

export function scopeCss(css: CssObject, scope = ''): string {
  return Object
    .entries(css)
    .map(([selector, styles]) => {
      const rules = Object
        .entries(styles)
        .map(([property, value]) => `${dasherize(property)}: ${value};`)
        .join('\n  ');

      const scopedSelector = scopeSelector(selector, scope);

      return `
${scopedSelector} {
  ${rules}
}`.substring(1);
    })
    .join('\n\n');
}

export function warn(message: string): void {
  const proc = globalThis.process;
  if (typeof proc === 'object' && typeof proc.emitWarning === 'function') {
    proc.emitWarning(message);
  } else {
    // eslint-disable-next-line no-console
    console.warn(message);
  }
}

export function deprecate(message: string): void {
  try {
    throw new Error(`DEPRECATION: ${message}`);
  } catch (e) {
    const error = (e as Error);
    warn(`${message}\n${error.stack}`);
  }
}

export function isEmptyString(string: string | null | undefined): boolean {
  return (string === null || string === undefined || string === '');
}

export function isMinor(key: string | number, keyType: ChordType, suffix: any): boolean {
  switch (keyType) {
    case NUMERAL:
      return typeof key === 'string' && key.toLowerCase() === key;
    default:
      return typeof suffix === 'string' &&
        suffix[0] === 'm' &&
        suffix.substring(0, 2).toLowerCase() !== 'ma' &&
        suffix.substring(0, 3).toLowerCase() !== 'maj';
  }
}

export function normalizeLineEndings(string: string): string {
  return string.replace(/\r\n?/g, '\n');
}

class GradeSet {
  grades: Record<ModifierMaybe, Record<number, string>>;

  constructor(grades: Record<ModifierMaybe, Record<number, string>>) {
    this.grades = grades;
  }

  determineGrade(modifier: ModifierMaybe | null, preferredModifier: Modifier | null, grade: number) {
    return this.getGradeForModifier(modifier, grade) ||
      this.getGradeForModifier(NO_MODIFIER, grade) ||
      this.getGradeForModifier(preferredModifier, grade) ||
      this.getGradeForModifier(SHARP, grade);
  }

  getGradeForModifier(modifier: ModifierMaybe | null, grade: number) {
    if (modifier) {
      return this.grades[modifier][grade];
    }

    return null;
  }
}

function determineKey({
  type,
  modifier,
  preferredModifier,
  grade,
  minor,
}: {
  type: ChordType,
  modifier: ModifierMaybe | null,
  preferredModifier: Modifier | null,
  grade: number,
  minor: boolean,
}) {
  const mode = (minor ? MINOR : MAJOR);
  const grades = GRADE_TO_KEY[type][mode];
  return new GradeSet(grades).determineGrade(modifier, preferredModifier, grade);
}

export function gradeToKey({
  type,
  modifier,
  preferredModifier,
  grade,
  minor,
}: {
  type: ChordType,
  modifier: ModifierMaybe | null,
  preferredModifier: Modifier | null,
  grade: number,
  minor: boolean,
}): string {
  let key = determineKey({
    type, modifier, preferredModifier, grade, minor,
  });

  if (!key) {
    throw new Error(
      `Could not resolve
      type=${type}
      modifier=${modifier}
      grade=${grade}
      preferredModifier=${preferredModifier}
      minor=${minor}
to a key`,
    );
  }

  if (minor && type === NUMERAL) {
    key = key.toLowerCase();
  }

  return key;
}

export function normalizeChordSuffix(suffix: string | null): string | null {
  if (suffix === null) {
    return null;
  }

  if (SUFFIX_MAPPING[suffix] === '[blank]') {
    return null;
  }

  return SUFFIX_MAPPING[suffix] || suffix;
}

export function capitalize(string: string) {
  return `${string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()}`;
}

/**
 * Deep merges two configuration objects with special handling for arrays
 *
 * This function performs a deep merge of configuration objects with the following behavior:
 * - Objects are deep merged recursively
 * - Arrays from source completely replace arrays in target (no concatenation)
 * - Primitive values from source replace values in target
 * - Handles null/undefined cases appropriately
 *
 * This is specifically designed for chordsheet configuration merging where
 * certain array properties (like layout.header.content) should not be merged
 * but replaced entirely when overridden.
 *
 * @param target The target configuration object to merge into
 * @param source The source configuration object with overrides
 * @returns A new object with merged configuration
 */
export function mergeConfigs<T>(target: T, source: any): T {
  // Handle null/undefined cases
  if (source === null || source === undefined) {
    return target as T;
  }
  if (target === null || target === undefined) {
    return source as T;
  }

  // Handle primitive types or different types
  if (typeof target !== 'object' || typeof source !== 'object') {
    return source as T;
  }

  // Handle arrays - replace target array with source array (no merging)
  if (Array.isArray(source)) {
    return source as unknown as T;
  }

  // For objects, create a new object to avoid mutating the originals
  const result: any = { ...target };

  // Merge all keys from source
  Object.keys(source).forEach((key) => {
    const targetValue = (target as any)[key];
    const sourceValue = source[key];

    // If both values are objects and not arrays, recursively merge them
    if (
      targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue) &&
      sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)
    ) {
      result[key] = mergeConfigs(targetValue, sourceValue);
    } else {
      // Otherwise, use the source value (includes array replacement)
      result[key] = sourceValue;
    }
  });

  return result;
}

/**
 * Utility type that creates a deep partial type
 * This makes all properties optional recursively through the entire object
 */
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;
