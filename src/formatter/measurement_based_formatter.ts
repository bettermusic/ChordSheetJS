import Formatter from './formatter';
import { MeasurementBasedFormatterConfiguration } from './configuration/measurement_based_configuration';
import { getMeasurementDefaultConfig } from './configuration/default_config_manager';
import { DeepPartial } from '../utilities';

/**
 * Base formatter for formatters that need measurements to position elements
 */
abstract class MeasurementBasedFormatter<
  T extends MeasurementBasedFormatterConfiguration = MeasurementBasedFormatterConfiguration
> extends Formatter<T> {
  /**
   * Instantiate a measurement-based formatter
   * @param {DeepPartial<T>} [configuration={}] The formatter configuration
   */
  constructor(configuration: DeepPartial<T> = {} as DeepPartial<T>) {
    super(configuration);
  }

  /**
   * Get the default configuration for this formatter type
   * Uses the measurement-based default configuration
   */
  protected getDefaultConfiguration(): T {
    return getMeasurementDefaultConfig() as T;
  }
}

export default MeasurementBasedFormatter;
