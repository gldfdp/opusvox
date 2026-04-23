import { useState, useRef, useEffect } from 'react'
import { useKV } from '@/hooks/use-kv'
import { Toaster, toast } from 'sonner'
import { ClockCounterClockwise, SpeakerHigh, Gear, ArrowCounterClockwise } from '@phosphor-icons/react'
import { RecordingButton } from '@/components/RecordingButton'
import { ResponseSuggestions } from '@/components/ResponseSuggestions'
import { ConversationHistory } from '@/components/ConversationHistory'
import { CustomResponseDialog } from '@/components/CustomResponseDialog'
import { VoiceIndicator } from '@/components/VoiceIndicator'
import { SettingsPage } from '@/components/SettingsPage'
import { TextInitiator } from '@/components/TextInitiator'
import { VisitorLanguageSelector } from '@/components/VisitorLanguageSelector'
import { OnboardingPage } from '@/components/OnboardingPage'
import { LanguageProvider, useLanguage } from '@/hooks/use-language'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ConversationTurn, ResponseSuggestion, RecordingState, VoiceProfile, UserSettings } from '@/lib/types'
import { speak, loadVoices, getCurrentVoice, getCurrentVoiceProfile, isClonedVoice, isMistralTTS, isTTSAvailable } from '@/lib/tts'
import { transcribeAudio, isTranscriptionAvailable, getSimulatedTranscription } from '@/lib/stt'
import { getLanguageDisplayName } from '@/lib/languages'
import { AnimatePresence } from 'framer-motion'

function AppContent() {
  const { t, language } = useLanguage()
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
    createdAt: Date.now(),
    updatedAt: Date.now()
  })
  const [profiles] = useKV<VoiceProfile[]>('voice-profiles', [])
  const [selectedProfileId] = useKV<string | null>('selected-voice-profile', null)
  const [visitorLanguage, setVisitorLanguage] = useKV<string | null>('visitor-language', null)
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [transcribedText, setTranscribedText] = useState('')
  const [suggestions, setSuggestions] = useState<ResponseSuggestion[]>([])
  const [customDialogOpen, setCustomDialogOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [lastSpokenResponse, setLastSpokenResponse] = useState<{text: string, language: string} | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  
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
  }, [])

  if (settingsOpen) {
    return <SettingsPage onClose={() => setSettingsOpen(false)} />
  }

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop())
        await processRecording()
      }

      mediaRecorder.start()
      setRecordingState('recording')
      toast.info(t.recording.toastStarted)
    } catch (error) {
      toast.error(t.recording.toastPermissionDenied)
      console.error('Error accessing microphone:', error)
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setRecordingState('processing')
    }
  }

  const processRecording = async () => {
    setRecordingState('processing')
    
    if (audioChunksRef.current.length === 0) {
      toast.error(t.recording.toastError)
      setRecordingState('idle')
      return
    }
    
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
    
    let transcribed = ''
    const transcriptionLanguage = currentVisitorLanguage || language
    
    if (isTranscriptionAvailable(currentUserSettings.mistralApiKey)) {
      try {
        toast.info(transcriptionLanguage === 'fr' 
          ? 'Transcription avec Mistral API...' 
          : 'Transcribing with Mistral API...')
        
        transcribed = await transcribeAudio(audioBlob, transcriptionLanguage, currentUserSettings.mistralApiKey)
        
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
    await generateResponses(transcribed)
    setRecordingState('idle')
  }

  const generateResponses = async (input: string) => {
    try {
      const { generateResponseSuggestions } = await import('@/lib/mistral')
      const responseLanguage = currentVisitorLanguage || language
      
      const responses = await generateResponseSuggestions({
        transcribedText: input,
        language: responseLanguage,
        conversationHistory,
        apiKey: currentUserSettings.mistralApiKey,
        userSettings: currentUserSettings
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
      saveUserInitiatedConversation(textToSpeak)
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
      const updated = [...current, newTurn]
      return updated.slice(-20)
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
      let languageToSpeak: string = language
      
      if (transcribedText && currentUserSettings.mistralApiKey) {
        const { detectLanguage, translateText } = await import('@/lib/mistral')
        const detectedQuestionLanguage = detectLanguage(transcribedText)
        
        if (detectedQuestionLanguage !== language) {
          toast.info(language === 'fr' 
            ? 'Traduction de la réponse en cours...' 
            : 'Translating response...')
          
          textToSpeak = await translateText(responseText, detectedQuestionLanguage, currentUserSettings.mistralApiKey)
          languageToSpeak = detectedQuestionLanguage
          
          console.log(`Question language: ${detectedQuestionLanguage}, Interface language: ${language}`)
          console.log(`Original response: ${responseText}`)
          console.log(`Translated response: ${textToSpeak}`)
        }
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
      saveConversationTurn(textToSpeak, isCustom)
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

  const saveConversationTurn = (userResponse: string, isCustom: boolean) => {
    const newTurn: ConversationTurn = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      visitorInput: transcribedText,
      userResponse,
      isCustomResponse: isCustom
    }
    
    setHistory((currentHistory) => {
      const current = currentHistory || []
      const updated = [...current, newTurn]
      return updated.slice(-20)
    })
    
    setTranscribedText('')
    setSuggestions([])
  }

  const handleDeleteConversation = (id: string) => {
    setHistory((currentHistory) => {
      const current = currentHistory || []
      return current.filter(turn => turn.id !== id)
    })
    toast.success(t.history.deleteConfirm)
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <Toaster position="top-center" />
      
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">{t.app.title}</h1>
              <p className="text-lg text-muted-foreground">{t.app.subtitle}</p>
            </div>
            
            <div className="flex gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={handleReplayLastResponse}
                      disabled={!lastSpokenResponse || recordingState !== 'idle'}
                    >
                      <ArrowCounterClockwise size={20} className="mr-2" />
                      {t.replay.button}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t.replay.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button variant="outline" size="lg" onClick={() => setSettingsOpen(true)}>
                <Gear size={20} className="mr-2" />
                {t.settings.button}
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="lg">
                    <ClockCounterClockwise size={20} className="mr-2" />
                    {t.history.buttonLabel} ({conversationHistory.length})
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-[540px] sm:max-w-lg">
                  <SheetHeader>
                    <SheetTitle className="text-2xl">{t.history.title}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 h-[calc(100vh-120px)]">
                    <ConversationHistory 
                      history={conversationHistory}
                      onDelete={handleDeleteConversation}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {!currentVisitorLanguage && (
              <VisitorLanguageSelector
                selectedLanguage={currentVisitorLanguage}
                onSelectLanguage={setVisitorLanguage}
              />
            )}
            
            <Card className="p-8">
              <div className="text-center space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">{t.recording.listenTitle}</h2>
                  {currentVisitorLanguage && (
                    <p className="text-sm text-accent mb-2">
                      {getLanguageDisplayName(currentVisitorLanguage, language)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setVisitorLanguage(null)
                          setTranscribedText('')
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

                <div className="flex justify-center py-8">
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
              <Card className="p-6 bg-secondary/50 border-2">
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

            <Alert className="bg-accent/10 border-accent/30">
              <AlertDescription className="text-sm">
                <strong>{t.privacy.title}</strong> {t.privacy.message}
              </AlertDescription>
            </Alert>
          </div>

          <div className="space-y-6">
            {suggestions.length > 0 ? (
              <Card className="p-6">
                <ResponseSuggestions
                  suggestions={suggestions}
                  onSelectResponse={handleSelectResponse}
                  onCustomResponse={() => setCustomDialogOpen(true)}
                  disabled={recordingState !== 'idle'}
                  keyboardShortcuts={currentUserSettings.keyboardShortcuts}
                />
              </Card>
            ) : (
              <Card className="p-8">
                <div className="text-center text-muted-foreground space-y-3">
                  <p className="text-lg">{t.responses.placeholder}</p>
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