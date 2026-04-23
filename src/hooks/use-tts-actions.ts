import { useState } from 'react'
import { toast } from 'sonner'
import { useLanguage } from '@/hooks/use-language'
import { speak } from '@/lib/tts'
import { VoiceProfile, ConversationTurn, RecordingState } from '@/lib/types'

export interface TTSSpeakOptions
{
  targetLanguage: string
  voiceProfile: VoiceProfile | null
  apiKey: string
}

interface UseTTSActionsOptions
{
  setRecordingState: (state: RecordingState) => void
}

export function useTTSActions({ setRecordingState }: UseTTSActionsOptions)
{
  const { t, language } = useLanguage()
  const [lastSpokenResponse, setLastSpokenResponse] = useState<{ text: string; language: string } | null>(null)

  const doSpeak = async (text: string, opts: TTSSpeakOptions) =>
  {
    await speak({
      text,
      language: opts.targetLanguage,
      rate: 0.9,
      pitch: 1,
      volume: 1,
      voiceProfile: opts.voiceProfile,
      apiKey: opts.apiKey,
    })
  }

  const translateIfNeeded = async (text: string, targetLanguage: string, apiKey: string): Promise<string> =>
  {
    if (targetLanguage === language || !apiKey)
    {
      return text
    }
    const { translateText } = await import('@/lib/mistral')
    return translateText(text, targetLanguage, apiKey)
  }

  /** Speak a suggested or custom response. Returns true on success. */
  const speakResponse = async (responseText: string, opts: TTSSpeakOptions): Promise<boolean> =>
  {
    setRecordingState('speaking')
    toast.success(t.recording.toastSpeaking)
    try
    {
      let textToSpeak = responseText
      if (opts.targetLanguage !== language && opts.apiKey)
      {
        toast.info(t.appMisc.translatingResponse)
        textToSpeak = await translateIfNeeded(responseText, opts.targetLanguage, opts.apiKey)
      }
      setLastSpokenResponse({ text: textToSpeak, language: opts.targetLanguage })
      await doSpeak(textToSpeak, opts)
      setRecordingState('idle')
      return true
    }
    catch (error)
    {
      setRecordingState('idle')
      toast.error(t.recording.toastError)
      console.error('TTS error:', error)
      return false
    }
  }

  /** Speak a user-initiated text (typed message). Returns true on success. */
  const speakUserInitiatedText = async (text: string, opts: TTSSpeakOptions): Promise<boolean> =>
  {
    setRecordingState('speaking')
    toast.success(t.recording.toastSpeaking)
    try
    {
      let textToSpeak = text
      if (opts.targetLanguage !== language && opts.apiKey)
      {
        toast.info(t.appMisc.translatingText)
        textToSpeak = await translateIfNeeded(text, opts.targetLanguage, opts.apiKey)
      }
      setLastSpokenResponse({ text: textToSpeak, language: opts.targetLanguage })
      await doSpeak(textToSpeak, opts)
      setRecordingState('idle')
      return true
    }
    catch (error)
    {
      setRecordingState('idle')
      toast.error(t.recording.toastError)
      console.error('TTS error:', error)
      return false
    }
  }

  /** Replay the last spoken response. */
  const replayLastResponse = async (opts: Omit<TTSSpeakOptions, 'targetLanguage'>) =>
  {
    if (!lastSpokenResponse)
    {
      toast.error(t.replay.toastNoResponse)
      return
    }
    setRecordingState('speaking')
    toast.info(t.replay.toastReplaying)
    try
    {
      await doSpeak(lastSpokenResponse.text, { ...opts, targetLanguage: lastSpokenResponse.language })
      setRecordingState('idle')
    }
    catch (error)
    {
      setRecordingState('idle')
      toast.error(t.recording.toastError)
      console.error('TTS replay error:', error)
    }
  }

  /** Replay a turn from conversation history. */
  const replayFromHistory = async (turn: ConversationTurn, opts: Omit<TTSSpeakOptions, 'targetLanguage'>) =>
  {
    const targetLanguage = turn.visitorLanguage || language
    setRecordingState('speaking')
    try
    {
      let textToSpeak = turn.userResponse
      if (targetLanguage !== language && opts.apiKey)
      {
        toast.info(t.appMisc.translating)
        textToSpeak = await translateIfNeeded(turn.userResponse, targetLanguage, opts.apiKey)
      }
      await doSpeak(textToSpeak, { ...opts, targetLanguage })
      setRecordingState('idle')
    }
    catch (error)
    {
      setRecordingState('idle')
      toast.error(t.recording.toastError)
      console.error('History replay error:', error)
    }
  }

  return {
    lastSpokenResponse,
    speakResponse,
    speakUserInitiatedText,
    replayLastResponse,
    replayFromHistory,
  }
}
