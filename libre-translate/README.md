# LibreTranslate Website Integration

Drop-in website translator using the open-source LibreTranslate API.

## Quick Start

1. Add the widget container and script to your HTML:

```html
<!-- In your header/nav -->
<div id="translator-widget"></div>

<!-- Before closing </body> -->
<script src="translator.js"></script>
<script>
  LibreTranslate.init({
    container: '#translator-widget'
  });
</script>
```

2. Open `example.html` to see it in action.

---

## Configuration Options

```javascript
LibreTranslate.init({
  // API endpoint (default: public instance)
  apiUrl: 'https://libretranslate.com',

  // Container element for the widget
  container: '#translator-widget',

  // Languages to offer (customize as needed)
  targetLanguages: [
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'zh', name: '中文' },
    { code: 'ar', name: 'العربية' }
  ],

  // CSS selectors for elements to translate
  elementsToTranslate: 'h1, h2, h3, p, a, button, li',

  // Elements to exclude from translation
  excludeSelectors: '.no-translate, .brand, code',

  // Cache translations in memory (faster repeat visits)
  cacheTranslations: true,

  // Show spinner while translating
  showLoadingIndicator: true,

  // API key (only needed for some self-hosted instances)
  apiKey: null
});
```

---

## Self-Hosting LibreTranslate

The public API at `libretranslate.com` has rate limits. For production use, self-host with Docker:

```bash
docker run -ti --rm -p 5000:5000 libretranslate/libretranslate
```

Then update your config:

```javascript
LibreTranslate.init({
  apiUrl: 'http://localhost:5000',
  container: '#translator-widget'
});
```

See [LibreTranslate GitHub](https://github.com/LibreTranslate/LibreTranslate) for full setup options.

---

## Excluding Content

Add `no-translate` class or `data-no-translate` attribute to skip elements:

```html
<!-- These won't be translated -->
<span class="no-translate">BEAM</span>
<div data-no-translate>Brand Name™</div>
```

---

## API Methods

```javascript
// Translate single text
const translated = await LibreTranslate.translate('Hello', 'es');

// Translate entire page to Spanish
await LibreTranslate.translatePage('es');

// Restore original content
LibreTranslate.restoreOriginal();

// Detect language of text
const lang = await LibreTranslate.detectLanguage('Bonjour');

// Get all supported languages from API
const languages = await LibreTranslate.getLanguages();

// Clear translation cache
LibreTranslate.clearCache();
```

---

## Features

- **Auto-detect source language** - No need to specify original language
- **Remembers preference** - Uses localStorage to persist user's language choice
- **Batch translation** - Efficiently translates multiple elements
- **Translation caching** - Avoids re-translating the same content
- **Dark mode support** - Widget adapts to system preferences
- **Lightweight** - No dependencies, ~8KB minified

---

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge).

---

## Files

```
libre-translate/
├── translator.js   # Main module (include this)
├── example.html    # Demo page
└── README.md       # This file
```
