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

export interface VoiceProfile {
  id: string
  name: string
  language: 'en' | 'fr'
  audioDataUrl: string
  createdAt: number
  duration: number
}

export type VoiceRecordingState = 'idle' | 'recording' | 'processing' | 'success' | 'error'
