import { Globe } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Language } from '@/lib/i18n'
import { useLanguage } from '@/hooks/use-language'

interface VisitorLanguageSelectorProps {
  selectedLanguage: Language | null
  onSelectLanguage: (language: Language) => void
}

export function VisitorLanguageSelector({ selectedLanguage, onSelectLanguage }: VisitorLanguageSelectorProps) {
  const { t } = useLanguage()
  
  return (
    <Card className="p-6">
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
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={selectedLanguage === 'en' ? 'default' : 'outline'}
            size="lg"
            onClick={() => onSelectLanguage('en')}
            className="w-full"
          >
            🇬🇧 English
          </Button>
          <Button
            variant={selectedLanguage === 'fr' ? 'default' : 'outline'}
            size="lg"
            onClick={() => onSelectLanguage('fr')}
            className="w-full"
          >
            🇫🇷 Français
          </Button>
        </div>
      </div>
    </Card>
  )
}
