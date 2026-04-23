import { useState } from 'react'
import { toast } from 'sonner'
import { useLanguage } from '@/hooks/use-language'
import { ResponseSuggestion, ConversationTurn, UserSettings } from '@/lib/types'

export interface SuggestionsContext
{
  transcribedText: string
  conversationHistory: ConversationTurn[]
  apiKey: string
  userSettings: UserSettings
  contextTurns: number
}

export function useSuggestions()
{
  const { t, language } = useLanguage()
  const [suggestions, setSuggestions] = useState<ResponseSuggestion[]>([])
  const [loadingMoreSuggestions, setLoadingMoreSuggestions] = useState(false)

  const generateResponses = async (ctx: SuggestionsContext) =>
  {
    try
    {
      const { generateResponseSuggestions } = await import('@/lib/mistral')
      const responses = await generateResponseSuggestions({
        transcribedText: ctx.transcribedText,
        language,
        conversationHistory: ctx.conversationHistory,
        apiKey: ctx.apiKey,
        userSettings: ctx.userSettings,
        contextTurns: ctx.contextTurns,
      })
      setSuggestions(responses)
    }
    catch (error)
    {
      console.error('Error generating responses:', error)
      toast.error(t.appMisc.errorGeneratingResponses)
    }
  }

  const loadMoreSuggestions = async (ctx: SuggestionsContext) =>
  {
    if (!ctx.transcribedText || loadingMoreSuggestions)
    {
      return
    }
    setLoadingMoreSuggestions(true)
    try
    {
      const { generateResponseSuggestions } = await import('@/lib/mistral')
      const more = await generateResponseSuggestions({
        transcribedText: ctx.transcribedText,
        language,
        conversationHistory: ctx.conversationHistory,
        apiKey: ctx.apiKey,
        userSettings: ctx.userSettings,
        contextTurns: ctx.contextTurns,
        excludeTexts: suggestions.map(s => s.text),
      })
      setSuggestions(prev => [
        ...prev,
        ...more.map(s => ({ ...s, id: `more-${Date.now()}-${s.id}` })),
      ])
    }
    catch (error)
    {
      console.error('Error loading more suggestions:', error)
      toast.error(t.appMisc.errorLoadingSuggestions)
    }
    finally
    {
      setLoadingMoreSuggestions(false)
    }
  }

  const clearSuggestions = () => setSuggestions([])

  return {
    suggestions,
    loadingMoreSuggestions,
    generateResponses,
    loadMoreSuggestions,
    clearSuggestions,
  }
}
