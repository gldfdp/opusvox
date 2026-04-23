import { useState } from 'react'
import { Globe, MagnifyingGlass } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useLanguage } from '@/hooks/use-language'
import { MISTRAL_SUPPORTED_LANGUAGES } from '@/lib/languages'

interface VisitorLanguageSelectorProps {
  selectedLanguage: string | null
  onSelectLanguage: (language: string) => void
}

export function VisitorLanguageSelector({ selectedLanguage, onSelectLanguage }: VisitorLanguageSelectorProps) {
  const { t, language } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  
  const filteredLanguages = MISTRAL_SUPPORTED_LANGUAGES.filter(lang => {
    const searchLower = searchTerm.toLowerCase()
    return (
      lang.nameEn.toLowerCase().includes(searchLower) ||
      lang.nameFr.toLowerCase().includes(searchLower) ||
      lang.nameNative.toLowerCase().includes(searchLower) ||
      lang.code.toLowerCase().includes(searchLower)
    )
  })
  
  return (
    <Card className="p-4 sm:p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-foreground">
          <Globe size={24} weight="duotone" />
          <h3 className="text-lg font-semibold">
            {t.visitorLanguage?.title || 'Visitor language'}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {t.visitorLanguage?.description || 'Select the language your visitor will speak in'}
        </p>
        
        <div className="relative">
          <MagnifyingGlass 
            size={18} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder={language === 'fr' ? 'Rechercher une langue...' : 'Search for a language...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="h-[250px] sm:h-[300px] pr-4">
          <div className="grid grid-cols-2 gap-2">
            {filteredLanguages.map((lang) => (
              <Button
                key={lang.code}
                variant={selectedLanguage === lang.code ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSelectLanguage(lang.code)}
                className="w-full justify-start text-left h-auto py-2"
              >
                <span className="mr-2">{lang.flag}</span>
                <span className="truncate">
                  {language === 'fr' ? lang.nameFr : lang.nameEn}
                </span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </Card>
  )
}
