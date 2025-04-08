// Re-export everything from each configuration file
export * from './base_configuration';
export * from './html_configuration';
export * from './measurement_based_configuration';
export * from './pdf_configuration';
// export * from './font_configuration';

import { BaseFormatterConfiguration as Configuration } from './base_configuration';
import {
  getBaseDefaultConfig,
  getDefaultConfig,
  getHTMLDefaultConfig,
  getPDFDefaultConfig,
} from './default_config_manager';

import { mergeConfigs } from '../../utilities';

import {
  ConfigurationProperties,
  BaseFormatterConfiguration,
} from './base_configuration';

/**
 * Legacy configuration function for backward compatibility
 */
export function configure(config: ConfigurationProperties): BaseFormatterConfiguration {
  const defautlBaseConfig = getBaseDefaultConfig();
  return mergeConfigs(defautlBaseConfig, config);
}

export {
  Configuration,
  getDefaultConfig,
  getHTMLDefaultConfig,
  getPDFDefaultConfig,
};
export default Configuration;
