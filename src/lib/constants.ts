import type { UserSettings } from '@/lib/types'

export const DEFAULT_USER_SETTINGS: UserSettings = {
  firstName: '',
  lastName: '',
  age: null,
  preferredCommunicationStyle: '',
  medicalConditions: '',
  allergies: '',
  specialNeeds: '',
  mistralApiKey: '',
  mistralConnected: false,
  keyboardShortcuts: ['q', 's', 'd', 'f'],
  mistralContextTurns: 20,
  recordingShortcut: ' ',
  createdAt: 0,
  updatedAt: 0,
}
