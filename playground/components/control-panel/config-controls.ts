import { editorState, editorActions } from '../../stores/editor-store';
import { formatterState, formatterActions } from '../../stores/formatter-store';
import { formatterConfigExamples } from '../../fixtures';
import { APP_EVENTS } from '../../stores/init-store';

/**
 * Web component for configuration controls
 * Handles preset selection and config application
 */
export class ConfigControls extends HTMLElement {
  private presetSelector: HTMLSelectElement | null = null;
  private applyButton: HTMLButtonElement | null = null;
  
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.updatePresetSelector();
  }
  
  disconnectedCallback() {
    this.removeEventListeners();
  }
  
  render() {
    if (!this.shadowRoot) return;
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          align-items: center;
          padding: 8px;
          font-family: Arial, sans-serif;
          gap: 8px;
        }
        
        .config-controls-container {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
        }
        
        .config-label {
          font-size: 14px;
          font-weight: bold;
          white-space: nowrap;
        }
        
        select {
          padding: 4px 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          background-color: #fff;
          font-size: 14px;
          flex: 1;
        }
        
        button {
          padding: 4px 8px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        button:hover {
          background-color: #45a049;
        }
      </style>
      
      <div class="config-controls-container">
        <span class="config-label">Preset:</span>
        <select id="preset-selector">
          <option value="current">Current Configuration</option>
          <!-- Presets will be added dynamically -->
        </select>
        
        <button id="apply-button">Apply</button>
      </div>
    `;
    
    // Get UI elements
    this.presetSelector = this.shadowRoot.getElementById('preset-selector') as HTMLSelectElement;
    this.applyButton = this.shadowRoot.getElementById('apply-button') as HTMLButtonElement;
  }
  
  setupEventListeners() {
    // Setup preset selector change event
    if (this.presetSelector) {
      this.presetSelector.addEventListener('change', this.handlePresetChange);
    }
    
    // Setup apply button click event
    if (this.applyButton) {
      this.applyButton.addEventListener('click', this.handleApplyConfig);
    }
    
    // Listen for formatter changes to update presets
    document.addEventListener(APP_EVENTS.FORMATTER_CHANGED, this.handleFormatterChange);
    
    // Listen for formatter pre-change
    document.addEventListener(APP_EVENTS.FORMATTER_WILL_CHANGE, this.handleFormatterWillChange);
  }
  
  removeEventListeners() {
    if (this.presetSelector) {
      this.presetSelector.removeEventListener('change', this.handlePresetChange);
    }
    
    if (this.applyButton) {
      this.applyButton.removeEventListener('click', this.handleApplyConfig);
    }
    
    document.removeEventListener(APP_EVENTS.FORMATTER_CHANGED, this.handleFormatterChange);
    document.removeEventListener(APP_EVENTS.FORMATTER_WILL_CHANGE, this.handleFormatterWillChange);
  }
  
  // Event handler for formatter changes
  handleFormatterChange = () => {
    console.log('Formatter changed, updating preset selector');
    this.updatePresetSelector();
  };
  
  // Event handler for formatter pre-change
  handleFormatterWillChange = () => {
    console.log('Formatter will change, resetting preset selector');
    // Reset the preset selector to the first option
    if (this.presetSelector) {
      this.presetSelector.selectedIndex = 0;
    }
  };
  
  // Event handler for preset changes
  handlePresetChange = (e: Event) => {
    const select = e.target as HTMLSelectElement;
    const selectedValue = select.value;
    
    if (selectedValue === 'current') {
      // Just reload the current config
      document.dispatchEvent(new CustomEvent(APP_EVENTS.CONFIG_RELOAD_REQUESTED));
      return;
    }
    
    // Parse the preset index
    const presetIndex = parseInt(selectedValue, 10);
    if (!isNaN(presetIndex)) {
      // Load the preset configuration
      const formatter = formatterState.currentFormatter;
      const presets = formatterConfigExamples[formatter];
      
      if (presets && presets[presetIndex]) {
        // Update the editor with the preset config
        const presetConfig = JSON.stringify(presets[presetIndex].content, null, 2);
        editorActions.updateConfigContent(presetConfig);
      }
    }
  };
  
  // Event handler for apply button
  handleApplyConfig = () => {
    console.log('Apply button clicked, applying configuration');
    // Parse the JSON content and apply it as configuration
    try {
      const configContent = editorState.configInput;
      const config = JSON.parse(configContent);
      
      const formatter = formatterState.currentFormatter;
      if (formatter) {
        formatterActions.updateFormatterConfig(formatter, config);
        console.log(`Applied configuration to ${formatter} formatter`);
      }
    } catch (error) {
      console.error('Error applying configuration:', error);
    }
  };
  
  updatePresetSelector() {
    if (!this.presetSelector) return;
    
    // Clear existing options (except the first 'Current Configuration' option)
    while (this.presetSelector.options.length > 1) {
      this.presetSelector.remove(1);
    }
    
    // Get presets for current formatter
    const formatter = formatterState.currentFormatter;
    const presets = formatterConfigExamples[formatter];
    
    if (presets && presets.length > 0) {
      // Add preset options
      presets.forEach((preset, index) => {
        const option = document.createElement('option');
        option.value = index.toString();
        option.textContent = preset.name;
        this.presetSelector?.appendChild(option);
      });
      
      console.log(`Added ${presets.length} presets for ${formatter}`);
    } else {
      console.log(`No presets available for ${formatter}`);
    }
  }
}

// Register the web component
customElements.define('config-controls', ConfigControls);