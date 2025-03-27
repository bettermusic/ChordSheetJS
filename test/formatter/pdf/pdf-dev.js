import { normalize } from 'path';
import { ChordProParser, PdfFormatter, HtmlDivFormatter, HtmlTableFormatter, TextFormatter, ChordProFormatter, ChordsOverWordsFormatter, Configuration } from '../../../src';
import { getKeys, getCapos } from '../../../src/helpers';
import { chordproExamples } from './chordpro-examples';
import { configExamples } from './config-examples';
import { exampleSongSymbol, exampleSongSolfege } from '../../fixtures/song';

// Initialize CodeMirror instances
const editor = CodeMirror(document.getElementById('editor'), {
  mode: 'javascript',
  lineNumbers: true,
  value: '',
});
editor.setSize('100%', '46vh');

const configEditor = CodeMirror(document.getElementById('configEditor'), {
  mode: 'javascript',
  lineNumbers: true,
  value: '',
});
configEditor.setSize('100%', '46vh');

// DOM elements
const chordproSelect = document.getElementById('chordproSelect');
const configSelect = document.getElementById('configSelect');
const keySelect = document.getElementById('keySelect');
const capoSelect = document.getElementById('capoSelect');
const formatterSelect = document.getElementById('formatterSelect');
const pdfViewer = document.getElementById('pdfViewer');
const textViewer = document.getElementById('textViewer');

// Formatter instances
const formatters = {
  PdfFormatter: new PdfFormatter(),
  HtmlDivFormatter: new HtmlDivFormatter(),
  HtmlTableFormatter: new HtmlTableFormatter(),
  TextFormatter: new TextFormatter(),
  ChordProFormatter: new ChordProFormatter(),
  ChordsOverWordsFormatter: new ChordsOverWordsFormatter(),
};

// Add song objects to examples
const allExamples = [
  ...chordproExamples,
  { name: '[TEST] Example Song Symbol', content: '', songObject: exampleSongSymbol },
  { name: '[TEST] Example Song Solfege', content: '', songObject: exampleSongSolfege },
];

function populateSelect(selectElement, options) {
  selectElement.innerHTML = '';
  options.forEach((option, index) => {
    const opt = document.createElement('option');
    opt.value = index;
    opt.text = option.name;
    selectElement.add(opt);
  });
}

populateSelect(chordproSelect, allExamples);
populateSelect(configSelect, configExamples);

function initializeKeyAndCapoSelectors(songKey) {
  const keys = getKeys(songKey);
  keySelect.innerHTML = '';
  keys.forEach(key => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = key;
    keySelect.appendChild(option);
  });
  keySelect.value = songKey;

  const capoPositions = getCapos(songKey);
  capoSelect.innerHTML = '';
  const noneOption = document.createElement('option');
  noneOption.value = 'none';
  noneOption.textContent = 'None';
  capoSelect.appendChild(noneOption);
  Object.entries(capoPositions).forEach(([position, resultingKey]) => {
    const option = document.createElement('option');
    option.value = position;
    option.textContent = `${position} (${resultingKey})`;
    capoSelect.appendChild(option);
  });
}

const updateOutput = async (key, capo) => {
  const selectedExampleIndex = parseInt(chordproSelect.value);
  const selectedExample = allExamples[selectedExampleIndex];
  const configText = configEditor.getValue();
  const selectedFormatter = formatterSelect.value;

  if (!configText.trim() && selectedFormatter === 'PdfFormatter') {
    return;
  }

  let configJson = {};
  if (selectedFormatter === 'PdfFormatter') {
    try {
      configJson = JSON.parse(configText);
    } catch (e) {
      console.error('Invalid JSON in config editor:', e);
      return;
    }
  }

  try {
    let song;
    if (selectedExample.songObject) {
      song = selectedExample.songObject;
      editor.setOption('readOnly', true);
    } else {
      const chordProText = editor.getValue();
      if (!chordProText.trim()) return;
      song = new ChordProParser().parse(chordProText, { softLineBreaks: true });
      editor.setOption('readOnly', false);
    }

    if (!keySelect.options.length && song.key) {
      initializeKeyAndCapoSelectors(song.key);
    }

    const initialKey = key || (keySelect.value || song.key);
    const capoPosition = capo || capoSelect.value;
    if (initialKey && song.key) song = song.changeKey(initialKey);
    if (capoPosition !== 'none') song = song.setCapo(parseInt(capoPosition));

    const formatter = formatters[selectedFormatter];
    const configuration = {
      key: initialKey,
      normalizeChords: true,
      useUnicodeModifiers: false,
    };

    // Render based on formatter type
    if (selectedFormatter === 'PdfFormatter') {
      formatter.format(song, configuration, configJson);
      const pdfBlob = await formatter.generatePDF();
      const blobUrl = URL.createObjectURL(pdfBlob);
      pdfViewer.src = blobUrl;
      pdfViewer.style.display = 'block';
      textViewer.style.display = 'none';
    } else {
      const output = formatter.format(song, configuration);
      textViewer.innerHTML = selectedFormatter.includes('Html') ? output : `<pre>${output}</pre>`;
      textViewer.style.display = 'block';
      pdfViewer.style.display = 'none';
    }
  } catch (e) {
    console.log(`⚠️ Error generating output with ${selectedFormatter}:`, e);
  }
};

function loadExample(index) {
  const example = allExamples[index];
  if (example.songObject) {
    editor.setValue(`// Using pre-defined Song object: ${example.name}\n// Editor is read-only`);
    editor.setOption('readOnly', true);
  } else {
    editor.setValue(example.content);
    editor.setOption('readOnly', false);
  }
  updateOutput();
}

function loadConfigExample(index) {
  const example = configExamples[index];
  const configString = JSON.stringify(example.content, null, 4);
  configEditor.setValue(configString);
  updateOutput();
}

// Event Listeners
keySelect.addEventListener('change', (e) => {
  initializeKeyAndCapoSelectors(e.target.value);
  updateOutput(e.target.value, capoSelect.value);
});

capoSelect.addEventListener('change', (e) => {
  updateOutput(keySelect.value, e.target.value);
});

chordproSelect.addEventListener('change', () => {
  loadExample(chordproSelect.value);
});

configSelect.addEventListener('change', () => {
  loadConfigExample(configSelect.value);
});

formatterSelect.addEventListener('change', () => {
  const isPdf = formatterSelect.value === 'PdfFormatter';
  configSelect.disabled = !isPdf;
  configEditor.setOption('readOnly', !isPdf);
  if (!isPdf) configEditor.setValue('// Configs only apply to PdfFormatter');
  updateOutput();
});

editor.on('change', () => {
  if (!editor.getOption('readOnly')) updateOutput();
});

configEditor.on('change', () => {
  if (formatterSelect.value === 'PdfFormatter') updateOutput();
});

function initialize() {
  chordproSelect.value = 0;
  configSelect.value = 0;
  loadExample(chordproSelect.value);
  loadConfigExample(configSelect.value);
}

document.addEventListener('DOMContentLoaded', initialize);