import Formatter from './formatter';
import { HTMLFormatterConfiguration } from './configuration';
import Song from '../chord_sheet/song';
import { scopeCss } from '../utilities';
import Paragraph from '../chord_sheet/paragraph';
import { getHTMLDefaultConfig } from './configuration/default_config_manager';

export interface HtmlTemplateArgs {
  configuration: HTMLFormatterConfiguration;
  song: Song;
  renderBlankLines?: boolean;
  bodyParagraphs: Paragraph[],
}

export type Template = (_args: HtmlTemplateArgs) => string;
export type CSS = Record<string, Record<string, string>>;

/**
 * Acts as a base class for HTML formatters
 */
abstract class HtmlFormatter extends Formatter<HTMLFormatterConfiguration> {
  /**
   * Get the default configuration for HTML formatter
   * Uses the HTML-specific default configuration from the configuration manager
   */
  protected getDefaultConfiguration(): HTMLFormatterConfiguration {
    return getHTMLDefaultConfig();
  }

  /**
   * Formats a song into HTML.
   * @param {Song} song The song to be formatted
   * @returns {string} The HTML string
   */
  format(song: Song): string {
    const { bodyParagraphs, expandedBodyParagraphs } = song;

    return this.template(
      {
        song,
        configuration: this.configuration,
        bodyParagraphs: this.configuration.expandChorusDirective ? expandedBodyParagraphs : bodyParagraphs,
      },
    );
  }

  /**
   * Generates basic CSS, optionally scoped within the provided selector, to use with the HTML output
   *
   * For example, execute cssString('.chordSheetViewer') will result in CSS like:
   *
   *     .chordSheetViewer .paragraph {
   *       margin-bottom: 1em;
   *     }
   *
   * @param scope the CSS scope to use, for example `.chordSheetViewer`
   * @returns {string} the CSS string
   */
  cssString(scope = ''): string {
    return scopeCss(this.cssObject, scope);
  }

  /**
   * Basic CSS, in object style à la useStyles, to use with the HTML output
   * For a CSS string see {@link cssString}
   *
   * Example:
   *
   *     '.paragraph': {
   *       marginBottom: '1em'
   *     }
   *
   * @return {Object.<string, Object.<string, string>>} the CSS object
   */
  get cssObject(): CSS {
    return this.defaultCss;
  }

  abstract get defaultCss(): CSS;

  abstract get template(): Template;
}

export default HtmlFormatter;
