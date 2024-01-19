import { ChordProParser, PdfFormatter } from '../../../lib';

const chordpro = `
{title: Kingdom}
{subtitle: (feat. Naomi Raine & Chandler Moore)}
{composer: Maverick City}
{lyricist: Kirk Franklin}
{key: F}


{comment: Intro (2x)}
[Gm][F][/][/][|][C#dim7][Dm][/][/][|]

{comment: Verse 1 *1}
My [Dm7]heart has always [C/E]longed for something[F] more
I [Dm7]searched the stars to [Bb]knock on Heaven's [F2]door
Cre - [Dm7]ation groans for [C2/E]God to be re [F2]- vealed
[Dm7]Every wound we [Bb]carry will be[F2] healed
My eyes on the [G7/B]Son, Lord Your will be [Bbm6]done
`.substring(1);

// Initialize CodeMirror instance
const editor = CodeMirror(document.getElementById('editor'), {
  mode: "javascript",
  lineNumbers: true,
  value: chordpro
});

// Function to render PDF in an <iframe> or <object>
const renderPDFInBrowser = async (pdfBlob) => {
    const pdfContainer = document.getElementById('pdfViewer');
    pdfContainer.innerHTML = ''; // Clear previous content
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    const blobUrl = URL.createObjectURL(pdfBlob); // Create a URL representing the Blob object
    iframe.src = blobUrl; // Use the Blob URL as the source for the iframe
    pdfContainer.appendChild(iframe);
};

// Function to update the PDF based on the editor content
const updatePDF = async (chordProText) => {
    const song = new ChordProParser().parse(chordProText);
    const formatter = new PdfFormatter();
    formatter.format(song);
    const pdfBlob = await formatter.generatePDF();
    renderPDFInBrowser(pdfBlob);
};
// Listen for changes in the editor
editor.on('change', (cm) => {
    updatePDF(cm.getValue());
});

// Initial rendering
updatePDF(editor.getValue());
