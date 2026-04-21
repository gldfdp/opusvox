import { Language } from './i18n'

export interface TTSOptions {
  language: Language
  text: string
  rate?: number
  pitch?: number
  volume?: number
}

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

export function speak(options: TTSOptions): Promise<void> {
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
    } else {
      utterance.lang = options.language === 'fr' ? 'fr-FR' : 'en-US'
    }
    
    utterance.rate = options.rate ?? 0.9
    utterance.pitch = options.pitch ?? 1
    utterance.volume = options.volume ?? 1
    
    utterance.onend = () => resolve()
    utterance.onerror = (event) => reject(event)
    
    speechSynthesis.speak(utterance)
  })
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel()
  }
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
