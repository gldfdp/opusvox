import { ResponseSuggestion } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PencilSimple } from '@phosphor-icons/react'

interface ResponseSuggestionsProps {
  suggestions: ResponseSuggestion[]
  onSelectResponse: (response: string) => void
  onCustomResponse: () => void
  disabled?: boolean
}

export function ResponseSuggestions({ 
  suggestions, 
  onSelectResponse, 
  onCustomResponse,
  disabled = false 
}: ResponseSuggestionsProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">Select your response</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {suggestions.map((suggestion) => (
          <Card
            key={suggestion.id}
            className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-accent active:scale-98 overflow-hidden"
            onClick={() => !disabled && onSelectResponse(suggestion.text)}
          >
            <button
              disabled={disabled}
              className="w-full p-5 text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <p className="conversation-text text-base leading-relaxed text-foreground group-hover:text-accent transition-colors">
                {suggestion.text}
              </p>
            </button>
          </Card>
        ))}
      </div>

      <Button
        variant="outline"
        size="lg"
        className="w-full mt-4"
        onClick={onCustomResponse}
        disabled={disabled}
      >
        <PencilSimple size={20} className="mr-2" />
        Write custom response
      </Button>
    </div>
  )
}
