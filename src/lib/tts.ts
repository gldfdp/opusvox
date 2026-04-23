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

async function convertAudioToWav(audioDataUrl: string): Promise<string> {
  const response = await fetch(audioDataUrl)
  const arrayBuffer = await response.arrayBuffer()

  const audioContext = new AudioContext()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
  await audioContext.close()

  const numChannels = 1
  const sampleRate = audioBuffer.sampleRate
  const samples = audioBuffer.getChannelData(0)
  const pcm = new Int16Array(samples.length)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }

  const dataLength = pcm.length * 2
  const buffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(buffer)
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numChannels * 2, true)
  view.setUint16(32, numChannels * 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, dataLength, true)
  const pcmBytes = new Uint8Array(buffer, 44)
  pcmBytes.set(new Uint8Array(pcm.buffer))

  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

async function speakWithMistralTTS(options: TTSOptions): Promise<void> {
  if (!options.apiKey) {
    return speakWithSystemVoice(options)
  }

  try {
    isUsingMistralTTS = true
    currentVoiceProfile = options.voiceProfile || null
    isUsingClonedVoice = !!options.voiceProfile

    if (options.voiceProfile?.audioDataUrl) {
      try {
        let clonedRequestBody: Record<string, unknown>

        if (options.voiceProfile.mistralVoiceId) {
          clonedRequestBody = {
            model: 'voxtral-mini-tts-2603',
            input: options.text,
            voice: options.voiceProfile.mistralVoiceId,
            response_format: 'wav',
          }
          console.log('Using saved Mistral voice id:', options.voiceProfile.mistralVoiceId)
        } else {
          const audioDataUrl = options.voiceProfile.audioDataUrl
          let base64Audio: string
          try {
            base64Audio = await convertAudioToWav(audioDataUrl)
          } catch {
            base64Audio = audioDataUrl.includes(',') ? audioDataUrl.split(',')[1] : audioDataUrl
          }
          clonedRequestBody = {
            model: 'voxtral-mini-tts-2603',
            input: options.text,
            ref_audio: base64Audio,
            response_format: 'wav',
          }
          console.log('Using ref_audio (no Mistral voice id saved)')
        }

        const clonedResponse = await fetch('https://api.mistral.ai/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${options.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(clonedRequestBody)
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

        const contentType = clonedResponse.headers.get('content-type') || ''
        let clonedAudioBlob: Blob

        if (contentType.includes('application/json')) {
          const jsonData = await clonedResponse.json()
          console.log('Mistral TTS (cloned) JSON response keys:', Object.keys(jsonData))
          const audioBase64: string = jsonData.audio ?? jsonData.data ?? jsonData.audio_data ?? ''
          if (!audioBase64) {
            console.error('Mistral TTS (cloned) JSON response (no audio field):', JSON.stringify(jsonData).slice(0, 500))
            throw new Error('Mistral TTS: no audio field in JSON response')
          }
          const audioBytes = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))
          clonedAudioBlob = new Blob([audioBytes], { type: 'audio/wav' })
        } else {
          clonedAudioBlob = await clonedResponse.blob()
        }

        console.log('Successfully used cloned voice profile:', options.voiceProfile.name)
        return playAudio(clonedAudioBlob, options.volume ?? 1)
      } catch (error) {
        console.warn('Failed to use cloned voice, falling back to default voice:', error)
      }
    }

    const requestBody = {
      model: 'voxtral-mini-tts-2603',
      input: options.text,
      response_format: 'wav',
      voice: getDefaultMistralVoice(),
    }

    console.log('Using Mistral TTS with language:', options.language, 'voice:', requestBody.voice)

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

    const defaultContentType = response.headers.get('content-type') || ''
    let audioBlob: Blob

    if (defaultContentType.includes('application/json')) {
      const jsonData = await response.json()
      console.log('Mistral TTS JSON response keys:', Object.keys(jsonData))
      const audioBase64: string = jsonData.audio ?? jsonData.data ?? jsonData.audio_data ?? ''
      if (!audioBase64) {
        console.error('Mistral TTS JSON response (no audio field):', JSON.stringify(jsonData).slice(0, 500))
        throw new Error('Mistral TTS: no audio field in JSON response')
      }
      const audioBytes = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))
      audioBlob = new Blob([audioBytes], { type: 'audio/wav' })
    } else {
      audioBlob = await response.blob()
    }

    console.log('Mistral TTS response blob:', audioBlob.type, audioBlob.size)
    return playAudio(audioBlob, options.volume ?? 1)
  } catch (error) {
    isUsingMistralTTS = false
    currentVoiceProfile = null
    isUsingClonedVoice = false
    console.error('Mistral TTS error, falling back to system voice:', error)
    return speakWithSystemVoice(options)
  }
}

function getDefaultMistralVoice(): string {
  // Mistral TTS voices — catalog: en_paul_neutral (US), gb_oliver_neutral (UK male), gb_jane_neutral (UK female)
  // The model is multilingual: an English voice can synthesize any supported language.
  return 'en_paul_neutral'
}


async function playAudio(audioBlob: Blob, volume: number): Promise<void> {
  const blob = audioBlob.type && audioBlob.type !== 'application/octet-stream'
    ? audioBlob
    : new Blob([audioBlob], { type: 'audio/wav' })
  const audioUrl = URL.createObjectURL(blob)

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
    
    audio.onerror = () => {
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
