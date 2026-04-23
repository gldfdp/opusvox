import { useKV } from '@/hooks/use-kv'
import { useLanguage } from '@/hooks/use-language'
import { ConversationTurn } from '@/lib/types'
import { toast } from 'sonner'

export function useConversation()
{
  const { t } = useLanguage()
  const [history, setHistory] = useKV<ConversationTurn[]>('conversation-history', [])

  const conversationHistory = history || []

  const saveConversationTurn = (
    userResponse: string,
    isCustom: boolean,
    visitorInput: string,
    visitorLanguage: string,
  ) =>
  {
    const newTurn: ConversationTurn = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      visitorInput,
      userResponse,
      isCustomResponse: isCustom,
      visitorLanguage,
    }
    setHistory((current) => [...(current || []), newTurn])
  }

  const saveUserInitiatedConversation = (userText: string) =>
  {
    const newTurn: ConversationTurn = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      visitorInput: '',
      userResponse: userText,
      isCustomResponse: false,
    }
    setHistory((current) => [...(current || []), newTurn])
  }

  const deleteConversation = (id: string) =>
  {
    setHistory((current) => (current || []).filter(turn => turn.id !== id))
    toast.success(t.history.deleteConfirm)
  }

  const clearHistory = () =>
  {
    setHistory([])
    toast.success(t.appMisc.historyCleared)
  }

  return {
    conversationHistory,
    saveConversationTurn,
    saveUserInitiatedConversation,
    deleteConversation,
    clearHistory,
  }
}
