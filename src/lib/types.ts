export interface ConversationTurn {
  id: string
  timestamp: number
  visitorInput: string
  userResponse: string
  isCustomResponse: boolean
  visitorLanguage?: string
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
  mistralVoiceId?: string
  mistralSyncError?: 'plan' | 'error'
}

export type VoiceRecordingState = 'idle' | 'recording' | 'processing' | 'success' | 'error'

export interface UserSettings {
  firstName: string
  lastName: string
  age: number | null
  preferredCommunicationStyle: 'formal' | 'casual' | 'professional' | 'friendly' | ''
  medicalConditions: string
  allergies: string
  specialNeeds: string
  mistralApiKey: string
  mistralConnected: boolean
  mistralContextTurns: number
  keyboardShortcuts: [string, string, string, string]
  createdAt: number
  updatedAt: number
}
