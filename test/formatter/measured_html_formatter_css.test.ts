import MeasuredHtmlFormatter from '../../src/formatter/measured_html_formatter';

// Mock DOM environment
(global as any).document = {
  createElement: () => ({
    style: {},
    classList: {
      add: () => {},
      remove: () => {},
    },
  }),
  body: {
    appendChild: () => {},
  },
  querySelectorAll: () => [],
};

describe('MeasuredHtmlFormatter', () => {
  describe('cssString', () => {
    let mockContainer: any;

    beforeEach(() => {
      mockContainer = {
        style: {},
        querySelectorAll: () => [],
        firstChild: null,
        removeChild: () => {},
      };
    });

    it('returns empty string when no playback config is provided', () => {
      const formatter = new MeasuredHtmlFormatter(mockContainer);
      formatter.configure({});

      expect(formatter.cssString()).toBe('');
    });

    it('generates container styles when playback.highlighted.container is provided', () => {
      const formatter = new MeasuredHtmlFormatter(mockContainer);
      formatter.configure({
        layout: {
          playback: {
            granularity: 'paragraph',
            highlighted: {
              container: {
                border: '2px solid #3B82F6',
                borderRadius: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
              },
            },
          },
        },
      });

      const css = formatter.cssString();

      expect(css).toContain('.cs-highlighted');
      expect(css).toContain('border: 2px solid #3B82F6');
      expect(css).toContain('border-radius: 8px');
      expect(css).toContain('background-color: rgba(59, 130, 246, 0.05)');
    });

    it('generates font styles for chords when provided', () => {
      const formatter = new MeasuredHtmlFormatter(mockContainer);
      formatter.configure({
        layout: {
          playback: {
            granularity: 'line',
            highlighted: {
              fonts: {
                chord: {
                  weight: 'bold',
                  color: '#1D4ED8',
                },
              },
            },
          },
        },
      });

      const css = formatter.cssString();

      expect(css).toContain('.cs-highlighted .cs-chord');
      expect(css).toContain('font-weight: bold');
      expect(css).toContain('color: #1D4ED8');
    });

    it('generates font styles for lyrics when provided', () => {
      const formatter = new MeasuredHtmlFormatter(mockContainer);
      formatter.configure({
        layout: {
          playback: {
            granularity: 'paragraph',
            highlighted: {
              fonts: {
                text: {
                  weight: 'bold',
                },
              },
            },
          },
        },
      });

      const css = formatter.cssString();

      expect(css).toContain('.cs-highlighted .cs-lyrics');
      expect(css).toContain('font-weight: bold');
    });

    it('applies CSS scope when provided', () => {
      const formatter = new MeasuredHtmlFormatter(mockContainer);
      formatter.configure({
        layout: {
          playback: {
            granularity: 'paragraph',
            highlighted: {
              container: {
                border: '2px solid blue',
              },
            },
          },
        },
      });

      const css = formatter.cssString('.song-viewer');

      expect(css).toContain('.song-viewer .cs-highlighted');
      expect(css).toContain('border: 2px solid blue');
    });

    it('handles multiple font styles', () => {
      const formatter = new MeasuredHtmlFormatter(mockContainer);
      formatter.configure({
        layout: {
          playback: {
            granularity: 'line',
            highlighted: {
              fonts: {
                chord: {
                  weight: 'bold',
                  size: 14,
                  color: '#1D4ED8',
                },
                text: {
                  weight: 'bold',
                  style: 'italic',
                },
              },
            },
          },
        },
      });

      const css = formatter.cssString();

      expect(css).toContain('.cs-highlighted .cs-chord');
      expect(css).toContain('font-weight: bold');
      expect(css).toContain('font-size: 14px');
      expect(css).toContain('color: #1D4ED8');

      expect(css).toContain('.cs-highlighted .cs-lyrics');
      expect(css).toContain('font-weight: bold');
      expect(css).toContain('font-style: italic');
    });

    it('handles custom CSS prefix', () => {
      const formatter = new MeasuredHtmlFormatter(mockContainer);
      formatter.configure({
        cssClassPrefix: 'custom-',
        layout: {
          playback: {
            granularity: 'paragraph',
            highlighted: {
              container: {
                border: '1px solid red',
              },
            },
          },
        },
      });

      const css = formatter.cssString();

      expect(css).toContain('.custom-highlighted');
      expect(css).not.toContain('.cs-highlighted');
    });

    it('combines container and font styles', () => {
      const formatter = new MeasuredHtmlFormatter(mockContainer);
      formatter.configure({
        layout: {
          playback: {
            granularity: 'paragraph',
            highlighted: {
              container: {
                border: '2px solid #3B82F6',
                padding: '8px',
              },
              fonts: {
                chord: {
                  weight: 'bold',
                },
                text: {
                  weight: 'bold',
                },
              },
            },
          },
        },
      });

      const css = formatter.cssString();

      expect(css).toContain('.cs-highlighted {');
      expect(css).toContain('border: 2px solid #3B82F6');
      expect(css).toContain('padding: 8px');
      expect(css).toContain('.cs-highlighted .cs-chord');
      expect(css).toContain('.cs-highlighted .cs-lyrics');
    });
  });
});
