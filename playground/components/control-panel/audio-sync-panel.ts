import { APP_EVENTS } from '../../stores/init-store';
import { formatterState } from '../../stores/formatter-store';
import { TimestampEntry, TimestampManager } from '../../../src/index';

/**
 * Web component for audio sync testing panel
 * Provides controls for testing TimestampManager with manual slider and audio playback
 */
export class AudioSyncPanel extends HTMLElement {
  private manager: TimestampManager | null = null;

  private isExpanded = false;

  private autoScrollEnabled = false;

  private scrollOffset = 100;

  private lookAheadMs = 500; // Pre-scroll 500ms before timestamp

  private maxDuration = 300; // 5 minutes default

  private currentTime = 0;

  private audioElement: HTMLAudioElement | null = null;

  private isPlaying = false;

  // DOM references
  private containerElement: HTMLElement | null = null;

  private sliderElement: HTMLInputElement | null = null;

  private currentTimeDisplay: HTMLElement | null = null;

  private audioFileInput: HTMLInputElement | null = null;

  private playPauseButton: HTMLButtonElement | null = null;

  private autoScrollCheckbox: HTMLInputElement | null = null;

  private scrollOffsetInput: HTMLInputElement | null = null;

  private lookAheadInput: HTMLInputElement | null = null;

  private timestampInfoElement: HTMLElement | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.updateVisibility();
  }

  disconnectedCallback() {
    this.cleanup();
    this.removeEventListeners();
  }

  render() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background-color: #f8f8f8;
          border-bottom: 1px solid #ddd;
        }

        .panel-container {
          display: flex;
          flex-direction: column;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background-color: #e8e8e8;
          cursor: pointer;
          user-select: none;
        }

        .panel-header:hover {
          background-color: #e0e0e0;
        }

        .panel-title {
          font-weight: bold;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .expand-icon {
          transition: transform 0.2s;
        }

        .expand-icon.collapsed {
          transform: rotate(-90deg);
        }

        .panel-content {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .panel-content.hidden {
          display: none;
        }

        .control-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        label {
          font-size: 12px;
          font-weight: 500;
          color: #555;
        }

        input[type="range"] {
          width: 100%;
        }

        input[type="number"] {
          width: 80px;
          padding: 4px 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        input[type="file"] {
          font-size: 12px;
        }

        input[type="checkbox"] {
          cursor: pointer;
        }

        button {
          padding: 6px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          background-color: white;
          cursor: pointer;
          font-size: 13px;
        }

        button:hover {
          background-color: #f0f0f0;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .time-display {
          font-family: monospace;
          font-size: 14px;
          font-weight: bold;
          color: #333;
          min-width: 60px;
        }

        .timestamp-info {
          padding: 8px;
          background-color: #fff;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 12px;
          color: #666;
        }

        .timestamp-info.active {
          background-color: #e3f2fd;
          border-color: #2196f3;
          color: #1976d2;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
        }

        .info-label {
          font-weight: 500;
        }

        .hidden {
          display: none;
        }
      </style>

      <div class="panel-container">
        <div class="panel-header" id="panel-header">
          <div class="panel-title">
            <span class="expand-icon" id="expand-icon">▼</span>
            <span>🎵 Audio Sync Testing</span>
          </div>
        </div>

        <div class="panel-content" id="panel-content">
          <!-- Time Slider -->
          <div class="control-group">
            <label>Time Position</label>
            <div class="control-row">
              <input
                type="range"
                id="time-slider"
                min="0"
                max="${this.maxDuration}"
                value="0"
                step="0.1"
              />
              <span class="time-display" id="current-time">0:00</span>
            </div>
          </div>

          <!-- Audio File Upload -->
          <div class="control-group">
            <label>Audio File (optional)</label>
            <div class="control-row">
              <input
                type="file"
                id="audio-file"
                accept="audio/*"
              />
              <button id="play-pause" disabled>▶ Play</button>
            </div>
          </div>

          <!-- Sync Options -->
          <div class="control-row">
            <label>
              <input type="checkbox" id="auto-scroll" checked />
              Auto-scroll
            </label>
            <div class="control-group" style="flex-direction: row; align-items: center;">
              <label>Offset (px):</label>
              <input type="number" id="scroll-offset" value="100" min="0" max="500" />
            </div>
          </div>

          <!-- Look-ahead timing -->
          <div class="control-row">
            <div class="control-group" style="flex-direction: row; align-items: center;">
              <label>Look-ahead (ms):</label>
              <input type="number" id="look-ahead" value="${this.lookAheadMs}" min="0" max="2000" step="50" />
            </div>
            <span style="font-size: 11px; color: #666;">Scroll/highlight before timestamp</span>
          </div>

          <!-- Timestamp Info -->
          <div class="timestamp-info" id="timestamp-info">
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span id="status-text">No timestamps detected</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Cache DOM references
    this.sliderElement = this.shadowRoot.getElementById('time-slider') as HTMLInputElement;
    this.currentTimeDisplay = this.shadowRoot.getElementById('current-time') as HTMLElement;
    this.audioFileInput = this.shadowRoot.getElementById('audio-file') as HTMLInputElement;
    this.playPauseButton = this.shadowRoot.getElementById('play-pause') as HTMLButtonElement;
    this.autoScrollCheckbox = this.shadowRoot.getElementById('auto-scroll') as HTMLInputElement;
    this.scrollOffsetInput = this.shadowRoot.getElementById('scroll-offset') as HTMLInputElement;
    this.lookAheadInput = this.shadowRoot.getElementById('look-ahead') as HTMLInputElement;
    this.timestampInfoElement = this.shadowRoot.getElementById('timestamp-info') as HTMLElement;

    this.setupControlListeners();
  }

  setupEventListeners() {
    // Listen for formatter changes
    document.addEventListener(APP_EVENTS.FORMATTER_CHANGED, this.handleFormatterChange);

    // Listen for song parsed events (new content might have timestamps)
    document.addEventListener(APP_EVENTS.SONG_PARSED, this.handleSongParsed);

    // Listen for config updates (re-render might happen)
    document.addEventListener(APP_EVENTS.FORMATTER_CONFIG_UPDATED, this.handleConfigUpdate);
  }

  removeEventListeners() {
    document.removeEventListener(APP_EVENTS.FORMATTER_CHANGED, this.handleFormatterChange);
    document.removeEventListener(APP_EVENTS.SONG_PARSED, this.handleSongParsed);
    document.removeEventListener(APP_EVENTS.FORMATTER_CONFIG_UPDATED, this.handleConfigUpdate);
  }

  setupControlListeners() {
    if (!this.shadowRoot) return;

    // Panel expand/collapse
    const panelHeader = this.shadowRoot.getElementById('panel-header');
    panelHeader?.addEventListener('click', this.handleToggleExpand);

    // Time slider
    this.sliderElement?.addEventListener('input', this.handleSliderChange);

    // Audio file upload
    this.audioFileInput?.addEventListener('change', this.handleAudioFileChange);

    // Play/Pause button
    this.playPauseButton?.addEventListener('click', this.handlePlayPause);

    // Auto-scroll checkbox
    this.autoScrollCheckbox?.addEventListener('change', this.handleAutoScrollChange);

    // Scroll offset input
    this.scrollOffsetInput?.addEventListener('change', this.handleScrollOffsetChange);

    // Look-ahead input
    this.lookAheadInput?.addEventListener('change', this.handleLookAheadChange);
  }

  // Event handlers
  handleFormatterChange = () => {
    this.updateVisibility();
    if (formatterState.currentFormatter === 'MeasuredHTML') {
      // Wait a bit for rendering to complete, then initialize
      setTimeout(() => this.initTimestampManager(), 100);
    } else {
      this.cleanup();
    }
  };

  handleSongParsed = () => {
    // Re-initialize when new song is parsed
    if (formatterState.currentFormatter === 'MeasuredHTML') {
      setTimeout(() => this.initTimestampManager(), 100);
    }
  };

  handleConfigUpdate = () => {
    // Re-initialize when config changes (causes re-render)
    if (formatterState.currentFormatter === 'MeasuredHTML') {
      setTimeout(() => this.initTimestampManager(), 100);
    }
  };

  handleToggleExpand = () => {
    this.isExpanded = !this.isExpanded;
    const content = this.shadowRoot?.getElementById('panel-content');
    const icon = this.shadowRoot?.getElementById('expand-icon');

    if (content) {
      content.classList.toggle('hidden', !this.isExpanded);
    }

    if (icon) {
      icon.classList.toggle('collapsed', !this.isExpanded);
    }
  };

  handleSliderChange = (e: Event) => {
    const seconds = parseFloat((e.target as HTMLInputElement).value);
    this.currentTime = seconds;
    this.updateTimeDisplay(seconds);
    this.manager?.setCurrentTime(seconds);

    // Sync audio if playing
    if (this.audioElement && !this.isPlaying) {
      this.audioElement.currentTime = seconds;
    }
  };

  handleAudioFileChange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Clean up existing audio
    if (this.audioElement) {
      this.audioElement.pause();
      URL.revokeObjectURL(this.audioElement.src);
    }

    // Create new audio element
    this.audioElement = new Audio();
    this.audioElement.src = URL.createObjectURL(file);

    // Set up audio event listeners
    this.audioElement.addEventListener('loadedmetadata', () => {
      if (this.audioElement && this.sliderElement) {
        this.maxDuration = this.audioElement.duration;
        this.sliderElement.max = String(this.maxDuration);
      }
      if (this.playPauseButton) {
        this.playPauseButton.disabled = false;
      }
    });

    this.audioElement.addEventListener('timeupdate', this.handleAudioTimeUpdate);
    this.audioElement.addEventListener('ended', this.handleAudioEnded);
  };

  handlePlayPause = () => {
    if (!this.audioElement) return;

    if (this.isPlaying) {
      this.audioElement.pause();
      this.isPlaying = false;
      if (this.playPauseButton) {
        this.playPauseButton.textContent = '▶ Play';
      }
    } else {
      this.audioElement.play();
      this.isPlaying = true;
      if (this.playPauseButton) {
        this.playPauseButton.textContent = '⏸ Pause';
      }
    }
  };

  handleAudioTimeUpdate = () => {
    if (!this.audioElement || !this.isPlaying) return;

    const { currentTime } = this.audioElement;
    this.currentTime = currentTime;

    if (this.sliderElement) {
      this.sliderElement.value = String(currentTime);
    }

    this.updateTimeDisplay(currentTime);
    this.manager?.setCurrentTime(currentTime);
  };

  handleAudioEnded = () => {
    this.isPlaying = false;
    if (this.playPauseButton) {
      this.playPauseButton.textContent = '▶ Play';
    }
  };

  handleAutoScrollChange = (e: Event) => {
    this.autoScrollEnabled = (e.target as HTMLInputElement).checked;
    this.reinitTimestampManager();
  };

  handleScrollOffsetChange = (e: Event) => {
    this.scrollOffset = parseInt((e.target as HTMLInputElement).value, 10);
    this.reinitTimestampManager();
  };

  handleLookAheadChange = (e: Event) => {
    this.lookAheadMs = parseInt((e.target as HTMLInputElement).value, 10);
    this.reinitTimestampManager();
  };

  // Helper methods
  updateVisibility() {
    const isVisible = formatterState.currentFormatter === 'MeasuredHTML';
    this.style.display = isVisible ? 'block' : 'none';
  }

  updateTimeDisplay(seconds: number) {
    if (!this.currentTimeDisplay) return;

    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    this.currentTimeDisplay.textContent = `${minutes}:${String(secs).padStart(2, '0')}`;
  }

  getFormatterContainer(): HTMLElement | null {
    // Get the formatter display element from the parent app's shadow DOM
    // audio-sync-panel and formatter-display are siblings in app-shell's shadow DOM
    const appShell = this.getRootNode() as ShadowRoot | Document;
    const formatterDisplay = appShell.querySelector('formatter-display');

    if (!formatterDisplay || !formatterDisplay.shadowRoot) {
      console.warn('formatter-display element or its shadow root not found');
      return null;
    }

    const container = formatterDisplay.shadowRoot.querySelector('.content-container');
    if (!container) {
      console.warn('.content-container not found in formatter-display shadow root');
    }

    return container as HTMLElement | null;
  }

  initTimestampManager() {
    // Clean up existing manager
    this.cleanup();

    const container = this.getFormatterContainer();
    if (!container) {
      console.warn('Cannot initialize TimestampManager: container not found');
      this.updateTimestampInfo(null, 0);
      return;
    }

    try {
      // The container itself is the scrollable element
      this.manager = new TimestampManager(container, {
        autoScroll: this.autoScrollEnabled,
        scrollOffset: this.scrollOffset,
        scrollThreshold: this.scrollOffset,
        highlightClass: 'cs-highlighted',
        scrollBehavior: 'smooth',
        scrollContainer: container, // Explicitly set the scroll container
        lookAheadMs: this.lookAheadMs, // Pre-scroll before timestamp
      });

      // Set up entry change listener
      this.manager.onEntryChange((entry) => {
        this.updateTimestampInfo(entry, this.manager?.getTimestamps().length || 0);
      });

      const timestamps = this.manager.getTimestamps();
      this.updateTimestampInfo(null, timestamps.length);

      console.log('TimestampManager initialized with', timestamps.length, 'timestamps');
    } catch (error) {
      console.error('Error initializing TimestampManager:', error);
      this.updateTimestampInfo(null, 0);
    }
  }

  reinitTimestampManager() {
    if (formatterState.currentFormatter === 'MeasuredHTML') {
      this.initTimestampManager();
    }
  }

  updateTimestampInfo(entry: TimestampEntry | null, totalTimestamps: number) {
    if (!this.timestampInfoElement) return;

    const statusText = this.shadowRoot?.getElementById('status-text');

    if (totalTimestamps === 0) {
      if (statusText) {
        statusText.textContent = 'No timestamps detected';
      }
      this.timestampInfoElement.classList.remove('active');
      this.timestampInfoElement.innerHTML = `
        <div class="info-row">
          <span class="info-label">Status:</span>
          <span id="status-text">No timestamps detected</span>
        </div>
      `;
      return;
    }

    if (!entry) {
      this.timestampInfoElement.classList.remove('active');
      this.timestampInfoElement.innerHTML = `
        <div class="info-row">
          <span class="info-label">Total Timestamps:</span>
          <span>${totalTimestamps}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status:</span>
          <span>Ready - move slider or play audio</span>
        </div>
      `;
      return;
    }

    // Active entry
    this.timestampInfoElement.classList.add('active');

    const repeatInfo = entry.totalRepeats > 1 ?
      ` (${entry.repeatIndex + 1}/${entry.totalRepeats})` :
      '';

    this.timestampInfoElement.innerHTML = `
      <div class="info-row">
        <span class="info-label">Active Time:</span>
        <span>${entry.formattedTime}${repeatInfo}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Total Timestamps:</span>
        <span>${totalTimestamps}</span>
      </div>
    `;
  }

  cleanup() {
    if (this.manager) {
      this.manager.dispose();
      this.manager = null;
    }

    if (this.audioElement) {
      this.audioElement.pause();
      URL.revokeObjectURL(this.audioElement.src);
      this.audioElement = null;
    }

    this.isPlaying = false;
  }
}

// Register the web component
customElements.define('audio-sync-panel', AudioSyncPanel);
