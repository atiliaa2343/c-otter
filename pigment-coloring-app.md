# Pigment Coloring App — UI Design Reference

## Overview

A mobile coloring book app with a dark-themed shell and a clean white canvas for coloring pages. The UI is minimal and non-intrusive, keeping the artwork as the focal point.

---

## Screen Layout

```
┌─────────────────────────────────────┐
│  [✕]  [≡]           [↩]  [↪]  [⋯]  │  ← Top Navigation Bar (dark bg)
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │      COLORING CANVAS        │    │  ← White canvas with black line art
│  │    (line-art illustration)  │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
├─────────────────────────────────────┤
│        ●━━━━━━━━━━━━━━━━━━━━━       │  ← Brush Size Slider
├─────────────────────────────────────┤
│  ○  ○  ○  ○  ○  ○  ○  ○  ○         │  ← Color Palette Row (swatches)
├─────────────────────────────────────┤
│  [🎨]      [🪣]   [◻]  [✏️]  [⚙️]  │  ← Bottom Tool Bar
└─────────────────────────────────────┘
```

---

## Color Palette

| Role              | Value         | Description                   |
|-------------------|---------------|-------------------------------|
| App Background    | `#1c1c1e`     | Near-black dark grey           |
| Canvas Background | `#ffffff`      | Pure white                    |
| Canvas Border     | `#111111`      | Thin dark border/frame        |
| Line Art          | `#000000`      | Black outlines                |
| UI Icons          | `#ffffff`      | White icons on dark bg        |
| Active Tool Icon  | `#7b5fe5`      | Purple/violet highlight       |
| Slider Track      | `#e5c84a`      | Warm yellow/gold              |
| Slider Thumb      | `#d4a800`      | Deeper golden yellow          |

### Color Swatch Row (left → right)
| Swatch | Hex Approx   |
|--------|--------------|
| 1      | `#f5c07a`    | Soft peach/light orange       |
| 2      | `#f0956a`    | Warm salmon/melon             |
| 3      | `#e8664a`    | Coral red-orange              |
| 4      | `#e05a3a`    | Deep orange-red               |
| 5      | `#d4c050`    | Muted yellow (selected/white center) |
| 6      | `#8a9060`    | Olive/sage green              |
| 7      | `#c82020`    | Bright red                    |
| 8      | `#9e1010`    | Deep crimson                  |
| 9      | `#7a4a8a`    | Dusty purple                  |

---

## Top Navigation Bar

- **Background**: Dark (`#1c1c1e`), full-width
- **Left side**: `✕` (close/exit) + `≡` (settings/sliders icon)
- **Right side**: `↩` (undo) + `↪` (redo) + `⋯` (more options)
- **Style**: Icon-only, no labels; white icons; generous tap targets
- **Padding**: ~16px horizontal, ~12px vertical

---

## Coloring Canvas

- Centered on screen with equal left/right margins (~20px)
- **Border**: ~3px solid black, giving a "framed artwork" feel
- **Aspect ratio**: Approximately square or slightly portrait (e.g., 1:1.1)
- **Background**: Pure white
- **Content**: Black line-art illustration (coloring book style)
- Illustration fills the canvas edge-to-edge within the border

---

## Brush Size Slider

- Full-width horizontal slider between canvas and color palette
- **Track**: Thin line in warm yellow/gold (`#e5c84a`)
- **Thumb**: Circular dot, slightly larger, deeper gold (`#d4a800`)
- Positioned at roughly the center-left (default medium brush size)
- No numeric labels visible — purely visual

---

## Color Palette Row

- Single horizontal row of circular color swatches
- ~9 swatches visible, scrollable horizontally if more colors exist
- **Swatch size**: ~44–48px diameter circles
- **Selected swatch**: Indicated by a white center dot or ring highlight
- **Spacing**: ~8px gap between swatches
- Swatches are flat filled circles, no border unless selected

---

## Bottom Tool Bar

| Icon  | Tool               | Position  | Notes                          |
|-------|--------------------|-----------|--------------------------------|
| 🎨    | Color Picker/Palette| Far left  | Opens extended color panel    |
| 🪣    | Fill / Paint Bucket | Center-L  | Active tool (purple highlight) |
| ◻     | Eraser              | Center    | Erase filled color             |
| ✏️    | Pencil/Pen          | Center-R  | Freehand drawing tool          |
| ⚙️    | Settings            | Far right  | App settings                  |

- **Active tool** highlighted in purple (`#7b5fe5`)
- All other icons in white
- Bottom bar has same dark background as top bar
- Icons evenly spaced with generous touch targets (~56px)

---

## Typography & Text

- No visible text/labels in the main UI (icon-only navigation)
- App is designed for pure visual/tactile interaction
- Any overlay text (e.g., onboarding tooltips) would use a clean sans-serif

---

## Illustration Style (Canvas Content)

The coloring page shown features:
- **Subject**: Two cute chibi rabbits on a picnic blanket
- **Activity**: One rabbit playing ukulele, the other eating a cookie
- **Props**: Picnic basket, teacups with heart motifs, polka-dot treats, flowers
- **Background elements**: Fluffy clouds, grass tufts, scattered daisies, floating hearts
- **Art style**: Kawaii / chibi — rounded forms, minimal facial detail, soft outlines
- **Line weight**: Consistent medium-weight black lines throughout
- **No fill** — pure black-and-white line art ready to be colored

---

## Design Principles

1. **Dark chrome, bright canvas** — the dark UI shell makes the white canvas pop
2. **Tool accessibility** — all primary tools within thumb reach at the bottom
3. **Content-first** — minimal UI chrome keeps focus on the artwork
4. **Touch-optimized** — large tap targets, swipe-friendly color selection
5. **Undo/redo always visible** — critical for coloring confidence, placed top-right
6. **Warm color accents** — the gold slider and purple active state add personality without distracting

---

## Recreating This UI (Implementation Notes)

- Use a **dark background** (`#1c1c1e`) for the entire app shell
- Center the canvas with a fixed border and white background
- Implement the **color swatch row** as a horizontal `flexbox` or `ScrollView`
- Use a **range input** styled with custom thumb and track for the brush slider
- The **bottom toolbar** should be `position: fixed` or `sticky` at the bottom
- Active tool state uses a **purple tint** (`#7b5fe5`) on the icon
- Illustrations should be **SVG or high-res PNG** with transparent or white backgrounds
- Consider `canvas` API or SVG `fill` operations for the actual coloring interaction
