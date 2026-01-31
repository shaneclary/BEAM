'use client'

import { useState, useRef, useEffect } from 'react'
import { Globe, ChevronDown, Check } from 'lucide-react'
import { clsx } from 'clsx'

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
]

export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentLang, setCurrentLang] = useState('en')
  const [isTranslating, setIsTranslating] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load saved language preference
  useEffect(() => {
    const saved = localStorage.getItem('beam-language')
    if (saved) {
      setCurrentLang(saved)
    }
  }, [])

  const handleLanguageChange = async (langCode: string) => {
    if (langCode === currentLang) {
      setIsOpen(false)
      return
    }

    setIsTranslating(true)
    setIsOpen(false)

    try {
      if (langCode === 'en') {
        // Restore original content
        window.location.reload()
      } else {
        // Translate page using LibreTranslate API
        await translatePage(langCode)
      }

      setCurrentLang(langCode)
      localStorage.setItem('beam-language', langCode)
    } catch (error) {
      console.error('Translation failed:', error)
    } finally {
      setIsTranslating(false)
    }
  }

  const translatePage = async (targetLang: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_LIBRETRANSLATE_URL || 'https://libretranslate.com'

    // Get all translatable elements
    const selectors = 'h1, h2, h3, h4, h5, h6, p, a, button, label, span, li'
    const elements = document.querySelectorAll(selectors)

    const textsToTranslate: { element: Element; text: string }[] = []

    elements.forEach((el) => {
      // Skip elements that shouldn't be translated
      if (
        el.closest('[data-no-translate]') ||
        el.closest('.no-translate') ||
        el.closest('script') ||
        el.closest('style') ||
        el.closest('code') ||
        !el.textContent?.trim()
      ) {
        return
      }

      // Only translate leaf text nodes
      const hasOnlyText = el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE
      if (hasOnlyText && el.textContent && el.textContent.trim().length > 1) {
        textsToTranslate.push({ element: el, text: el.textContent.trim() })
      }
    })

    // Batch translate
    const BATCH_SIZE = 10
    for (let i = 0; i < textsToTranslate.length; i += BATCH_SIZE) {
      const batch = textsToTranslate.slice(i, i + BATCH_SIZE)

      const translations = await Promise.all(
        batch.map(async ({ text }) => {
          try {
            const response = await fetch(`${apiUrl}/translate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                q: text,
                source: 'en',
                target: targetLang,
                format: 'text',
              }),
            })

            if (!response.ok) throw new Error('Translation failed')
            const data = await response.json()
            return data.translatedText
          } catch {
            return text // Return original on error
          }
        })
      )

      // Apply translations
      batch.forEach(({ element }, index) => {
        if (translations[index]) {
          element.textContent = translations[index]
        }
      })

      // Small delay between batches
      if (i + BATCH_SIZE < textsToTranslate.length) {
        await new Promise((r) => setTimeout(r, 100))
      }
    }

    // Update document language
    document.documentElement.lang = targetLang
  }

  const currentLanguage = languages.find((l) => l.code === currentLang) || languages[0]

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isTranslating}
        className={clsx(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
          'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
          isTranslating && 'opacity-50 cursor-wait'
        )}
        aria-label="Select language"
      >
        {isTranslating ? (
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Globe className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">{currentLanguage.flag}</span>
        <span className="hidden md:inline">{currentLanguage.name}</span>
        <ChevronDown
          className={clsx('w-4 h-4 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-scale-in">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                lang.code === currentLang
                  ? 'bg-beam-50 text-beam-700'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <span className="text-base">{lang.flag}</span>
              <span className="flex-1 text-left">{lang.name}</span>
              {lang.code === currentLang && (
                <Check className="w-4 h-4 text-beam-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
