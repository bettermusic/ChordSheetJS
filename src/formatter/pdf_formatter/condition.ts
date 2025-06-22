import { ConditionRule, ConditionalRule, SingleCondition } from './types';

function isNumber(value: any): boolean {
  return !Number.isNaN(parseInt(value, 10));
}

function toNumber(value: any): number {
  return parseInt(value, 10);
}

class Condition {
  rule: ConditionalRule;

  metadata: Record<string, any>;

  constructor(rule: ConditionalRule, metadata: Record<string, any>) {
    this.rule = rule;
    this.metadata = metadata;
  }

  evaluate(): boolean {
    if ('and' in this.rule && Array.isArray(this.rule.and)) {
      return this.and(this.rule.and);
    }

    if ('or' in this.rule && Array.isArray(this.rule.or)) {
      return this.or(this.rule.or);
    }

    const [field, rule]: [string, SingleCondition] = Object.entries(this.rule)[0];

    if (!rule) {
      return false;
    }

    const value = this.getValue(field);

    return this.evaluateSingleCondition(value, field, rule);
  }

  // eslint-disable-next-line max-lines-per-function,max-statements,complexity
  private evaluateSingleCondition(value: any, field: string, rule: ConditionRule): boolean {
    if ('all' in rule) {
      return this.all(value, rule.all);
    }

    if ('contains' in rule) {
      return this.contains(value, rule.contains);
    }

    if ('equals' in rule) {
      return value === rule.equals.toString();
    }

    if ('exists' in rule) {
      return this.exists(this.getRawValue(field), rule.exists);
    }

    if ('first' in rule) {
      return this.firstPage(field, rule);
    }

    if ('greater_than' in rule) {
      return this.greaterThan(value, rule.greater_than);
    }

    if ('greater_than_equal' in rule) {
      return this.greaterThanEqual(value, rule.greater_than_equal);
    }

    if ('in' in rule) {
      return this.in(value, rule.in);
    }

    if ('last' in rule) {
      return this.lastPage(field, rule);
    }

    if ('less_than' in rule) {
      return this.lessThan(value, rule.less_than);
    }

    if ('less_than_equal' in rule) {
      return this.lessThanEqual(value, rule.less_than_equal);
    }

    if ('like' in rule) {
      return this.like(value, rule.like);
    }

    if ('not_equals' in rule) {
      return value !== rule.not_equals.toString();
    }

    if ('not_in' in rule) {
      return this.notIn(value, rule.not_in);
    }

    return false;
  }

  private firstPage(field: string, rule: ConditionRule) {
    if (field !== 'page') {
      throw new Error('First page condition must be on the page field');
    }

    return !!rule.first && this.getValue('page') === '1';
  }

  private getValue(field: string): string | string[] {
    const value = this.getRawValue(field);

    if (Array.isArray(value)) {
      return value.map((v) => v.toString());
    }

    if (value === undefined || value === null) {
      return '';
    }

    return value.toString();
  }

  private getRawValue(field: string): any {
    return this.metadata[field];
  }

  private lastPage(field: string, rule: ConditionRule) {
    if (field !== 'page') {
      throw new Error('Last page condition must be on the page field');
    }

    return !!rule.last && this.getValue('page') === this.getValue('pages');
  }

  private all(value: any[], all?: any[]) {
    if (!Array.isArray(all)) {
      return false;
    }

    const stringValues = all.map((v) => v.toString());

    return Array.isArray(value) && stringValues.every((item: any) => value.includes(item));
  }

  private and(rule: SingleCondition[]) {
    return rule.every((subCondition: ConditionalRule) => new Condition(subCondition, this.metadata).evaluate());
  }

  private contains(value: any, contains?: string) {
    return typeof value === 'string' &&
      typeof contains === 'string' &&
      value.toLowerCase().includes(contains.toLowerCase());
  }

  private exists(value: any, exists?: boolean) {
    return !!exists && value !== undefined;
  }

  private greaterThan(value: any, greaterThan?: number): boolean {
    if (!isNumber(value)) {
      return false;
    }

    return typeof greaterThan === 'number' && toNumber(value) > greaterThan;
  }

  private greaterThanEqual(value: any, greaterThanEqual?: number) {
    if (!isNumber(value)) {
      return false;
    }

    return typeof greaterThanEqual === 'number' && toNumber(value) >= greaterThanEqual;
  }

  private in(value: any[], inArray?: any[]) {
    if (!Array.isArray(inArray)) {
      return false;
    }

    const stringValues = inArray.map((v) => v.toString());
    return stringValues.includes(value);
  }

  private lessThan(value: any, lessThan?: number) {
    if (!isNumber(value)) {
      return false;
    }

    return typeof lessThan === 'number' && toNumber(value) < lessThan;
  }

  private lessThanEqual(value: any, lessThanEqual?: number) {
    if (!isNumber(value)) {
      return false;
    }

    return typeof lessThanEqual === 'number' && toNumber(value) <= lessThanEqual;
  }

  private like(value: any, like?: string) {
    return typeof value === 'string' &&
      typeof like === 'string' &&
      value.toLowerCase().includes(like.toLowerCase());
  }

  private notIn(value: any[], notIn?: any[]) {
    if (!Array.isArray(notIn)) {
      return false;
    }

    const stringValues = notIn.map((v) => v.toString());
    return !stringValues.includes(value);
  }

  private or(rule: ConditionalRule[]) {
    return rule.some((subCondition: ConditionalRule) => new Condition(subCondition, this.metadata).evaluate());
  }
}

export default Condition;
