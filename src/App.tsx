import { useState, useRef, useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useKV } from '@/hooks/use-kv'
import { Toaster, toast } from 'sonner'
import { ClockCounterClockwise, SpeakerHigh, Gear, ArrowCounterClockwise, X, Trash, ArrowsClockwise } from '@phosphor-icons/react'
import { RecordingButton } from '@/components/RecordingButton'
import { ResponseSuggestions } from '@/components/ResponseSuggestions'
import { ConversationHistory } from '@/components/ConversationHistory'
import { CustomResponseDialog } from '@/components/CustomResponseDialog'
import { VoiceIndicator } from '@/components/VoiceIndicator'
import { SettingsPage } from '@/components/SettingsPage'
import { TextInitiator } from '@/components/TextInitiator'
import { VisitorLanguageSelector } from '@/components/VisitorLanguageSelector'
import { OnboardingPage } from '@/components/OnboardingPage'
import { MentionsLegales } from '@/components/MentionsLegales'
import { LanguageProvider, useLanguage } from '@/hooks/use-language'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ConversationTurn, ResponseSuggestion, RecordingState, VoiceProfile, UserSettings } from '@/lib/types'
import { speak, loadVoices, getCurrentVoice, getCurrentVoiceProfile, isClonedVoice, isMistralTTS, isTTSAvailable } from '@/lib/tts'
import { transcribeAudio, isTranscriptionAvailable, getSimulatedTranscription } from '@/lib/stt'
import { getSupportedAudioMimeType, isMediaRecorderSupported } from '@/lib/media'
import { initMobileLifecycle, cleanupMobileLifecycle } from '@/mobile/app-lifecycle'
import { getLanguageDisplayName } from '@/lib/languages'
import { AnimatePresence } from 'framer-motion'

function AppContent() {
  const { t, language } = useLanguage()
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()
  const [history, setHistory] = useKV<ConversationTurn[]>('conversation-history', [])
  const [userSettings] = useKV<UserSettings>('user-settings', {
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
    createdAt: Date.now(),
    updatedAt: Date.now()
  })
  const [profiles] = useKV<VoiceProfile[]>('voice-profiles', [])
  const [selectedProfileId] = useKV<string | null>('selected-voice-profile', null)
  const [visitorLanguage, setVisitorLanguage] = useKV<string | null>('visitor-language', null)
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [transcribedText, setTranscribedText] = useState('')
  const [translatedVisitorText, setTranslatedVisitorText] = useState('')
  const [suggestions, setSuggestions] = useState<ResponseSuggestion[]>([])
  const [customDialogOpen, setCustomDialogOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mentionsOpen, setMentionsOpen] = useState(false)
  const [loadingMoreSuggestions, setLoadingMoreSuggestions] = useState(false)
  const [lastSpokenResponse, setLastSpokenResponse] = useState<{text: string, language: string} | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioCtxRef = useRef<AudioContext | null>(null)
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const analyserIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasSpeechRef = useRef(false)
  const trailingSilenceMsRef = useRef(0)
  
  const conversationHistory = history || []
  const currentUserSettings = userSettings || {
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
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  
  const currentProfiles = profiles || []
  const currentVoiceProfile = selectedProfileId 
    ? currentProfiles.find(p => p.id === selectedProfileId) || null
    : null
  const currentVisitorLanguage = visitorLanguage || null

  useEffect(() => {
    loadVoices()

    initMobileLifecycle({
      onBack: () => {
        if (settingsOpen) setSettingsOpen(false)
      },
      onBackground: () => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop()
          setRecordingState('processing')
        }
        window.speechSynthesis?.cancel()
      },
    })

    return () => cleanupMobileLifecycle()
  }, [settingsOpen])

  const recordingStateRef = useRef(recordingState)
  recordingStateRef.current = recordingState
  // Always-current refs to avoid stale closure issues in keyboard handler and silence timer
  const handleStartRecordingRef = useRef<() => Promise<void>>(() => Promise.resolve())
  const handleStopRecordingRef = useRef<() => void>(() => {})

  useEffect(() => {
    const shortcut = currentUserSettings.recordingShortcut ?? ' '
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (settingsOpen || mentionsOpen) return
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
      if (e.key === shortcut) {
        e.preventDefault()
        if (recordingStateRef.current === 'idle') handleStartRecordingRef.current()
        else if (recordingStateRef.current === 'recording') handleStopRecordingRef.current()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [settingsOpen, mentionsOpen, currentUserSettings.recordingShortcut])

  if (settingsOpen) {
    return <SettingsPage onClose={() => setSettingsOpen(false)} />
  }

  if (mentionsOpen) {
    return <MentionsLegales onClose={() => setMentionsOpen(false)} />
  }

  if (!isMediaRecorderSupported()) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 text-center text-muted-foreground">
        {language === 'fr'
          ? "L'enregistrement audio n'est pas disponible sur cet appareil."
          : 'Audio recording is not available on this device.'}
      </div>
    )
  }

  const audioBufferToWavBlob = (buffer: AudioBuffer): Blob => {
    const numChannels = buffer.numberOfChannels
    const sampleRate = buffer.sampleRate
    const numSamples = buffer.length
    const dataLength = numSamples * numChannels * 2
    const wav = new ArrayBuffer(44 + dataLength)
    const view = new DataView(wav)
    const str = (off: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)) }
    str(0, 'RIFF'); view.setUint32(4, 36 + dataLength, true); str(8, 'WAVE'); str(12, 'fmt ')
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * numChannels * 2, true)
    view.setUint16(32, numChannels * 2, true); view.setUint16(34, 16, true); str(36, 'data')
    view.setUint32(40, dataLength, true)
    let off = 44
    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const s = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]))
        view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true); off += 2
      }
    }
    return new Blob([wav], { type: 'audio/wav' })
  }

  const trimTrailingSeconds = async (blob: Blob, trimSeconds: number): Promise<Blob> => {
    if (trimSeconds <= 0) return blob
    try {
      const arrayBuffer = await blob.arrayBuffer()
      const audioCtx = new AudioContext()
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
      await audioCtx.close()
      const newDuration = audioBuffer.duration - trimSeconds
      if (newDuration < 0.5) return blob
      const newSamples = Math.floor(newDuration * audioBuffer.sampleRate)
      const offlineCtx = new OfflineAudioContext(audioBuffer.numberOfChannels, newSamples, audioBuffer.sampleRate)
      const trimmed = offlineCtx.createBuffer(audioBuffer.numberOfChannels, newSamples, audioBuffer.sampleRate)
      for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
        trimmed.getChannelData(ch).set(audioBuffer.getChannelData(ch).subarray(0, newSamples))
      }
      return audioBufferToWavBlob(trimmed)
    } catch {
      return blob
    }
  }

  const stopSilenceDetection = () => {
    if (analyserIntervalRef.current) { clearInterval(analyserIntervalRef.current); analyserIntervalRef.current = null }
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
    if (audioSourceRef.current) { audioSourceRef.current.disconnect(); audioSourceRef.current = null }
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null }
  }

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const { mimeType } = getSupportedAudioMimeType()
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      hasSpeechRef.current = false
      trailingSilenceMsRef.current = 0

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop())
        stopSilenceDetection()
        await processRecording()
      }

      // Silence detection via AnalyserNode
      const audioCtx = new AudioContext()
      await audioCtx.resume()
      audioCtxRef.current = audioCtx
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 2048
      const sourceNode = audioCtx.createMediaStreamSource(stream)
      audioSourceRef.current = sourceNode  // keep ref to prevent GC
      sourceNode.connect(analyser)
      const dataArray = new Float32Array(analyser.fftSize)
      const SILENCE_DELAY_MS = 3000

      let silenceStart: number | null = null

      analyserIntervalRef.current = setInterval(() => {
        analyser.getFloatTimeDomainData(dataArray)
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i] * dataArray[i]
        const rms = Math.sqrt(sum / dataArray.length)

        if (rms >= 0.01) {
          // Sound above noise floor — reset silence timer
          hasSpeechRef.current = true
          silenceStart = null
          if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
        } else if (hasSpeechRef.current && silenceStart === null) {
          // Silence after speech — start countdown
          silenceStart = Date.now()
          silenceTimerRef.current = setTimeout(() => {
            trailingSilenceMsRef.current = Date.now() - (silenceStart ?? Date.now())
            handleStopRecordingRef.current()
          }, SILENCE_DELAY_MS)
        }
      }, 100)

      mediaRecorder.start()
      setRecordingState('recording')
      toast.info(t.recording.toastStarted)
    } catch (error) {
      toast.error(t.recording.toastPermissionDenied)
      console.error('Error accessing microphone:', error)
    }
  }

  const handleStopRecording = () => {
    stopSilenceDetection()
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setRecordingState('processing')
    }
  }

  // Keep refs in sync with latest handler versions (used by keyboard shortcut and silence timer)
  handleStartRecordingRef.current = handleStartRecording
  handleStopRecordingRef.current = handleStopRecording


  const processRecording = async () => {
    setRecordingState('processing')
    
    if (audioChunksRef.current.length === 0) {
      toast.error(t.recording.toastError)
      setRecordingState('idle')
      return
    }

    const { mimeType, ext } = getSupportedAudioMimeType()
    const blobType = mimeType || 'audio/webm'
    let audioBlob = new Blob(audioChunksRef.current, { type: blobType })

    const trailingSec = trailingSilenceMsRef.current / 1000
    if (trailingSec > 0) {
      audioBlob = await trimTrailingSeconds(audioBlob, trailingSec)
      trailingSilenceMsRef.current = 0
    }
    
    let transcribed = ''
    const transcriptionLanguage = currentVisitorLanguage || language
    
    if (isTranscriptionAvailable(currentUserSettings.mistralApiKey)) {
      try {
        toast.info(transcriptionLanguage === 'fr' 
          ? 'Transcription avec Mistral API...' 
          : 'Transcribing with Mistral API...')
        
        transcribed = await transcribeAudio(audioBlob, transcriptionLanguage, currentUserSettings.mistralApiKey, ext)
        
        toast.success(transcriptionLanguage === 'fr' 
          ? 'Transcription réussie !' 
          : 'Transcription successful!')
      } catch (error) {
        console.error('Mistral transcription error:', error)
        toast.error(transcriptionLanguage === 'fr' 
          ? 'Erreur de transcription - utilisation du mode simulé' 
          : 'Transcription error - using simulated mode')
        
        await new Promise(resolve => setTimeout(resolve, 800))
        transcribed = getSimulatedTranscription(transcriptionLanguage)
      }
    } else {
      toast.info(transcriptionLanguage === 'fr' 
        ? 'Mode simulation (configurez Mistral API dans les paramètres pour une vraie transcription)' 
        : 'Simulation mode (configure Mistral API in settings for real transcription)')
      
      await new Promise(resolve => setTimeout(resolve, 800))
      transcribed = getSimulatedTranscription(transcriptionLanguage)
    }
    
    setTranscribedText(transcribed)

    if (currentVisitorLanguage && currentVisitorLanguage !== language && currentUserSettings.mistralApiKey) {
      try {
        const { translateText } = await import('@/lib/mistral')
        const translated = await translateText(transcribed, language, currentUserSettings.mistralApiKey)
        setTranslatedVisitorText(translated)
      } catch {
        setTranslatedVisitorText('')
      }
    } else {
      setTranslatedVisitorText('')
    }

    await generateResponses(transcribed)
    setRecordingState('idle')
  }

  const generateResponses = async (input: string) => {
    try {
      const { generateResponseSuggestions } = await import('@/lib/mistral')
      
      const responses = await generateResponseSuggestions({
        transcribedText: input,
        language,
        conversationHistory,
        apiKey: currentUserSettings.mistralApiKey,
        userSettings: currentUserSettings,
        contextTurns: currentUserSettings.mistralContextTurns ?? 20
      })
      
      setSuggestions(responses)
    } catch (error) {
      console.error('Error generating responses:', error)
      const responseLanguage = currentVisitorLanguage || language
      toast.error(responseLanguage === 'fr' 
        ? 'Erreur lors de la génération des réponses'
        : 'Error generating responses')
    }
  }

  const loadMoreSuggestions = async () => {
    if (!transcribedText || loadingMoreSuggestions) return
    setLoadingMoreSuggestions(true)
    try {
      const { generateResponseSuggestions } = await import('@/lib/mistral')
      const more = await generateResponseSuggestions({
        transcribedText,
        language,
        conversationHistory,
        apiKey: currentUserSettings.mistralApiKey,
        userSettings: currentUserSettings,
        contextTurns: currentUserSettings.mistralContextTurns ?? 20,
        excludeTexts: suggestions.map(s => s.text)
      })
      setSuggestions(prev => [
        ...prev,
        ...more.map(s => ({ ...s, id: `more-${Date.now()}-${s.id}` }))
      ])
    } catch (error) {
      console.error('Error loading more suggestions:', error)
      toast.error(language === 'fr'
        ? 'Erreur lors du chargement des suggestions'
        : 'Error loading more suggestions')
    } finally {
      setLoadingMoreSuggestions(false)
    }
  }

  const handleTextSubmit = async (text: string) => {
    await speakUserInitiatedText(text)
  }

  const speakUserInitiatedText = async (text: string) => {
    setRecordingState('speaking')
    const responseLanguage = currentVisitorLanguage || language
    toast.success(t.recording.toastSpeaking)
    
    try {
      let textToSpeak = text
      
      if (responseLanguage !== language && currentUserSettings.mistralApiKey) {
        toast.info(language === 'fr' 
          ? 'Traduction du texte en cours...' 
          : 'Translating text...')
        
        const { translateText } = await import('@/lib/mistral')
        textToSpeak = await translateText(text, responseLanguage, currentUserSettings.mistralApiKey)
        
        console.log(`Interface language: ${language}, Visitor language: ${responseLanguage}`)
        console.log(`Original text: ${text}`)
        console.log(`Translated text: ${textToSpeak}`)
      }
      
      setLastSpokenResponse({ text: textToSpeak, language: responseLanguage })
      
      await speak({
        text: textToSpeak,
        language: responseLanguage,
        rate: 0.9,
        pitch: 1,
        volume: 1,
        voiceProfile: currentVoiceProfile,
        apiKey: currentUserSettings.mistralApiKey
      })
      
      setRecordingState('idle')
      saveUserInitiatedConversation(text)
    } catch (error) {
      setRecordingState('idle')
      toast.error(t.recording.toastError)
      console.error('TTS error:', error)
    }
  }

  const saveUserInitiatedConversation = (userText: string) => {
    const newTurn: ConversationTurn = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      visitorInput: '',
      userResponse: userText,
      isCustomResponse: false
    }
    
    setHistory((currentHistory) => {
      const current = currentHistory || []
      return [...current, newTurn]
    })
  }

  const handleSelectResponse = async (responseText: string) => {
    await speakResponse(responseText, false)
  }

  const handleCustomResponse = (responseText: string) => {
    speakResponse(responseText, true)
  }

  const speakResponse = async (responseText: string, isCustom: boolean) => {
    setRecordingState('speaking')
    toast.success(t.recording.toastSpeaking)
    
    try {
      let textToSpeak = responseText
      const targetLanguage = currentVisitorLanguage || language
      const languageToSpeak: string = targetLanguage
      
      if (targetLanguage !== language && currentUserSettings.mistralApiKey) {
        toast.info(language === 'fr' 
          ? 'Traduction de la réponse en cours...' 
          : 'Translating response...')
        
        const { translateText } = await import('@/lib/mistral')
        textToSpeak = await translateText(responseText, targetLanguage, currentUserSettings.mistralApiKey)
        
        console.log(`Interface language: ${language}, Visitor language: ${targetLanguage}`)
        console.log(`Original response: ${responseText}`)
        console.log(`Translated response: ${textToSpeak}`)
      }
      
      setLastSpokenResponse({ text: textToSpeak, language: languageToSpeak })
      
      await speak({
        text: textToSpeak,
        language: languageToSpeak,
        rate: 0.9,
        pitch: 1,
        volume: 1,
        voiceProfile: currentVoiceProfile,
        apiKey: currentUserSettings.mistralApiKey
      })
      
      setRecordingState('idle')
      saveConversationTurn(responseText, isCustom)
    } catch (error) {
      setRecordingState('idle')
      toast.error(t.recording.toastError)
      console.error('TTS error:', error)
    }
  }

  const handleReplayLastResponse = async () => {
    if (!lastSpokenResponse) {
      toast.error(t.replay.toastNoResponse)
      return
    }

    setRecordingState('speaking')
    toast.info(t.replay.toastReplaying)
    
    try {
      await speak({
        text: lastSpokenResponse.text,
        language: lastSpokenResponse.language,
        rate: 0.9,
        pitch: 1,
        volume: 1,
        voiceProfile: currentVoiceProfile,
        apiKey: currentUserSettings.mistralApiKey
      })
      
      setRecordingState('idle')
    } catch (error) {
      setRecordingState('idle')
      toast.error(t.recording.toastError)
      console.error('TTS replay error:', error)
    }
  }

  const handleReplayFromHistory = async (turn: ConversationTurn) => {
    if (recordingState !== 'idle') return
    setRecordingState('speaking')

    try {
      const targetLanguage = turn.visitorLanguage || language
      let textToSpeak = turn.userResponse

      if (targetLanguage !== language && currentUserSettings.mistralApiKey) {
        toast.info(language === 'fr' ? 'Traduction en cours...' : 'Translating...')
        const { translateText } = await import('@/lib/mistral')
        textToSpeak = await translateText(turn.userResponse, targetLanguage, currentUserSettings.mistralApiKey)
      }

      await speak({
        text: textToSpeak,
        language: targetLanguage,
        rate: 0.9,
        pitch: 1,
        volume: 1,
        voiceProfile: currentVoiceProfile,
        apiKey: currentUserSettings.mistralApiKey
      })

      setRecordingState('idle')
    } catch (error) {
      setRecordingState('idle')
      toast.error(t.recording.toastError)
      console.error('History replay error:', error)
    }
  }

  const saveConversationTurn = (userResponse: string, isCustom: boolean) => {
    const newTurn: ConversationTurn = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      visitorInput: translatedVisitorText || transcribedText,
      userResponse,
      isCustomResponse: isCustom,
      visitorLanguage: currentVisitorLanguage || language
    }
    
    setHistory((currentHistory) => {
      const current = currentHistory || []
      return [...current, newTurn]
    })
    
    setTranscribedText('')
    setTranslatedVisitorText('')
    setSuggestions([])
  }

  const handleDeleteConversation = (id: string) => {
    setHistory((currentHistory) => {
      const current = currentHistory || []
      return current.filter(turn => turn.id !== id)
    })
    toast.success(t.history.deleteConfirm)
  }

  const handleClearHistory = () => {
    setHistory([])
    toast.success(language === 'fr' ? 'Historique effacé' : 'History cleared')
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <Toaster position="top-center" />

      {needRefresh && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shadow-lg">
          <span className="text-sm font-medium">
            {language === 'fr' ? '🔄 Nouvelle version disponible' : '🔄 New version available'}
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => updateServiceWorker(true)}
            className="ml-4"
          >
            <ArrowsClockwise size={16} className="mr-2" />
            {language === 'fr' ? 'Mettre à jour' : 'Update now'}
          </Button>
        </div>
      )}
      
      <div className={`container mx-auto px-3 sm:px-6 py-4 sm:py-8 max-w-7xl${needRefresh ? ' pt-20' : ''}`}>
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-1 sm:mb-2">{t.app.title}</h1>
              <p className="text-sm sm:text-lg text-muted-foreground">{t.app.subtitle}</p>
            </div>
            
            <div className="flex gap-1.5 sm:gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="sm:text-base sm:px-4 sm:py-2 sm:h-11"
                      onClick={handleReplayLastResponse}
                      disabled={!lastSpokenResponse || recordingState !== 'idle'}
                    >
                      <ArrowCounterClockwise size={20} className="sm:mr-2" />
                      <span className="hidden sm:inline">{t.replay.button}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t.replay.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button variant="outline" size="sm" className="sm:text-base sm:px-4 sm:py-2 sm:h-11" onClick={() => setSettingsOpen(true)}>
                <Gear size={20} className="sm:mr-2" />
                <span className="hidden sm:inline">{t.settings.button}</span>
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="sm:text-base sm:px-4 sm:py-2 sm:h-11">
                    <ClockCounterClockwise size={20} className="sm:mr-2" />
                    <span className="hidden sm:inline">{t.history.buttonLabel} ({conversationHistory.length})</span>
                    <span className="sm:hidden">{conversationHistory.length > 0 ? conversationHistory.length : ''}</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-[540px] sm:max-w-lg">
                  <SheetHeader>
                    <div className="flex items-center justify-between">
                      <SheetTitle className="text-2xl">{t.history.title}</SheetTitle>
                      {conversationHistory.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearHistory}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash size={16} className="mr-2" />
                          {language === 'fr' ? 'Tout effacer' : 'Clear all'}
                        </Button>
                      )}
                    </div>
                  </SheetHeader>
                  <div className="mt-6 h-[calc(100vh-120px)]">
                    <ConversationHistory 
                      history={conversationHistory}
                      onDelete={handleDeleteConversation}
                      onReplay={handleReplayFromHistory}
                      disabled={recordingState !== 'idle'}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          <div className="space-y-6">
            {!currentVisitorLanguage && (
              <VisitorLanguageSelector
                selectedLanguage={currentVisitorLanguage}
                onSelectLanguage={setVisitorLanguage}
              />
            )}
            
            <Card className="p-4 sm:p-8">
              <div className="text-center space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-2">{t.recording.listenTitle}</h2>
                  {currentVisitorLanguage && (
                    <p className="text-sm text-accent mb-2">
                      {getLanguageDisplayName(currentVisitorLanguage, language)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setVisitorLanguage(null)
                          setTranscribedText('')
                          setTranslatedVisitorText('')
                          setSuggestions([])
                        }}
                        className="ml-2 h-6 text-xs"
                      >
                        {language === 'fr' ? 'Changer' : 'Change'}
                      </Button>
                    </p>
                  )}
                  <p className="text-muted-foreground">
                    {recordingState === 'idle' && t.recording.statusIdle}
                    {recordingState === 'recording' && t.recording.statusRecording}
                    {recordingState === 'processing' && t.recording.statusProcessing}
                    {recordingState === 'speaking' && t.recording.statusSpeaking}
                  </p>
                  {recordingState === 'idle' && (
                    <div className="mt-3 flex items-center justify-center gap-2">
                      {isTTSAvailable(currentUserSettings.mistralApiKey) ? (
                        <div className="flex items-center gap-2 text-primary text-sm">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          <span className="font-medium">
                            {language === 'fr' ? 'Mistral TTS activé' : 'Mistral TTS enabled'}
                          </span>
                        </div>
                      ) : isTranscriptionAvailable(currentUserSettings.mistralApiKey) ? (
                        <div className="flex items-center gap-2 text-accent text-sm">
                          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                          <span className="font-medium">
                            {language === 'fr' ? 'Mistral STT activé' : 'Mistral STT enabled'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                          <span>
                            {language === 'fr' ? 'Mode simulation' : 'Simulation mode'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-center py-4 sm:py-8">
                  <RecordingButton
                    state={recordingState}
                    onStartRecording={handleStartRecording}
                    onStopRecording={handleStopRecording}
                  />
                </div>

                <AnimatePresence>
                  {recordingState === 'speaking' && (
                    <VoiceIndicator
                      language={language}
                      voiceName={getCurrentVoice()?.name}
                      isActive={recordingState === 'speaking'}
                      isClonedVoice={isClonedVoice()}
                      profileName={getCurrentVoiceProfile()?.name}
                      isMistralTTS={isMistralTTS()}
                    />
                  )}
                </AnimatePresence>

                {recordingState === 'speaking' && (
                  <div className="flex items-center justify-center gap-2 text-accent mt-4">
                    <SpeakerHigh size={24} weight="fill" className="animate-pulse" />
                    <span className="font-medium">Playing audio...</span>
                  </div>
                )}
              </div>
            </Card>

            {transcribedText && (
              <Card className="p-4 sm:p-6 bg-secondary/50 border-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  {t.transcribed.label}
                </h3>
                <p className="conversation-text text-lg text-foreground leading-relaxed">
                  {transcribedText}
                </p>
              </Card>
            )}

            <TextInitiator 
              onTextSubmit={handleTextSubmit}
              disabled={recordingState !== 'idle'}
            />


          </div>

          <div className="space-y-6">
            {translatedVisitorText && (
              <Card className="p-4 sm:p-5 bg-secondary/50 border-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {language === 'fr' ? 'Ce que dit votre interlocuteur' : "Visitor's message"}
                </h3>
                <p className="conversation-text text-base text-foreground leading-relaxed">
                  {translatedVisitorText}
                </p>
              </Card>
            )}
            {suggestions.length > 0 ? (
              <Card className="p-6">
                <ResponseSuggestions
                  suggestions={suggestions}
                  onSelectResponse={handleSelectResponse}
                  onCustomResponse={() => setCustomDialogOpen(true)}
                  onLoadMore={loadMoreSuggestions}
                  loadingMore={loadingMoreSuggestions}
                  disabled={recordingState !== 'idle'}
                  keyboardShortcuts={currentUserSettings.keyboardShortcuts}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-3 text-muted-foreground hover:text-destructive"
                  disabled={recordingState !== 'idle'}
                  onClick={() => {
                    setTranscribedText('')
                    setTranslatedVisitorText('')
                    setSuggestions([])
                  }}
                >
                  <X size={16} className="mr-2" />
                  {language === 'fr' ? 'Ignorer — pas de réponse nécessaire' : 'Dismiss — no response needed'}
                </Button>
              </Card>
            ) : (
              <Card className="p-4 sm:p-8">
                <div className="text-center text-muted-foreground space-y-3">
                  <p className="text-base sm:text-lg">{t.responses.placeholder}</p>
                  <p className="text-sm">{t.responses.getStarted}</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      <CustomResponseDialog
        open={customDialogOpen}
        onOpenChange={setCustomDialogOpen}
        onSubmit={handleCustomResponse}
      />

      <footer className="mt-10 text-center">
        <Button
          variant="link"
          size="sm"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setMentionsOpen(true)}
        >
          {language === 'fr' ? 'Mentions légales' : 'Legal Notice'}
        </Button>
      </footer>
    </div>
  )
}

function AppRouter() {
  const [onboardingCompleted, setOnboardingCompleted] = useKV<boolean>('onboarding-completed', false)

  // Still loading from IDB – render nothing to avoid flashing onboarding for returning users
  if (onboardingCompleted === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background" />
    )
  }

  if (!onboardingCompleted) {
    return (
      <>
        <Toaster position="top-center" />
        <OnboardingPage onComplete={() => setOnboardingCompleted(true)} />
      </>
    )
  }

  return <AppContent />
}

function App() {
  return (
    <LanguageProvider>
      <AppRouter />
    </LanguageProvider>
  )
}

export default App