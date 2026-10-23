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
  segment: "7px"
  segmented: "9px"
  control: "10px"
  sheet: "14px"
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
    backgroundColor: "{colors.fill}"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "0 14px"
    height: "36px"
  chip-active:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.background}"
  chip-trip:
    backgroundColor: "{colors.accent-tint}"
    textColor: "{colors.accent}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "0 14px"
    height: "36px"
  search-field:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "40px"
  text-field:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "44px"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.background}"
    typography: "{typography.body-emphasis}"
    rounded: "{rounded.control}"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.accent}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    height: "44px"
  button-text:
    textColor: "{colors.accent}"
    typography: "{typography.body}"
  segmented-control:
    backgroundColor: "{colors.fill}"
    rounded: "{rounded.segmented}"
    padding: "2px"
  segmented-control-selected:
    backgroundColor: "{colors.background}"
    typography: "{typography.label}"
    rounded: "{rounded.segment}"
    height: "32px"
  list-row:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    height: "56px"
  list-row-hover:
    backgroundColor: "{colors.grouped}"
  list-row-pressed:
    backgroundColor: "{colors.fill}"
  note-card:
    backgroundColor: "{colors.grouped}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
  close-button:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.full}"
    size: "30px"
  sheet:
    backgroundColor: "{colors.background}"
    rounded: "{rounded.sheet}"
---

# Design System: Trips

## Overview

**Creative North Star: "The Native Maps App"**

Trips is meant to look like it shipped with the phone. The whole app follows the standard look of its category on purpose (PRODUCT.md, Brand Commitments): an iPhone and Mac maps app, with Apple Maps as the bar for craft. Conventions are kept, not reinvented. The care goes into getting the details right: Apple's system type, Apple's grouped greys, one system blue, hairline separators, a sheet you drag between three heights, and a segmented control.

The map is the main view and is not styled. Mapbox's light and dark base maps carry the place, and the app adds two things on top: category-coloured pins and the sheet (on a laptop, the list column). Everything chrome-like is quiet grey, so the only colours you notice are the category dots and the one blue that marks what is selected or tappable.

The layout is dense the way a native list is dense: 17px rows with a 15px line under them, 56px tall on a phone and 48px on a laptop, with separators that start where the text starts rather than under the dot.

**Key Characteristics:**
- System sans everywhere (SF on Apple devices); there is no brand typeface.
- Grouped-background greys for fills, one blue for selection, controls and links.
- Category dots are the only other colour, on pins, rows and chips.
- Hairline separators, inset to the text.
- A bottom sheet with a grabber and three heights on phones; a fixed 400px column on laptops.
- Dark mode follows the system through the same named tokens.

## Colors

Apple's semantic greys and system blue, adjusted so text meets 4.5:1, plus a fixed set of eight category colours.

### Primary
- **System Blue** (`accent`; `accent-dark` in dark mode): the only interactive colour. Selected chips, the primary button, text buttons and links ("Trips", "Edit", "Move pin", "Clear filters"), the focus ring, the text caret, the selected-pin ring and the draggable pin marker. Text selection uses it at 28%.
- **Blue Wash** (`accent-tint`): the background of the "In [trip]" pill, with blue text on top. It means "this place is already part of this", not "tap here".

### Secondary
- **Category Dots** (`category-eat` through `category-stay`, plus `category-unsorted` grey): one colour per fixed category. Used only as dots: pins on the map, the 12px dot at the start of a row, the 10px dot inside a chip. They are never used for text, fills or borders.

### Neutral
- **Background** (`background`): the sheet, the laptop column, map controls, and the selected segment.
- **Grouped** (`grouped`): the canvas behind the map, the note card, and row hover. In dark mode it goes to pure black.
- **Fill** (`fill`): resting chips, the search field, text fields, the segmented track, the close button and secondary buttons.
- **Separator** (`separator`): hairline row dividers, the laptop column's right edge, the grabber, the divider between filter groups, scrollbar thumbs.
- **Foreground** (`foreground`): primary text.
- **Secondary** (`secondary`): metadata lines, distances, counts, placeholders, field labels, map attribution text, the "Sign out" link.
- **Danger** (`danger`): inline error text only ("Couldn't save that change").
- **Cluster Ink** (`map-cluster`): map clusters, at 85% opacity with a white outline and white count.

### Named Rules
**The One Blue Rule.** Blue means tappable or selected. Nothing decorative is blue, and nothing tappable gets a second accent colour.

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

**Laptop (1024px and up):** the same content becomes a 400px column on the left, full height, with a hairline right edge and no shadow or radius. The map fills the rest. Hovering a row highlights its pin.

**Rhythm:** a 16px side inset on everything in the sheet; 8px between chips; 10–12px between the header rows; 20px between detail sections. Filter chips scroll sideways on a phone and wrap on a laptop. Footers respect the safe area (`max(24px, env(safe-area-inset-bottom))`).

## Elevation & Depth

Mostly flat with tonal layers (background on grouped on fill), with a few soft, ambient shadows where the platform uses them: the sheet over the map, the selected segment and the map control group. Pins get a blurred drop shadow so they lift off the base map. No hard or offset shadows.

### Shadow Vocabulary
- **Sheet** (`--sheet-shadow`: a 1px top hairline plus `0 -8px 28px` at 12% light / 50% dark): the phone sheet only; removed in the laptop column.
- **Segment lift** (`0 1px 3px rgb(0 0 0 / 0.12)`): the selected segment in the segmented control.
- **Map control** (`0 2px 10px rgb(0 0 0 / 0.14)`): Mapbox's zoom group, re-themed to the app's background with a 10px radius.
- **Pin shadow** (black circle at 22% opacity, radius 10, blur 0.6, nudged down 1.5px): under every pin.

### Named Rules
**The Tonal First Rule.** Separate things with a fill step or a hairline before you reach for a shadow. Shadows belong to things that float over the map.

## Shapes

Gently rounded, iOS-style. Chips, pills, the close button, the grabber and every dot are fully round. Controls (search field, text fields, buttons, the note card, the map control group) use 10px corners. The segmented control is 9px outside and 7px inside. The phone sheet has 14px top corners. Dividers are 1px hairlines; there are no outlined boxes and no borders on controls.

Pins are circles: 8px radius with a 2.5px white ring at rest, 11px with a 3px white ring on hover, and 12px with a 4px blue ring when selected.

## Components

### Buttons
- **Shape:** gently rounded (10px), 44px tall, full-width in pairs.
- **Primary:** blue fill, white 17px semibold text ("Save").
- **Secondary:** fill grey with blue 17px text ("Cancel").
- **Text button:** plain blue 17px or 15px text with no background ("Edit", "Move pin", "Trips"). This is the default action style.
- **Close:** a 30px grey circle with a 12px secondary-coloured cross.
- **Focus:** a 2px blue outline offset by 2px everywhere; list rows draw it inset.

### Chips
- **Style:** 36px pill, fill grey, 15px medium text, 14px side padding. Category chips start with a 10px dot that has a thin white ring.
- **State:** pressed (`aria-pressed`) turns the chip blue with white text, and the dot's ring gets thicker. Nearby has a filled arrow icon. A hairline divider separates Nearby/Want/Been from the categories.
- **Trip pill:** same shape in blue wash with blue text, for trips the place is already in. "Add to trip" is a fill pill with blue text that opens a native select.
- **City button:** same pill, semibold name, a secondary-coloured count and a chevron; it covers a native `<select>`.

### Segmented Control
Want/Been in the detail view. A fill-grey track with 2px padding and 9px corners; segments are 32px tall. The selected segment is background white, semibold, with a 7px radius and the segment-lift shadow.

### Inputs / Fields
- **Style:** fill grey, no border, 10px corners, 17px text. Search is 40px with a 17px magnifier in secondary; text fields are 44px. Labels sit above in 13px secondary.
- **Focus:** a 2px blue ring and a blue caret.
- **Error:** an inline 15px danger-coloured line under the control.

### List Row
The core component. A 40px lead column holds the 12px category dot; then a 17px name over a 15px secondary metadata line, both truncated to one line; then a right-aligned distance in tabular numbers when location is on. The hairline under each row starts at the text, not the dot. Hover and keyboard focus show grouped grey; pressing shows fill grey. 56px tall on phone, 48px on laptop.

### Sheet
A background-white panel with 14px top corners and the sheet shadow. A 36×5px rounded grabber in separator grey sits in a 20px strip. Drag, tap or flick moves it between peek, half and full; the arrow keys do the same from the grabber. It settles over 420ms on `cubic-bezier(0.32, 0.72, 0, 1)`, only when reduced motion is not requested.

### Note Card
A grouped-grey 10px card with 12px by 14px padding: "Added by [name], via [source]" with the labels in secondary, then the why. Placeholder text is secondary.

### Map
Mapbox light-v11 or dark-v11, picked from the system setting at load. Pins and clusters as described under Shapes and Colors. Zoom controls and attribution are re-themed with app tokens; their icons are inverted in dark mode.

## Do's and Don'ts

### Do:
- **Do** use the platform convention first; if Apple Maps or iOS has a standard control for it, use that look (segmented control, grouped list, sheet with grabber, fill-grey search field).
- **Do** keep blue for selection, focus and tappable things only.
- **Do** show categories as dots (12px in rows, 10px in chips, 8px-radius pins), not as text or fill colour.
- **Do** use `--background`, `--grouped`, `--fill` and `--separator` for every surface so dark mode keeps working.
- **Do** use the 17 / 15 / 13 px sizes and tabular numerals for distances and counts.
- **Do** put any new colour or accent change in `globals.css` and mirror it in `pool-map.tsx`.

### Don't:
- **Don't** add a brand typeface or display face; the app uses the system sans on purpose.
- **Don't** add a second accent colour or colour-coded fills.
- **Don't** use borders around controls; separate with fill steps and hairlines.
- **Don't** add hard or offset shadows; the only shadows are the soft ones listed under Elevation & Depth.
- **Don't** add small uppercase labels above titles; section headings are plain 15px semibold words.
