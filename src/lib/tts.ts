import { VoiceProfile } from './types'

export interface TTSOptions {
  language: string
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

export function getPreferredVoice(language: string): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices()
  
  const languageMap: Record<string, string[]> = {
    en: ['en-US', 'en-GB', 'en-AU', 'en'],
    fr: ['fr-FR', 'fr-CA', 'fr-BE', 'fr'],
    es: ['es-ES', 'es-MX', 'es'],
    de: ['de-DE', 'de-AT', 'de'],
    it: ['it-IT', 'it'],
    pt: ['pt-PT', 'pt-BR', 'pt'],
    nl: ['nl-NL', 'nl-BE', 'nl'],
    pl: ['pl-PL', 'pl'],
    ru: ['ru-RU', 'ru'],
    ja: ['ja-JP', 'ja'],
    zh: ['zh-CN', 'zh-TW', 'zh'],
    ko: ['ko-KR', 'ko'],
    ar: ['ar-SA', 'ar'],
    hi: ['hi-IN', 'hi'],
    tr: ['tr-TR', 'tr'],
    sv: ['sv-SE', 'sv'],
    da: ['da-DK', 'da'],
    no: ['no-NO', 'nb-NO', 'no', 'nb'],
    fi: ['fi-FI', 'fi'],
    cs: ['cs-CZ', 'cs'],
    sk: ['sk-SK', 'sk'],
    hu: ['hu-HU', 'hu'],
    ro: ['ro-RO', 'ro'],
    bg: ['bg-BG', 'bg'],
    el: ['el-GR', 'el'],
    he: ['he-IL', 'he'],
    uk: ['uk-UA', 'uk'],
    vi: ['vi-VN', 'vi'],
    th: ['th-TH', 'th'],
    id: ['id-ID', 'id'],
    ms: ['ms-MY', 'ms'],
    ca: ['ca-ES', 'ca'],
    hr: ['hr-HR', 'hr'],
    sr: ['sr-RS', 'sr'],
    lt: ['lt-LT', 'lt'],
    lv: ['lv-LV', 'lv'],
    et: ['et-EE', 'et'],
    sl: ['sl-SI', 'sl']
  }
  
  const preferredLangs = languageMap[language] || [language]
  
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

    const speed = Math.max(0.5, Math.min(2.0, options.rate ?? 1.0))

    if (options.voiceProfile?.audioDataUrl) {
      try {
        const audioDataUrl = options.voiceProfile.audioDataUrl
        let base64Audio: string
        
        if (audioDataUrl.includes(',')) {
          base64Audio = audioDataUrl.split(',')[1]
        } else {
          base64Audio = audioDataUrl
        }

        const requestBody: Record<string, unknown> = {
          model: 'voxtral-mini-tts-2603',
          input: options.text,
          ref_audio: base64Audio
        }
        
        if (speed !== 1.0) {
          requestBody.speed = speed
        }
        
        console.log('Using cloned voice with ref_audio')

        const clonedResponse = await fetch('https://api.mistral.ai/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${options.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })

        if (!clonedResponse.ok) {
          const errorText = await clonedResponse.text().catch(() => '')
          console.error('Mistral TTS (cloned) API error:', {
            status: clonedResponse.status,
            statusText: clonedResponse.statusText,
            body: errorText
          })
          throw new Error(`Mistral TTS API error: ${clonedResponse.status}`)
        }

        const clonedAudioBlob = await clonedResponse.blob()
        console.log('Successfully used cloned voice profile:', options.voiceProfile.name)
        return playAudio(clonedAudioBlob, options.volume ?? 1)
      } catch (error) {
        console.warn('Failed to use cloned voice, falling back to default voice:', error)
      }
    }

    const requestBody: Record<string, unknown> = {
      model: 'voxtral-mini-tts-2603',
      input: options.text,
      voice: 'atlas'
    }
    
    if (speed !== 1.0) {
      requestBody.speed = speed
    }

    console.log('Using Mistral TTS with default voice (atlas)')

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
    return playAudio(audioBlob, options.volume ?? 1)
  } catch (error) {
    isUsingMistralTTS = false
    currentVoiceProfile = null
    isUsingClonedVoice = false
    console.error('Mistral TTS error, falling back to system voice:', error)
    return speakWithSystemVoice(options)
  }
}

async function base64ToBlob(base64: string): Promise<Blob> {
  const response = await fetch(`data:audio/webm;base64,${base64}`)
  return response.blob()
}

async function playAudio(audioBlob: Blob, volume: number): Promise<void> {
  const audioUrl = URL.createObjectURL(audioBlob)

  return new Promise((resolve, reject) => {
    const audio = new Audio(audioUrl)
    audio.volume = volume

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
