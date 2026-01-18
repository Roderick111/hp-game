# Witness Portraits

This directory contains character portrait images for the Auror Academy game.

## Modern Format Support (2025) ✅

All portraits have been converted to modern formats with automatic fallback:

```
portraits/
  hermione.avif             # AVIF - Best compression (79-125KB, ~75-93% smaller)
  hermione.webp             # WebP - Good compression (78-120KB, ~75-93% smaller)
  hermione.png              # PNG - Legacy fallback (400KB-1.7MB)
```

**Conversion completed:**
- Run `bun run convert-images` to update optimized formats after adding new portraits
- Script automatically converts both `/locations/` and `/portraits/` directories
- Uses Sharp library for high-quality conversion (AVIF q75, WebP q85)

## Convention

Name portraits by their witness ID:

```
portraits/
  hermione.{avif,webp,png}
  draco.{avif,webp,png}
  mcgonagall.{avif,webp,png}
  argus_filch.{avif,webp,png}
```

## Auto-Loading

The `PortraitImage` component automatically loads portraits with format fallback:
1. Tries AVIF first (best compression)
2. Falls back to WebP (good compression)
3. Falls back to PNG (legacy support)
4. Shows "?" placeholder if none exist

## Image Specifications

- **Format**: AVIF (preferred) → WebP → PNG (fallback)
- **Aspect Ratio**: Square or portrait (1:1 or 3:4)
- **Size**:
  - AVIF: < 150KB (excellent compression)
  - WebP: < 200KB (good compression)
  - PNG: < 500KB (fallback only)
- **Dimensions**: 800x800px or 600x800px recommended
- **Quality**: 75-85 for AVIF/WebP, 90 for PNG
- **Style**: Match the magical detective aesthetic with terminal/noir vibes

## Performance Features

- **Modern formats**: AVIF and WebP reduce file size by 75-93%
- **Async decoding**: Non-blocking image decode
- **Scanline overlay**: Applied automatically for terminal aesthetic
- **Fallback support**: Graceful degradation to PNG
