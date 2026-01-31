/**
 * LibreTranslate Integration Module
 *
 * Lightweight, drop-in website translator using LibreTranslate API.
 * Works with any HTML website - just include the script and add the widget.
 *
 * Usage:
 *   <script src="translator.js"></script>
 *   <div id="translator-widget"></div>
 *   <script>
 *     LibreTranslate.init({ container: '#translator-widget' });
 *   </script>
 */

const LibreTranslate = (function() {
  'use strict';

  // Default configuration
  const defaults = {
    apiUrl: 'https://libretranslate.com',  // Public instance (rate limited)
    // Self-hosted alternative: 'http://localhost:5000'
    container: '#translator-widget',
    sourceLanguage: 'auto',  // Auto-detect source language
    targetLanguages: [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Español' },
      { code: 'fr', name: 'Français' },
      { code: 'de', name: 'Deutsch' },
      { code: 'pt', name: 'Português' },
      { code: 'it', name: 'Italiano' },
      { code: 'zh', name: '中文' },
      { code: 'ja', name: '日本語' },
      { code: 'ko', name: '한국어' },
      { code: 'ar', name: 'العربية' },
      { code: 'ru', name: 'Русский' },
      { code: 'vi', name: 'Tiếng Việt' }
    ],
    elementsToTranslate: 'h1, h2, h3, h4, h5, h6, p, a, button, label, span, li, td, th, figcaption',
    excludeSelectors: '.no-translate, [data-no-translate], script, style, code, pre',
    cacheTranslations: true,
    showLoadingIndicator: true,
    apiKey: null  // Optional API key for self-hosted instances
  };

  let config = {};
  let originalContent = new Map();
  let translationCache = new Map();
  let currentLanguage = null;
  let isTranslating = false;

  /**
   * Initialize the translator
   */
  function init(options = {}) {
    config = { ...defaults, ...options };

    // Load cached language preference
    const savedLang = localStorage.getItem('libre-translate-lang');
    if (savedLang && savedLang !== 'original') {
      currentLanguage = savedLang;
    }

    // Store original content
    storeOriginalContent();

    // Render widget
    renderWidget();

    // Apply saved translation if exists
    if (currentLanguage) {
      translatePage(currentLanguage);
    }

    console.log('[LibreTranslate] Initialized');
  }

  /**
   * Store original text content for restoration
   */
  function storeOriginalContent() {
    const elements = document.querySelectorAll(config.elementsToTranslate);

    elements.forEach((el, index) => {
      if (shouldTranslate(el)) {
        const key = `el-${index}`;
        el.dataset.translateId = key;
        originalContent.set(key, {
          text: el.innerText,
          html: el.innerHTML
        });
      }
    });
  }

  /**
   * Check if element should be translated
   */
  function shouldTranslate(el) {
    // Skip excluded elements
    if (el.closest(config.excludeSelectors)) return false;

    // Skip empty elements
    if (!el.innerText || el.innerText.trim().length < 2) return false;

    // Skip elements with only numbers/symbols
    if (!/[a-zA-Z]/.test(el.innerText)) return false;

    return true;
  }

  /**
   * Render the language selector widget
   */
  function renderWidget() {
    const container = document.querySelector(config.container);
    if (!container) {
      console.warn(`[LibreTranslate] Container "${config.container}" not found`);
      return;
    }

    const widget = document.createElement('div');
    widget.className = 'libre-translate-widget';
    widget.innerHTML = `
      <div class="lt-select-wrapper">
        <svg class="lt-icon" viewBox="0 0 24 24" width="18" height="18">
          <path fill="currentColor" d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04M18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12m-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
        </svg>
        <select class="lt-select" id="lt-language-select">
          <option value="original">Original</option>
          ${config.targetLanguages.map(lang =>
            `<option value="${lang.code}" ${currentLanguage === lang.code ? 'selected' : ''}>${lang.name}</option>`
          ).join('')}
        </select>
        <svg class="lt-chevron" viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M7 10l5 5 5-5z"/>
        </svg>
      </div>
      <div class="lt-loading" style="display: none;">
        <div class="lt-spinner"></div>
        <span>Translating...</span>
      </div>
    `;

    container.appendChild(widget);

    // Add event listener
    const select = widget.querySelector('#lt-language-select');
    select.addEventListener('change', handleLanguageChange);

    // Inject styles
    injectStyles();
  }

  /**
   * Handle language selection change
   */
  async function handleLanguageChange(e) {
    const targetLang = e.target.value;

    if (targetLang === 'original') {
      restoreOriginal();
      localStorage.removeItem('libre-translate-lang');
      currentLanguage = null;
    } else {
      await translatePage(targetLang);
      localStorage.setItem('libre-translate-lang', targetLang);
      currentLanguage = targetLang;
    }
  }

  /**
   * Translate the entire page
   */
  async function translatePage(targetLang) {
    if (isTranslating) return;
    isTranslating = true;

    showLoading(true);

    try {
      const elements = document.querySelectorAll('[data-translate-id]');
      const textsToTranslate = [];
      const elementsMap = [];

      // Collect texts that need translation
      elements.forEach(el => {
        const id = el.dataset.translateId;
        const original = originalContent.get(id);
        if (!original) return;

        const cacheKey = `${original.text}-${targetLang}`;

        if (config.cacheTranslations && translationCache.has(cacheKey)) {
          // Use cached translation
          el.innerText = translationCache.get(cacheKey);
        } else {
          textsToTranslate.push(original.text);
          elementsMap.push({ el, cacheKey });
        }
      });

      // Batch translate remaining texts
      if (textsToTranslate.length > 0) {
        const translations = await batchTranslate(textsToTranslate, targetLang);

        translations.forEach((translated, index) => {
          const { el, cacheKey } = elementsMap[index];
          el.innerText = translated;

          if (config.cacheTranslations) {
            translationCache.set(cacheKey, translated);
          }
        });
      }

      document.documentElement.lang = targetLang;

    } catch (error) {
      console.error('[LibreTranslate] Translation failed:', error);
      alert('Translation failed. Please try again later.');
    } finally {
      isTranslating = false;
      showLoading(false);
    }
  }

  /**
   * Batch translate multiple texts
   */
  async function batchTranslate(texts, targetLang) {
    const BATCH_SIZE = 10;  // Translate in batches to avoid timeout
    const results = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(text => translate(text, targetLang))
      );
      results.push(...batchResults);

      // Small delay between batches to be nice to the API
      if (i + BATCH_SIZE < texts.length) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    return results;
  }

  /**
   * Translate a single text
   */
  async function translate(text, targetLang, sourceLang = 'auto') {
    const body = {
      q: text,
      source: sourceLang,
      target: targetLang,
      format: 'text'
    };

    if (config.apiKey) {
      body.api_key = config.apiKey;
    }

    const response = await fetch(`${config.apiUrl}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.translatedText;
  }

  /**
   * Restore original content
   */
  function restoreOriginal() {
    const elements = document.querySelectorAll('[data-translate-id]');

    elements.forEach(el => {
      const id = el.dataset.translateId;
      const original = originalContent.get(id);
      if (original) {
        el.innerHTML = original.html;
      }
    });

    document.documentElement.lang = 'en';
  }

  /**
   * Show/hide loading indicator
   */
  function showLoading(show) {
    if (!config.showLoadingIndicator) return;

    const loading = document.querySelector('.lt-loading');
    const select = document.querySelector('.lt-select-wrapper');

    if (loading && select) {
      loading.style.display = show ? 'flex' : 'none';
      select.style.display = show ? 'none' : 'flex';
    }
  }

  /**
   * Inject CSS styles
   */
  function injectStyles() {
    if (document.getElementById('libre-translate-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'libre-translate-styles';
    styles.textContent = `
      .libre-translate-widget {
        display: inline-flex;
        align-items: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .lt-select-wrapper {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        background: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .lt-select-wrapper:hover {
        background: #eee;
        border-color: #ccc;
      }

      .lt-icon {
        color: #666;
        flex-shrink: 0;
      }

      .lt-select {
        appearance: none;
        background: transparent;
        border: none;
        font-size: 14px;
        color: #333;
        cursor: pointer;
        padding-right: 4px;
        min-width: 80px;
      }

      .lt-select:focus {
        outline: none;
      }

      .lt-chevron {
        color: #666;
        flex-shrink: 0;
        margin-left: -4px;
      }

      .lt-loading {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-size: 14px;
        color: #666;
      }

      .lt-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #ddd;
        border-top-color: #666;
        border-radius: 50%;
        animation: lt-spin 0.8s linear infinite;
      }

      @keyframes lt-spin {
        to { transform: rotate(360deg); }
      }

      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .lt-select-wrapper {
          background: #333;
          border-color: #555;
        }

        .lt-select-wrapper:hover {
          background: #444;
          border-color: #666;
        }

        .lt-icon, .lt-chevron {
          color: #aaa;
        }

        .lt-select {
          color: #eee;
        }

        .lt-loading {
          background: #333;
          border-color: #555;
          color: #aaa;
        }

        .lt-spinner {
          border-color: #555;
          border-top-color: #aaa;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  /**
   * Detect language of text
   */
  async function detectLanguage(text) {
    const response = await fetch(`${config.apiUrl}/detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q: text })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data[0]?.language || 'en';
  }

  /**
   * Get supported languages from API
   */
  async function getLanguages() {
    const response = await fetch(`${config.apiUrl}/languages`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  }

  // Public API
  return {
    init,
    translate,
    translatePage,
    restoreOriginal,
    detectLanguage,
    getLanguages,
    getConfig: () => ({ ...config }),
    clearCache: () => translationCache.clear()
  };

})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LibreTranslate;
}
