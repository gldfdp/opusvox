import { createContext, useContext, ReactNode } from 'react'
import { useKV } from '@/hooks/use-kv'
import { Language, getTranslations, Translations } from '@/lib/i18n'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useKV<Language>('app-language', 'en')
  
  const currentLanguage = language || 'en'
  const translations = getTranslations(currentLanguage)

  return (
    <LanguageContext.Provider value={{ language: currentLanguage, setLanguage, t: translations }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
