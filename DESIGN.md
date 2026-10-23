---
name: Trips
description: A shared pool of saved places that looks and works like a native maps app.
colors:
  background: "#ffffff"
  foreground: "#1c1c1e"
  secondary: "#636366"
  grouped: "#f2f2f7"
  fill: "#e9e9ee"
  separator: "#dcdce1"
  accent: "#0062cc"
  accent-tint: "#e5f0fc"
  danger: "#c4231a"
  background-dark: "#1c1c1e"
  foreground-dark: "#f2f2f7"
  secondary-dark: "#a1a1a8"
  grouped-dark: "#000000"
  fill-dark: "#2c2c2e"
  separator-dark: "#38383a"
  accent-dark: "#3b9bff"
  accent-tint-dark: "#0f2a47"
  danger-dark: "#ff6961"
  category-eat: "#e4572e"
  category-coffee: "#8a5a44"
  category-drink: "#7b2cbf"
  category-shop: "#2a9d8f"
  category-records: "#e0a100"
  category-books: "#4c9a2a"
  category-see: "#d6336c"
  category-stay: "#495057"
  category-unsorted: "#adb5bd"
  map-cluster: "#262626"
  material: "rgb(255 255 255 / 0.74)"
  material-dark: "rgb(28 28 30 / 0.92)"
  pressed-top: "#1670d8"
  control-top: "#f1f1f5"
  control-bottom: "#e7e7ec"
  card-top: "#f7f7fa"
  card-bottom: "#f0f0f5"
  raised-top: "#ffffff"
  raised-bottom: "#fbfbfd"
  column-bottom: "#f8f8fb"
  control-top-dark: "#343437"
  control-bottom-dark: "#2a2a2d"
  card-top-dark: "#323235"
  card-bottom-dark: "#2c2c2f"
  raised-top-dark: "#4a4a4e"
  raised-bottom-dark: "#3e3e42"
  column-top-dark: "#1f1f22"
  column-bottom-dark: "#19191b"
typography:
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, Segoe UI, Roboto, Helvetica Neue, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, Segoe UI, Roboto, Helvetica Neue, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.375
  body-emphasis:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, Segoe UI, Roboto, Helvetica Neue, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.375
  subhead:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, Segoe UI, Roboto, Helvetica Neue, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.375
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, Segoe UI, Roboto, Helvetica Neue, sans-serif"
    fontSize: "15px"
    fontWeight: 500
  footnote:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, Segoe UI, Roboto, Helvetica Neue, sans-serif"
    fontSize: "13px"
    fontWeight: 400
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, Segoe UI, Roboto, Helvetica Neue, sans-serif"
    fontSize: "12px"
    fontWeight: 400
rounded:
  segment: "9px"
  segmented: "11px"
  control: "12px"
  card: "14px"
  sheet: "22px"
  full: "9999px"
spacing:
  hairline: "1px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  inset: "16px"
  section: "20px"
  sheet-top-gap: "48px"
  column: "400px"
components:
  chip:
    backgroundColor: "{colors.control-top}"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "0 14px"
    height: "36px"
  chip-active:
    backgroundColor: "{colors.pressed-top}"
    textColor: "{colors.background}"
  chip-trip:
    backgroundColor: "{colors.accent-tint}"
    textColor: "{colors.accent}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "0 14px"
    height: "36px"
  search-field:
    backgroundColor: "{colors.control-top}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "40px"
  text-field:
    backgroundColor: "{colors.control-top}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "44px"
  button-primary:
    backgroundColor: "{colors.pressed-top}"
    textColor: "{colors.background}"
    typography: "{typography.body-emphasis}"
    rounded: "{rounded.control}"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.control-top}"
    textColor: "{colors.accent}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    height: "44px"
  button-text:
    textColor: "{colors.accent}"
    typography: "{typography.body}"
  segmented-control:
    backgroundColor: "{colors.control-top}"
    rounded: "{rounded.segmented}"
    padding: "2px"
  segmented-control-selected:
    backgroundColor: "{colors.raised-top}"
    typography: "{typography.label}"
    rounded: "{rounded.segment}"
    height: "32px"
  list-row:
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    height: "56px"
  list-row-hover:
    backgroundColor: "{colors.grouped}"
  list-row-pressed:
    backgroundColor: "{colors.fill}"
  note-card:
    backgroundColor: "{colors.card-top}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: "12px 14px"
  close-button:
    backgroundColor: "{colors.control-top}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.full}"
    size: "30px"
  sheet:
    backgroundColor: "{colors.material}"
    rounded: "{rounded.sheet}"
  sheet-dark:
    backgroundColor: "{colors.material-dark}"
    rounded: "{rounded.sheet}"
  column:
    backgroundColor: "{colors.background}"
    width: "400px"
---

# Design System: Trips

## Overview

**Creative North Star: "The Native Maps App"**

Trips is meant to look like it shipped with the phone. The whole app follows the standard look of its category on purpose (PRODUCT.md, Brand Commitments): an iPhone and Mac maps app, with Apple Maps as the bar for craft. Conventions are kept, not reinvented. The care goes into getting the details right: Apple's system type, Apple's grouped greys, one system blue, hairline separators, a frosted sheet you drag between three heights, and a segmented control.

The map is the main view and is not styled. Mapbox's light and dark base maps carry the place, and the app adds two things on top: category-coloured pins and the sheet (on a laptop, the list column). Everything chrome-like is quiet grey with a little material: controls are lit softly from above, pressed and selected controls sit deeper or higher, and the phone sheet is frosted glass over the map. The only colours you notice are the category dots and the blue that marks what is selected or tappable.

The layout is dense the way a native list is dense: 17px rows with a 15px line under them, 56px tall on a phone and 48px on a laptop, with separators that start where the text starts rather than under the dot.

**Key Characteristics:**
- System sans everywhere (SF on Apple devices); there is no brand typeface.
- Grouped greys and top-lit control surfaces; blue for selection, controls and links.
- Category dots are the only other colour, on pins, rows and chips.
- Hairline separators, inset to the text.
- A frosted bottom sheet with a grabber and three heights on phones; a fixed 400px solid column on laptops.
- Dark mode follows the system through the same named tokens.

## Colors

Apple's semantic greys and system blue, adjusted so text meets 4.5:1, a fixed set of eight category colours, and a small set of two-stop surface gradients.

### Primary
- **System Blue** (`accent`; `accent-dark` in dark mode): the interactive colour for text and lines. Text buttons and links ("Trips", "Edit", "Move pin", "Clear filters"), blue text on secondary buttons and the trip pills, the focus ring, the text caret, the selected-pin ring and the draggable pin marker. Text selection uses it at 28%.
- **Pressed Blue** (a gradient from `pressed-top` down to `accent` light, #0062cc): the fill of anything pressed or committing: active chips and the primary button, with white text. It is the same in both modes, because the dark-mode link blue (`accent-dark`) is too light to carry white text at 4.5:1.
- **Blue Wash** (`accent-tint`): the background of the "In [trip]" pill, with blue text on top. It means "this place is already part of this", not "tap here".

### Secondary
- **Category Dots** (`category-eat` through `category-stay`, plus `category-unsorted` grey): one colour per fixed category. Used only as dots: pins on the map, the 12px dot at the start of a row, the 10px dot inside a chip. They are never used for text, fills or borders.

### Neutral
- **Background** (`background`): the solid fallback for the sheet, the laptop column's base, and map controls.
- **Material** (`material` light, `material-dark` dark): the frosted phone sheet. See Elevation & Depth.
- **Column** (`background` to `column-bottom`; dark `column-top-dark` to `column-bottom-dark`): the laptop column's faint top-to-bottom gradient.
- **Control** (`control-top` to `control-bottom`; dark `control-top-dark` to `control-bottom-dark`): resting chips, the search field, text fields, the segmented track, the close button, the city button, "Add to trip" and secondary buttons.
- **Card** (`card-top` to `card-bottom`; dark `card-top-dark` to `card-bottom-dark`): the note card.
- **Raised** (`raised-top` to `raised-bottom`; dark `raised-top-dark` to `raised-bottom-dark`): the selected segment.
- **Grouped** (`grouped`): the canvas behind the map and row hover. In dark mode it goes to pure black.
- **Fill** (`fill`): the pressed list row. Controls no longer use it as a flat fill.
- **Separator** (`separator`): hairline row dividers, the laptop column's right edge, the grabber, the divider between filter groups, scrollbar thumbs.
- **Foreground** (`foreground`): primary text.
- **Secondary** (`secondary`): metadata lines, distances, counts, placeholders, field labels, map attribution text, the close cross, the "Sign out" link.
- **Danger** (`danger`): inline error text only ("Couldn't save that change").
- **Cluster Ink** (`map-cluster`): map clusters, at 85% opacity with a white outline and white count.

### Named Rules
**The One Blue Rule.** Blue means tappable or selected. Nothing decorative is blue, and nothing tappable gets a second accent colour. Pressed Blue is the same hue, deepened so white text stays legible; it is not a second accent.

**The Dots Only Rule.** Category colour only appears as a dot or a pin. A category never tints a row, a fill or any text.

**The Token Mirror Rule.** The map draws outside CSS, so `pool-map.tsx` repeats the light and dark accent hex values by hand. Any change to `--accent` must be made in both places.

## Typography

**Font:** System sans (`-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, …`), set as `--font-sans`.
**Map labels:** Mapbox's own fonts (DIN Pro on cluster counts), left as the base map draws them.

**Character:** The platform's own voice: SF Text sizes on iOS, nothing to show off.

### Hierarchy
- **Title** (700, 22px, 1.25, -0.01em): the space name at the top of the sheet and the place name in detail view (up to two lines).
- **Body** (400, 17px, 1.375): row names, note text, field input, text buttons. **Body emphasis** (600, 17px) for empty-state headings and the primary button.
- **Subhead** (400, 15px): the metadata line under a row ("See · Rome"), distances, status messages, secondary links. Section headings ("Note", "Category", "Trips") use it at 600.
- **Label** (500, 15px): chips and segments. The selected segment and the city button go to 600.
- **Footnote** (400, 13px): form field labels.
- **Caption** (400, 12px): search-provider attribution.

### Named Rules
**The Tabular Numbers Rule.** Distances and counts use tabular numerals so a column of "80 m" and "200 m" lines up.

**The Middle Dot Rule.** Metadata joins with " · " in one secondary line (category, then status or city, then distance), never as separate badges.

## Layout

**Phone (below 1024px):** the map fills the screen edge to edge. A bottom sheet sits over it at one of three heights: peek (124px: title and search), half (50dvh) and full (the viewport minus a 48px gap at the top). The sheet's content scrolls on its own and pads its bottom so the last rows can still scroll into view at lower heights. Mapbox's logo and credits move to the top left so the sheet does not hide them.

**Laptop (1024px and up):** the same content becomes a 400px column on the left, full height, with a hairline right edge and no shadow, radius or frost. The map fills the rest. Hovering a row highlights its pin.

**Rhythm:** a 16px side inset on everything in the sheet; 8px between chips; 10–12px between the header rows; 20px between detail sections. Filter chips scroll sideways on a phone and wrap on a laptop. Footers respect the safe area (`max(24px, env(safe-area-inset-bottom))`).

## Elevation & Depth

A light material system on top of tonal layers. Things that float over the map (the phone sheet, the map controls, pins) get soft ambient shadows. Controls are not flat: they carry a faint top-to-bottom gradient and an inset hairline highlight along the top edge, as if lit from above. State moves a control in depth: a pressed or active control sinks into a deeper blue with a soft blue glow below it; the selected segment rises as a white tab with a small drop shadow. All shadows are soft and ambient; none are hard or offset.

**Frosted sheet.** On phones the sheet is translucent material: white at 74% with `blur(24px) saturate(180%)` in light mode; in dark mode #1c1c1e at 92% with plain `blur(24px)`. Dark is near-opaque on purpose, so it stays a neutral grey over the navy night map instead of picking up its blue; the frost is visible in light mode only. Where the browser cannot blur (`backdrop-filter` unsupported), the sheet is solid `background`. The laptop column is never frosted: solid `background` under the column gradient.

### Shadow Vocabulary
- **Sheet** (`--sheet-shadow`: a 1px top hairline plus `0 -8px 28px` at 12% light / 50% dark): the phone sheet only; removed in the laptop column.
- **Material edge** (`--material-edge`: `inset 0 1px 0` white at 90% light / 10% dark): the lit top edge of the frosted sheet, layered with the sheet shadow.
- **Control edge** (`--control-edge`: `inset 0 1px 0` white at 85% / 7%, plus `inset 0 -0.5px 0` black at 5% / 30%): every resting control, the note card and the trip pill.
- **Pressed edge** (`--pressed-edge`: `inset 0 1px 0` white at 22% / 18%, plus `0 3px 10px -3px` in blue at 55% light, black at 60% dark): active chips and the primary button.
- **Raised edge** (`--raised-edge`: `0 1px 2px` plus `0 3px 8px -2px`, black at 10–12% light / 40% dark): the selected segment.
- **Map control** (`0 2px 10px rgb(0 0 0 / 0.14)`): Mapbox's zoom group, solid `background` with a 12px radius.
- **Pin shadow** (black circle at 22% opacity, radius 10, blur 0.6, nudged down 1.5px): under every pin.

### Named Rules
**The Lit From Above Rule.** Every control surface uses one of the material utilities (`control`, `card`, `pressed`, `raised`, `material`), never a flat fill plus a one-off shadow. They pair each gradient with its edge, and switch with state (`aria-pressed:pressed`, `aria-pressed:raised`).

**The Neutral Glass Rule.** Frost must not tint the sheet. Over a coloured map, density beats translucency: keep dark material near-opaque and unsaturated.

## Shapes

Softly rounded, iOS-style. Chips, pills, the close button, the grabber and every dot are fully round. Controls (search field, text fields, buttons) and the map control group use 12px corners; the note card 14px. The segmented control is 11px outside and 9px inside. The phone sheet has 22px top corners; the laptop column is square. Dividers are 1px hairlines; there are no outlined boxes and no borders on controls; edges are drawn with inset highlights, not strokes.

Pins are flat circles: 8px radius with a 2.5px white ring at rest, 11px with a 3px white ring on hover, and 12px with a 4px blue ring when selected. List and chip dots are flat too: the plain category colour (the `dot` utility). Gradients belong to surfaces, never to dots or icons.

## Components

### Buttons
- **Shape:** softly rounded (12px), 44px tall, full-width in pairs.
- **Primary:** pressed blue material with white 17px semibold text ("Save").
- **Secondary:** control material with blue 17px text ("Cancel").
- **Text button:** plain blue 17px or 15px text with no background ("Edit", "Move pin", "Trips"). This is the default action style.
- **Close:** a 30px control-material circle with a 12px secondary-coloured cross.
- **Focus:** a 2px blue outline offset by 2px everywhere; list rows draw it inset.

### Chips
- **Style:** 36px pill in control material, 15px medium text, 14px side padding. Category chips start with a 10px lit dot that has a thin white ring.
- **State:** pressed (`aria-pressed`) switches the chip to pressed blue material with white text, and the dot's ring gets thicker. Nearby has a filled arrow icon. A hairline divider separates Nearby/Want/Been from the categories.
- **Trip pill:** same shape in blue wash with blue text and the control edge, for trips the place is already in. "Add to trip" is a control pill with blue text that opens a native select.
- **City button:** control pill, semibold name, a secondary-coloured count and a chevron; it covers a native `<select>`.

### Segmented Control
Want/Been in the detail view. A control-material track with 2px padding and 11px corners; segments are 32px tall with 9px corners. The selected segment is raised: white material, semibold, with the raised edge.

### Inputs / Fields
- **Style:** control material, no border, 12px corners, 17px text. Search is 40px with a 17px magnifier in secondary; text fields are 44px. Labels sit above in 13px secondary.
- **Focus:** a 2px blue ring and a blue caret.
- **Error:** an inline 15px danger-coloured line under the control.

### List Row
The core component. A 40px lead column holds the 12px lit category dot; then a 17px name over a 15px secondary metadata line, both truncated to one line; then a right-aligned distance in tabular numbers when location is on. The hairline under each row starts at the text, not the dot. Rows are transparent over the sheet; hover and keyboard focus show grouped grey; pressing shows fill grey. 56px tall on phone, 48px on laptop.

### Sheet
On phones, a frosted material panel with 22px top corners, the lit material edge and the sheet shadow (see Elevation & Depth for values and the solid fallback). On laptops, a solid column on the column gradient. A 36×5px rounded grabber in separator grey sits in a 20px strip. Drag, tap or flick moves it between peek, half and full; the arrow keys do the same from the grabber. It settles over 420ms on `cubic-bezier(0.32, 0.72, 0, 1)`, only when reduced motion is not requested.

### Note Card
A card-material 14px card with 12px by 14px padding and the control edge: "Added by [name], via [source]" with the labels in secondary, then the why. Placeholder text is secondary.

### Map
Mapbox Standard with the faded theme: parks, water and buildings in soft colour. Its own place icons, transit labels and 3D buildings are off, so only our pins mark places. Day and night lighting follow the system setting live, and every pin and cluster layer is lit at full strength so night never dims it. Pins and clusters as described under Shapes and Colors. Zoom controls and attribution are re-themed with app tokens; their icons are inverted in dark mode.

## Do's and Don'ts

### Do:
- **Do** use the platform convention first; if Apple Maps or iOS has a standard control for it, use that look (segmented control, grouped list, frosted sheet with grabber, lit search field).
- **Do** keep blue for selection, focus and tappable things only; use pressed blue for any blue fill carrying white text.
- **Do** show categories as dots (12px in rows, 10px in chips, 8px-radius pins), not as text or fill colour; keep every dot and pin flat, with no gradient or highlight.
- **Do** build surfaces from the material utilities (`control`, `card`, `pressed`, `raised`, `material`) and the `--background`, `--grouped`, `--fill` and `--separator` tokens so dark mode keeps working.
- **Do** keep a solid fallback behind anything frosted.
- **Do** use the 17 / 15 / 13 px sizes and tabular numerals for distances and counts.
- **Do** put any new colour or accent change in `globals.css` and mirror it in `pool-map.tsx`.

### Don't:
- **Don't** add a brand typeface or display face; the app uses the system sans on purpose.
- **Don't** add a second accent colour or colour-coded fills.
- **Don't** use borders around controls; separate with material edges, fill steps and hairlines.
- **Don't** add hard or offset shadows; the only shadows are the soft ones listed under Elevation & Depth.
- **Don't** frost the laptop column or let the dark material tint toward the map.
- **Don't** add small uppercase labels above titles; section headings are plain 15px semibold words.
