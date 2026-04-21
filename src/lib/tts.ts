import { Language } from './i18n'
import { VoiceProfile } from './types'

export interface TTSOptions {
  language: Language
  text: string
  rate?: number
  pitch?: number
  volume?: number
  voiceProfile?: VoiceProfile | null
  apiKey?: string
}

let currentVoice: SpeechSynthesisVoice | null = null
let currentVoiceProfile: VoiceProfile | null = null
let isUsingClonedVoice = false
let isUsingMistralTTS = false

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

export function isMistralTTS(): boolean {
  return isUsingMistralTTS
}

export function isTTSAvailable(apiKey?: string): boolean {
  return !!apiKey && apiKey.trim().length > 0
}

export async function speak(options: TTSOptions): Promise<void> {
  if (isTTSAvailable(options.apiKey)) {
    return speakWithMistralTTS(options)
  } else if (options.voiceProfile && options.voiceProfile.language === options.language) {
    return speakWithClonedVoice(options)
  } else {
    return speakWithSystemVoice(options)
  }
}

async function speakWithMistralTTS(options: TTSOptions): Promise<void> {
  if (!options.apiKey) {
    return speakWithSystemVoice(options)
  }

  try {
    isUsingMistralTTS = true
    currentVoiceProfile = options.voiceProfile || null
    isUsingClonedVoice = !!options.voiceProfile

    const requestBody: {
      model: string
      input: string
      voice?: string
      response_format?: string
      speed?: number
    } = {
      model: 'mistral-small-latest',
      input: options.text,
      response_format: 'mp3',
      speed: options.rate ?? 1.0
    }

    if (options.voiceProfile && options.voiceProfile.audioDataUrl) {
      const base64Audio = options.voiceProfile.audioDataUrl.split(',')[1]
      if (base64Audio) {
        (requestBody as any).voice_sample = base64Audio
      }
    }

    const response = await fetch('https://api.mistral.ai/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${options.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('Mistral TTS API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`Mistral TTS API error: ${response.status} ${response.statusText}`)
    }

    const audioBlob = await response.blob()
    const audioUrl = URL.createObjectURL(audioBlob)

    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl)
      audio.volume = options.volume ?? 1

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        isUsingMistralTTS = false
        currentVoiceProfile = null
        isUsingClonedVoice = false
        resolve()
      }

      audio.onerror = (event) => {
        URL.revokeObjectURL(audioUrl)
        isUsingMistralTTS = false
        currentVoiceProfile = null
        isUsingClonedVoice = false
        console.error('Audio playback error:', event)
        reject(new Error('Failed to play Mistral TTS audio'))
      }

      audio.play().catch((error) => {
        URL.revokeObjectURL(audioUrl)
        isUsingMistralTTS = false
        currentVoiceProfile = null
        isUsingClonedVoice = false
        reject(error)
      })
    })
  } catch (error) {
    isUsingMistralTTS = false
    currentVoiceProfile = null
    isUsingClonedVoice = false
    console.error('Mistral TTS error, falling back to system voice:', error)
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
  isUsingMistralTTS = false
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
