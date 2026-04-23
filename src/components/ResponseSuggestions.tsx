import { ResponseSuggestion } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PencilSimple, ArrowsClockwise } from '@phosphor-icons/react'
import { useLanguage } from '@/hooks/use-language'
import { useEffect } from 'react'

interface ResponseSuggestionsProps {
  suggestions: ResponseSuggestion[]
  onSelectResponse: (response: string) => void
  onCustomResponse: () => void
  onLoadMore?: () => void
  loadingMore?: boolean
  disabled?: boolean
  keyboardShortcuts?: [string, string, string, string]
}

export function ResponseSuggestions({ 
  suggestions, 
  onSelectResponse, 
  onCustomResponse,
  onLoadMore,
  loadingMore = false,
  disabled = false,
  keyboardShortcuts = ['q', 's', 'd', 'f']
}: ResponseSuggestionsProps) {
  const { t, language } = useLanguage()
  
  useEffect(() => {
    if (disabled || suggestions.length === 0) return

    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

      const key = e.key.toLowerCase()
      const index = keyboardShortcuts.indexOf(key)
      
      if (index !== -1 && index < suggestions.length) {
        e.preventDefault()
        onSelectResponse(suggestions[index].text)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [suggestions, disabled, keyboardShortcuts, onSelectResponse])
  
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">{t.responses.title}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {suggestions.map((suggestion, index) => (
          <Card
            key={suggestion.id}
            className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-accent active:scale-98 overflow-hidden relative"
            onClick={() => !disabled && onSelectResponse(suggestion.text)}
          >
            <button
              disabled={disabled}
              className="w-full p-5 text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {index < keyboardShortcuts.length && (
                <div className="absolute top-3 right-3 w-7 h-7 rounded-md bg-accent/10 border border-accent/30 flex items-center justify-center">
                  <span className="text-xs font-semibold text-accent uppercase">
                    {keyboardShortcuts[index]}
                  </span>
                </div>
              )}
              <p className="conversation-text text-base leading-relaxed text-foreground group-hover:text-accent transition-colors pr-10">
                {suggestion.text}
              </p>
            </button>
          </Card>
        ))}
      </div>

      {onLoadMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 text-muted-foreground"
          onClick={onLoadMore}
          disabled={disabled || loadingMore}
        >
          <ArrowsClockwise size={16} className={`mr-2 ${loadingMore ? 'animate-spin' : ''}`} />
          {loadingMore
            ? (language === 'fr' ? 'Chargement…' : 'Loading…')
            : (language === 'fr' ? 'Voir d\'autres suggestions' : 'Load more suggestions')}
        </Button>
      )}

      <Button
        variant="outline"
        size="lg"
        className="w-full mt-2"
        onClick={onCustomResponse}
        disabled={disabled}
      >
        <PencilSimple size={20} className="mr-2" />
        {t.responses.customButton}
      </Button>
    </div>
  )
}
