import { heredoc } from '../utilities';

export const chordProSheetSymbol = heredoc`
{title: Let it be}
{subtitle: ChordSheetJS example version}
{key: C}
{x_some_setting}
{composer: John Lennon}
{composer: Paul McCartney}
#This is my favorite song

Written by: %{composer|%{}|No composer defined for %{title|%{}|Untitled song}}

{start_of_verse: Verse 1}
Let it [Am]be, \\ let it [C/G]be, let it [F]be, let it [C]be
{transpose: 2}
[C]Whisper [*strong]words of [F]wis[G]dom, let it [F]be [C/E] [Dm] [C]
{end_of_verse}

{start_of_chorus}
{comment: Breakdown}
{transpose: G}
[Am]Whisper words of [Bb]wisdom, let it [F]be [C]
{end_of_chorus}

{start_of_chorus: label="Chorus 2"}
[C]Whisper words of [Bb]wisdom, let it [F]be [C]
{end_of_chorus}

{start_of_solo: Solo 1}
[C]Solo line 1
[F]Solo line 2
{end_of_solo}

{start_of_tab: label="Tab 1"}
Tab line 1
Tab line 2
{end_of_tab}

{start_of_abc: ABC 1}
ABC line 1
ABC line 2
{end_of_abc}

{start_of_ly: LY 1}
LY line 1
LY line 2
{end_of_ly}

{start_of_bridge: Bridge 1}
Bridge line
{end_of_bridge}

{start_of_grid: Grid 1}
Grid line 1
Grid line 2
{end_of_grid}`;

export const chordProSheetSolfege = heredoc`
{title: Let it be}
{subtitle: ChordSheetJS example version}
{key: Do}
{x_some_setting}
{composer: John Lennon}
{composer: Paul McCartney}
#This is my favorite song

Written by: %{composer|%{}|No composer defined for %{title|%{}|Untitled song}}

{start_of_verse: Verse 1}
Let it [Lam]be, let it [Do/Sol]be, let it [Fa]be, let it [Do]be
{transpose: 2}
[Do]Whisper [*strong]words of [Fa]wis[Sol]dom, let it [Fa]be [Do/Mi] [Rem] [Do]
{end_of_verse}

{start_of_chorus}
{comment: Breakdown}
{transpose: Sol}
[Lam]Whisper words of [Sib]wisdom, let it [Fa]be [Do]
{end_of_chorus}

{start_of_chorus: label="Chorus 2"}
[Lam]Whisper words of [Sib]wisdom, let it [Fa]be [Do]
{end_of_chorus}

{start_of_solo: Solo 1}
[Do]Solo line 1
[Fa]Solo line 2
{end_of_solo}

{start_of_tab: Tab 1}
Tab line 1
Tab line 2
{end_of_tab}

{start_of_abc: ABC 1}
ABC line 1
ABC line 2
{end_of_abc}

{start_of_ly: LY 1}
LY line 1
LY line 2
{end_of_ly}

{start_of_bridge: Bridge 1}
Bridge line
{end_of_bridge}

{start_of_grid: Grid 1}
Grid line 1
Grid line 2
{end_of_grid}`;
