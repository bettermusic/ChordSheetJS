export const measuredHtmlConfigs = [
  {
    name: 'Default',
    content: {
      cssClassPrefix: 'cs-',
      fonts: {
        title: {
          name: '"system-ui"',
          style: 'bold',
          weight: 900,
          size: 28,
          color: 'black',
        },
        subtitle: {
          name: '"system-ui"',
          style: 'normal',
          size: 10,
          color: '#666666',
        },
        metadata: {
          name: '"system-ui"',
          style: 'normal',
          size: 10,
          color: '#666666',
        },
        text: {
          name: '"system-ui"',
          style: 'normal',
          weight: 500,
          size: 18,
          color: '#1a1a1a',
        },
        chord: {
          name: '"system-ui"',
          style: 'bold',
          weight: 700,
          size: 16,
          color: '#2563eb',
        },
        sectionLabel: {
          name: '"system-ui"',
          weight: 700,
          size: 19,
          color: 'black',
          lineHeight: 1.2,
        },
        comment: {
          name: '"system-ui"',
          weight: 700,
          size: 19,
          color: 'black',
          underline: true,
          lineHeight: 1.2,
        },
        annotation: {
          name: '"system-ui"',
          style: 'normal',
          size: 10,
          color: 'black',
        },
      },
      layout: {
        global: {
          margins: {
            top: 5,
            bottom: 10,
            left: 15,
            right: 15,
          },
        },
        header: {
          height: 0,
          content: [],
        },
        footer: {
          height: 0,
          content: [],
        },
        sections: {
          global: {
            paragraphSpacing: 25,
            linePadding: 8,
            chordLyricSpacing: 2,
            chordSpacing: 2,
            columnCount: 1,
            columnWidth: 0,
            columnSpacing: 25,
          },
          base: {
            display: {
              lyricsOnly: false,
            },
          },
        },
        chordDiagrams: {
          enabled: true,
          renderingConfig: {
            titleY: 16,
            neckWidth: 120,
            neckHeight: 160,
            nutThickness: 10,
            fretThickness: 4,
            nutColor: 0,
            fretColor: '#AAAAAA',
            stringIndicatorSize: 14,
            fingerIndicatorSize: 16,
            stringColor: 0,
            fingerIndicatorOffset: 0,
            stringThickness: 3,
            fretLineThickness: 4,
            openStringIndicatorThickness: 2,
            unusedStringIndicatorThickness: 2,
            markerThickness: 2,
            barreThickness: 2,
            titleFontSize: 40,
            baseFretFontSize: 8,
            fingerNumberFontSize: 28,
            showFingerNumbers: false,
            diagramSpacing: 7,
          },
          overrides: {
            global: {
              G: {
                hide: true,
              },
            },
            byKey: {
              B: {
                G: {
                  definition: 'G base-fret 3 frets 1 3 3 2 1 1 fingers 1 3 4 2 1 1',
                },
              },
            },
          },
          fonts: {
            title: {
              name: 'system-ui', style: 'bold', size: 9, color: 'black',
            },
            fingerings: {
              name: 'system-ui', style: 'bold', size: 6, color: 'black',
            },
            baseFret: {
              name: 'system-ui', style: 'bold', size: 6, color: 'black',
            },
          },
        },
        playback: {
          granularity: 'line',
          highlighted: {
            fonts: {
              chord: {
                color: '#1d4ed8',
              },
              text: {
                color: '#000000',
              },
            },
            container: {
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
            },
          },
        },
      },
    },
  },
  {
    name: 'Timestamp Playback',
    content: {
      cssClassPrefix: 'cs-',
      fonts: {
        title: {
          name: '"system-ui"',
          style: 'bold',
          weight: 900,
          size: 28,
          color: 'black',
        },
        subtitle: {
          name: '"system-ui"',
          style: 'normal',
          size: 10,
          color: '#666666',
        },
        metadata: {
          name: '"system-ui"',
          style: 'normal',
          size: 10,
          color: '#666666',
        },
        text: {
          name: '"system-ui"',
          style: 'normal',
          weight: 600,
          size: 18,
          color: '#888888',
        },
        chord: {
          name: '"system-ui"',
          style: 'bold',
          weight: 800,
          size: 16,
          color: '#d4a5a5',
        },
        sectionLabel: {
          name: '"system-ui"',
          weight: 700,
          size: 19,
          color: 'black',
          lineHeight: 1.2,
        },
        comment: {
          name: '"system-ui"',
          weight: 700,
          size: 19,
          color: 'black',
          underline: true,
          lineHeight: 1.2,
        },
        annotation: {
          name: '"system-ui"',
          style: 'normal',
          size: 10,
          color: 'black',
        },
      },
      layout: {
        global: {
          margins: {
            top: 5,
            bottom: 10,
            left: 15,
            right: 15,
          },
        },
        header: {
          height: 0,
          content: [],
        },
        footer: {
          height: 0,
          content: [],
        },
        sections: {
          global: {
            paragraphSpacing: 25,
            linePadding: 8,
            chordLyricSpacing: 2,
            chordSpacing: 2,
            columnCount: 1,
            columnWidth: 0,
            columnSpacing: 25,
          },
          base: {
            display: {
              lyricsOnly: false,
            },
          },
        },
        chordDiagrams: {
          enabled: true,
          renderingConfig: {
            titleY: 16,
            neckWidth: 120,
            neckHeight: 160,
            nutThickness: 10,
            fretThickness: 4,
            nutColor: 0,
            fretColor: '#AAAAAA',
            stringIndicatorSize: 14,
            fingerIndicatorSize: 16,
            stringColor: 0,
            fingerIndicatorOffset: 0,
            stringThickness: 3,
            fretLineThickness: 4,
            openStringIndicatorThickness: 2,
            unusedStringIndicatorThickness: 2,
            markerThickness: 2,
            barreThickness: 2,
            titleFontSize: 40,
            baseFretFontSize: 8,
            fingerNumberFontSize: 28,
            showFingerNumbers: false,
            diagramSpacing: 7,
          },
          overrides: {
            global: {
              G: {
                hide: true,
              },
            },
            byKey: {
              B: {
                G: {
                  definition: 'G base-fret 3 frets 1 3 3 2 1 1 fingers 1 3 4 2 1 1',
                },
              },
            },
          },
          fonts: {
            title: {
              name: 'system-ui', style: 'bold', size: 9, color: 'black',
            },
            fingerings: {
              name: 'system-ui', style: 'bold', size: 6, color: 'black',
            },
            baseFret: {
              name: 'system-ui', style: 'bold', size: 6, color: 'black',
            },
          },
        },
        playback: {
          granularity: 'line',
          highlighted: {
            fonts: {
              chord: {
                color: '#c0392b',
              },
              text: {
                color: '#1a1a1a',
              },
            },
            container: {
              backgroundColor: 'rgba(52, 152, 219, 0.08)',
            },
          },
        },
      },
    },
  },
];

export default measuredHtmlConfigs;
