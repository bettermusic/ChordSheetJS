import { ChordProParser, PdfFormatter } from '../../../lib';

const chordpro = `
{title: Kingdom}
{subtitle: (feat. Naomi Raine & Chandler Moore)}
{artist: Maverick City}
{author: Kirk Franklin}
{key: F}


{c:Intro (2x)}
[Gm][F][/][/][|][Dbdim7][Dm][/][/][|]

{c:Verse 1 *1}
My [Dm7]heart has always [C/E]longed for something[F] more
I [Dm7]searched the stars to [Bb]knock on Heaven's [F2]door
Cre - [Dm7]ation groans for [C2/E]God to be re [F2]- vealed
[Dm7]Every wound we [Bb]carry will be[F2] healed
My eyes on the [G7/B]Son, Lord Your will be [Bbm6]done

{c:Chorus 1 *2}
Thine is the [Gm]King - [F]dom, the power, the [Dbdim7]glo - [Dm]ry
Forever and [Gm]e - [F]ver, He finished my [Dbdim7]sto - [Dm]ry
We’re singing [Gm]free - [F/A]dom, our testi - [Dbdim7]mo - [Dm]ny
We’ll be singing for - [G13]ev - [Gm7/C]er, a - [F]men[A7(#9)/E][Dm11]
We’ll be [Dm/C]singing for - [G13]ever and [G13(#5)]ever, [Gm7/C] a - [F]men

{c:Verse 2 *3}
[Dm7]Beautiful each [C/E]color that He [F]made
Your [Dm7]love's the only [Bb]remedy for[F2] hate
[Dm7]You'll return to [C2/E]set the pris'ners [F2]free
‘Til [Dm7]then Your will on [Bb]Earth be done in[F2] me
My eyes on the [G7/B]Son, Lord Your will be [Bbm6]done

{c:Chorus 2 *4a}
Thine is the [Gm]King - [F]dom, the power the [Dbdim7]glo - [Dm]ry
Forever and [Gm]e - [F]ver, He finished my [Dbdim7]sto - [Dm]ry
We’re singing [Gm]free - [F/A]dom, our testi - [Dbdim7]mo - [Dm]ny
We’ll be singing for - [G13]ev - [Gm7/C]er, a - [F]men[x]

{c:Chorus 2 *4b}
Thine is the [Gm]King - [F]dom, the power the [Dbdim7]glo - [Dm]ry
Forever and [Gm]e - [F]ver, He finished my [Dbdim7]sto - [Dm]ry
We’re singing [Gm]free - [F/A]dom, our testi - [Dbdim7]mo - [Dm]ny
We’ll be singing for - [G13]ev - [Gm7/C]er, a - [F]men[A7(#9)][Dm11]
We’ll be [Dm7/C]singing for - [G13/B]ever and [G7(#5)]ever, [Gm7/C] a - [F]men[A7(#9)][Dm11]
We’ll be [Dm7/A]singing for - [G13]ev [G13(#5)]- [Gm7/C]er, a - [F]men[A7(#9)/E][Dm11]
We’ll be [Dm7/A]singing for - [G13]ever and [G13(#5)]ever, [Gm7/C] a - [F]men

{c:Interlude 1 (4x) *5}
[Dm7][/][C/E][/][|][F][/][Bb2][/][|]

{c:Bridge (3x) *6-7}
[Dm7] If you've [C/E]ever wondered[F] What [Bb2]Heaven looks like
[Dm7] [C/E] It’s looking like me [F]and you[Bb2]
[Dm7] If you've [C/E]ever questioned[F] What [Bb2]Heaven sounds like
[Dm7] [C2/E] Just let it fill [F]the room[Bb2]

{c:Tag 1 (8x) *8}
[Dm7] [C/E] Just let it fill [F]the room[Bb2]

{c:Tag 2 (4x) *9}
He's coming, He's [x]coming[x][x][x][|][x][x][x]

{c:Tag 3 (8x) *10}
He's coming, He's [Dm7]coming, [C/E] He's coming, He's [F]coming[Bb2]

{c:Interlude 2 (2x) *11}
[Bb2][/][/][/][|][/][/][/][/][|][/][/][/][/][|][/][/][/][/][|]

{c:Tag 4 *12}
[C/Bb]All [F/Bb]hail King [Bbma7]Jesus
[C/Bb]All [F/Bb]hail King [Bbma7]Jesus

{c:Tag 5 (2x) *13}
[C/E]All [F]hail King [Bbma7]Jesus
[C/E]All [F]hail King [Bbma7]Jesus

{c:Tag 6 *14}
[C/E]All [F]hail King [x]Je - [F13]sus[Ebma7]
[Bbma9] All [A7(#5)]hail King [x]Je - [F13]sus[Ebma7]
[Bbma9] All [A7(#5)]hail King [x]Je - [F13]sus[Ebma7]
[Bbma9] All [A7(#5)]hail King [x]Je - [F13]sus[Ebma7]
[Bbma9][|][/][/][/][|][/][/][/][/][|][/][/][/][/][|][/][/][/][|]

{c:Interlude 3 *15}
[Dm7][/][C/E][/][|][Eb/F][F9/A][Bbma9][A7(#9#5)][|]
[Dm9][/][C/E][/D][-][/Db][|][Cm7][F13][Bbma9][/][A7(#9#5)][|]

{c:Tag 7 (4x) *16-17}
[Dm7]If you wanna know [C/E]what Heaven looks [Eb/F]like
        F9/A    Bbma9    A7(#9#5)
Lookin' like me and   you
[Dm7]If you wanna know [C/E]what Heav - [Dm7]en [Eb/Db]sounds [Cm7]like
         F13      Bbma9     A7(#9#5)
Just let it  fill the   room

{c:Interlude 4 *18}
[Dm9][/][C/E][/][|][F9/A][Bbma9][/][A7(#9#5)][|]
[Dm9][/][C/E][/D][-][/Db][-][/C][|][F13][Bbma9][/][A7(#9#5)][|]

{c:Tag 8 (2x) *19}
If you [Dm9]wanna know [C/E]what Heaven looks like
        F9/A          Bbma9        A7(#9#5)
Lookin' like, lookin' like  me and you
If you [Dm9]wanna know [C/E]what Heav - [/D]en [/Db]looks [/C]like
     F13          Bbma9             A7(#9#5)
Just let it, just let   it fill the room

{c:Tag 9 *20a}
[Dm9]If you wanna know [C/E]what Heaven looks [Ebma7/F]like
        F9/A          Bbma9    A7(#9#5)
Lookin' like, lookin' like  me and      you
[Dm9]If you wanna know [C7/E]what Heav - [/D]en [/Db]sounds [Cm7]like
     F13          Bbma9             A7(#9#5)
Just let it, just let   it fill the room

{c:Tag 10 *20b}
[Dm9]If you wanna know [C/E]what Heaven looks [Ebma7/F]like
        F9/A          Bbma9    A7(#9#5)
Lookin' like, lookin' like  me and      you
[Dm9]If you wanna know [C7/E]what Heav - [/D]en [/Db]sounds [Cm7]like
Just [F13]let it, just [Bbma9]let it fill the room
`.substring(1);

// Initialize CodeMirror instance
const editor = CodeMirror(document.getElementById('editor'), {
  mode: "javascript",
  lineNumbers: true,
  value: chordpro
});

editor.setSize("100%", "90%");

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
