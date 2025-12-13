# Fonts Setup Guide

## Required Fonts

### Geist Sans (Variable Font)
- **Source:** [Vercel Geist Font](https://github.com/vercel/geist-font)
- **File:** `GeistVF.woff2`
- **Download:** 
  ```bash
  # Download from Vercel's GitHub releases
  wget https://github.com/vercel/geist-font/releases/latest/download/GeistVF.woff2
  # Place in apps/web/public/fonts/
  ```

### Alternative: Inter (Fallback)
If Geist font files are not available, the app will automatically fallback to Inter from Google Fonts.

## Font Installation

1. **Download Geist Sans:**
   ```bash
   cd apps/web/public/fonts
   # Download GeistVF.woff2 from Vercel's repository
   ```

2. **Verify fonts are loaded:**
   - Check browser DevTools → Network tab
   - Fonts should load with `display: swap` for better performance

3. **Font Loading:**
   - Geist Sans: Variable font (100-900 weight)
   - JetBrains Mono: Loaded from Google Fonts
   - Inter: Fallback from Google Fonts (if Geist unavailable)

## Font Usage

Fonts are automatically applied via CSS variables:
- `--font-geist-sans`: Primary sans-serif font
- `--font-jetbrains-mono`: Monospace font for code/terminal

## Performance

- Fonts use `display: swap` for better loading performance
- Variable fonts reduce file size
- Preload is enabled for critical fonts

