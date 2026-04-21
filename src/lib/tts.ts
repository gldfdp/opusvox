import { Language } from './i18n'
import { VoiceProfile } from './types'

export interface TTSOptions {
  language: Language
  text: string
  rate?: number
  pitch?: number
  volume?: number
  voiceProfile?: VoiceProfile | null
}

let currentVoice: SpeechSynthesisVoice | null = null
let currentVoiceProfile: VoiceProfile | null = null
let isUsingClonedVoice = false

export function getPreferredVoice(language: Language): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices()
  
  const languageMap: Record<Language, string[]> = {
    en: ['en-US', 'en-GB', 'en-AU', 'en'],
    fr: ['fr-FR', 'fr-CA', 'fr-BE', 'fr']
  }
  
  const preferredLangs = languageMap[language]
  
  for (const lang of preferredLangs) {
    const voice = voices.find(v => v.lang.startsWith(lang))
    if (voice) return voice
  }
  
  return voices.find(v => v.lang.startsWith(language)) || voices[0] || null
}

export function getCurrentVoice(): SpeechSynthesisVoice | null {
  return currentVoice
}

export function getCurrentVoiceProfile(): VoiceProfile | null {
  return currentVoiceProfile
}

export function isClonedVoice(): boolean {
  return isUsingClonedVoice
}

export async function speak(options: TTSOptions): Promise<void> {
  if (options.voiceProfile && options.voiceProfile.language === options.language) {
    return speakWithClonedVoice(options)
  } else {
    return speakWithSystemVoice(options)
  }
}

async function speakWithClonedVoice(options: TTSOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!options.voiceProfile) {
      speakWithSystemVoice(options).then(resolve).catch(reject)
      return
    }

    const audio = new Audio()
    
    audio.onended = () => {
      currentVoiceProfile = null
      isUsingClonedVoice = false
      resolve()
    }
    
    audio.onerror = (event) => {
      currentVoiceProfile = null
      isUsingClonedVoice = false
      console.warn('Cloned voice playback failed, falling back to system voice')
      speakWithSystemVoice(options).then(resolve).catch(reject)
    }
    
    currentVoiceProfile = options.voiceProfile
    isUsingClonedVoice = true
    
    audio.src = options.voiceProfile.audioDataUrl
    audio.playbackRate = options.rate ?? 0.9
    audio.volume = options.volume ?? 1
    audio.play().catch((error) => {
      console.warn('Failed to play cloned voice:', error)
      speakWithSystemVoice(options).then(resolve).catch(reject)
    })
  })
}

function speakWithSystemVoice(options: TTSOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'))
      return
    }
    
    const utterance = new SpeechSynthesisUtterance(options.text)
    
    const voice = getPreferredVoice(options.language)
    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang
      currentVoice = voice
    } else {
      utterance.lang = options.language === 'fr' ? 'fr-FR' : 'en-US'
      currentVoice = null
    }
    
    utterance.rate = options.rate ?? 0.9
    utterance.pitch = options.pitch ?? 1
    utterance.volume = options.volume ?? 1
    
    isUsingClonedVoice = false
    currentVoiceProfile = null
    
    utterance.onend = () => {
      currentVoice = null
      resolve()
    }
    utterance.onerror = (event) => {
      currentVoice = null
      reject(event)
    }
    
    speechSynthesis.speak(utterance)
  })
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel()
  }
  currentVoice = null
  currentVoiceProfile = null
  isUsingClonedVoice = false
}

export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices()
    if (voices.length > 0) {
      resolve(voices)
      return
    }
    
    speechSynthesis.onvoiceschanged = () => {
      resolve(speechSynthesis.getVoices())
    }
  })
}
