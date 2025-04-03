import { mergeConfigs } from '../utilities';
import { BaseFormatterConfiguration } from './configuration/base_configuration';
import { DeepPartial } from '../utilities';
import { getBaseDefaultConfig } from './configuration/default_config_manager';

/**
 * Base formatter class that provides configuration handling for all formatters
 */
class Formatter<T extends BaseFormatterConfiguration = BaseFormatterConfiguration> {
  configuration: T;

  /**
   * Instantiate a formatter
   * @param {DeepPartial<T>} [configuration={}] The formatter configuration
   */
  constructor(configuration: DeepPartial<T> = {} as DeepPartial<T>) {
    const defaultConfig = this.getDefaultConfiguration();
    this.configuration = mergeConfigs(defaultConfig, configuration) as T;
  }

  /**
   * Configure the formatter with new options
   * @param {DeepPartial<T>} config New configuration options
   * @returns {this} The formatter instance for chaining
   */
  configure(config: DeepPartial<T>): this {
    this.configuration = mergeConfigs(this.configuration, config) as T;
    return this;
  }

  /**
   * Get the default configuration for this formatter type
   * Should be implemented by subclasses to return the appropriate default configuration
   */
  protected getDefaultConfiguration(): T {
    return getBaseDefaultConfig() as T;
  }
}

export default Formatter;
