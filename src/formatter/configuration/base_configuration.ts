import Key from '../../key';
import { ContentType } from '../../serialized_types';

export type Delegate = (_string: string) => string;
export const defaultDelegate: Delegate = (string: string) => string;

export interface MetadataConfiguration {
  separator: string;
}

export interface InstrumentConfiguration {
  type?: string;
  description?: string;
}

export interface UserConfigurationProperties {
  name?: string;
  fullname?: string;
}

export const defaultMetadataConfiguration: MetadataConfiguration = {
  separator: ',',
};

export interface DelegatesConfiguration {
  abc: Delegate;
  ly: Delegate;
  tab: Delegate;
  grid: Delegate;
}

export const defaultDelegatesConfiguration: DelegatesConfiguration = {
  abc: defaultDelegate,
  ly: defaultDelegate,
  tab: defaultDelegate,
  grid: defaultDelegate,
};

// Base configuration interface
export interface BaseFormatterConfiguration {
  decapo: boolean;
  delegates: Partial<Record<ContentType, Delegate>>;
  evaluate: boolean;
  expandChorusDirective: boolean;
  instrument: InstrumentConfiguration | null;
  key: Key | null;
  metadata: MetadataConfiguration;
  normalizeChords: boolean;
  useUnicodeModifiers: boolean;
  user: UserConfigurationProperties | null;
}

// Legacy configuration properties type
export type ConfigurationProperties = Record<string, any> & Partial<{
  decapo: boolean;
  delegates: Partial<DelegatesConfiguration>;
  evaluate: boolean;
  expandChorusDirective: boolean;
  instrument: Partial<InstrumentConfiguration>;
  key: Key | string | null;
  metadata: Partial<MetadataConfiguration>;
  normalizeChords: boolean;
  useUnicodeModifiers: boolean;
  user: Partial<UserConfigurationProperties>;
}>;

// Default configuration
export const defaultBaseConfiguration: BaseFormatterConfiguration = {
  decapo: false,
  delegates: defaultDelegatesConfiguration,
  evaluate: false,
  expandChorusDirective: false,
  instrument: null,
  key: null,
  metadata: defaultMetadataConfiguration,
  normalizeChords: true,
  useUnicodeModifiers: false,
  user: null,
};

export default BaseFormatterConfiguration;
