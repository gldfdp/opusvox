export interface ConversationTurn {
  id: string
  timestamp: number
  visitorInput: string
  userResponse: string
  isCustomResponse: boolean
}

export interface ResponseSuggestion {
  id: string
  text: string
  intent: string
}

export type RecordingState = 'idle' | 'recording' | 'processing' | 'speaking'
