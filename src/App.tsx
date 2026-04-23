import { useState, useRef, useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useKV } from '@/hooks/use-kv'
import { useRecording } from '@/hooks/use-recording'
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
import { ConversationTurn, ResponseSuggestion, VoiceProfile, UserSettings } from '@/lib/types'
import { speak, loadVoices, getCurrentVoice, getCurrentVoiceProfile, isClonedVoice, isMistralTTS, isTTSAvailable } from '@/lib/tts'
import { transcribeAudio, isTranscriptionAvailable, getSimulatedTranscription } from '@/lib/stt'
import { isMediaRecorderSupported } from '@/lib/media'
import { trimTrailingSeconds } from '@/lib/audio'
import { DEFAULT_USER_SETTINGS } from '@/lib/constants'
import { initMobileLifecycle, cleanupMobileLifecycle } from '@/mobile/app-lifecycle'
import { getLanguageDisplayName } from '@/lib/languages'
import { AnimatePresence } from 'framer-motion'

function AppContent() 
{
  const { t, language } = useLanguage()
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()
  const [history, setHistory] = useKV<ConversationTurn[]>('conversation-history', [])
  const [userSettings] = useKV<UserSettings>('user-settings', { ...DEFAULT_USER_SETTINGS, createdAt: Date.now(), updatedAt: Date.now() })
  const [profiles] = useKV<VoiceProfile[]>('voice-profiles', [])
  const [selectedProfileId] = useKV<string | null>('selected-voice-profile', null)
  const [visitorLanguage, setVisitorLanguage] = useKV<string | null>('visitor-language', null)
  const [transcribedText, setTranscribedText] = useState('')
  const [translatedVisitorText, setTranslatedVisitorText] = useState('')
  const [suggestions, setSuggestions] = useState<ResponseSuggestion[]>([])
  const [customDialogOpen, setCustomDialogOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mentionsOpen, setMentionsOpen] = useState(false)
  const [loadingMoreSuggestions, setLoadingMoreSuggestions] = useState(false)
  const [lastSpokenResponse, setLastSpokenResponse] = useState<{text: string, language: string} | null>(null)

  const processRecording = async (audioBlob: Blob, trailingSilenceMs: number, _mimeType: string, ext: string): Promise<void> => 
  {
    setRecordingState('processing')

    if (audioBlob.size === 0) 
    {
      toast.error(t.recording.toastError)
      setRecordingState('idle')
      return
    }

    let finalBlob = audioBlob
    const trailingSec = trailingSilenceMs / 1000
    if (trailingSec > 0) 
    {
      finalBlob = await trimTrailingSeconds(audioBlob, trailingSec)
    }

    let transcribed = ''
    const transcriptionLanguage = currentVisitorLanguage || language

    if (isTranscriptionAvailable(currentUserSettings.mistralApiKey)) 
    {
      try 
      {
        toast.info(transcriptionLanguage === 'fr'
          ? 'Transcription avec Mistral API...'
          : 'Transcribing with Mistral API...')

        transcribed = await transcribeAudio(finalBlob, transcriptionLanguage, currentUserSettings.mistralApiKey, ext)

        toast.success(transcriptionLanguage === 'fr'
          ? 'Transcription réussie !'
          : 'Transcription successful!')
      }
      catch (error) 
      {
        console.error('Mistral transcription error:', error)
        toast.error(transcriptionLanguage === 'fr'
          ? 'Erreur de transcription - utilisation du mode simulé'
          : 'Transcription error - using simulated mode')

        await new Promise(resolve => setTimeout(resolve, 800))
        transcribed = getSimulatedTranscription(transcriptionLanguage)
      }
    }
    else 
    {
      toast.info(transcriptionLanguage === 'fr'
        ? 'Mode simulation (configurez Mistral API dans les paramètres pour une vraie transcription)'
        : 'Simulation mode (configure Mistral API in settings for real transcription)')

      await new Promise(resolve => setTimeout(resolve, 800))
      transcribed = getSimulatedTranscription(transcriptionLanguage)
    }

    setTranscribedText(transcribed)

    if (currentVisitorLanguage && currentVisitorLanguage !== language && currentUserSettings.mistralApiKey) 
    {
      try 
      {
        const { translateText } = await import('@/lib/mistral')
        const translated = await translateText(transcribed, language, currentUserSettings.mistralApiKey)
        setTranslatedVisitorText(translated)
      }
      catch 
      {
        setTranslatedVisitorText('')
      }
    }
    else 
    {
      setTranslatedVisitorText('')
    }

    await generateResponses(transcribed)
    setRecordingState('idle')
  }

  const { recordingState, setRecordingState, startRecording, stopRecording } = useRecording({
    onComplete: processRecording,
    toastStarted: t.recording.toastStarted,
    toastPermissionDenied: t.recording.toastPermissionDenied,
  })

  const conversationHistory = history || []
  const currentUserSettings = userSettings || DEFAULT_USER_SETTINGS
  
  const currentProfiles = profiles || []
  const currentVoiceProfile = selectedProfileId 
    ? currentProfiles.find(p => p.id === selectedProfileId) || null
    : null
  const currentVisitorLanguage = visitorLanguage || null

  const stopRecordingRef = useRef(stopRecording)
  stopRecordingRef.current = stopRecording

  useEffect(() => 
  {
    loadVoices()

    initMobileLifecycle({
      onBack: () => 
      {
        if (settingsOpen) 
        {
          setSettingsOpen(false)
        }
      },
      onBackground: () => 
      {
        stopRecordingRef.current()
        window.speechSynthesis?.cancel()
      },
    })

    return () => cleanupMobileLifecycle()
  }, [settingsOpen])

  const recordingStateRef = useRef(recordingState)
  recordingStateRef.current = recordingState
  // Always-current refs to avoid stale closure issues in keyboard handler and silence timer
  const handleStartRecordingRef = useRef<() => Promise<void>>(() => Promise.resolve())
  const handleStopRecordingRef = useRef<() => void>(() => 
  {})

  useEffect(() => 
  {
    const shortcut = currentUserSettings.recordingShortcut ?? ' '
    const handleKeyDown = (e: KeyboardEvent) => 
    {
      if (e.repeat) 
      {
        return
      }
      if (settingsOpen || mentionsOpen) 
      {
        return
      }
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) 
      {
        return
      }
      if (e.key === shortcut) 
      {
        e.preventDefault()
        if (recordingStateRef.current === 'idle') 
        {
          handleStartRecordingRef.current()
        }
        else if (recordingStateRef.current === 'recording') 
        {
          handleStopRecordingRef.current()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [settingsOpen, mentionsOpen, currentUserSettings.recordingShortcut])

  if (settingsOpen) 
  {
    return <SettingsPage onClose={() => setSettingsOpen(false)} />
  }

  if (mentionsOpen) 
  {
    return <MentionsLegales onClose={() => setMentionsOpen(false)} />
  }

  if (!isMediaRecorderSupported()) 
  {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 text-center text-muted-foreground">
        {t.appMisc.audioRecordingNotAvailable}
      </div>
    )
  }

  // Keep refs in sync with latest handler versions (used by keyboard shortcut)
  handleStartRecordingRef.current = startRecording
  handleStopRecordingRef.current = stopRecording

  const generateResponses = async (input: string) => 
  {
    try 
    {
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
    }
    catch (error) 
    {
      console.error('Error generating responses:', error)
      toast.error(t.appMisc.errorGeneratingResponses)
    }
  }

  const loadMoreSuggestions = async () => 
  {
    if (!transcribedText || loadingMoreSuggestions) 
    {
      return
    }
    setLoadingMoreSuggestions(true)
    try 
    {
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
    }
    catch (error) 
    {
      console.error('Error loading more suggestions:', error)
      toast.error(t.appMisc.errorLoadingSuggestions)
    }
    finally 
    {
      setLoadingMoreSuggestions(false)
    }
  }

  const handleTextSubmit = async (text: string) => 
  {
    await speakUserInitiatedText(text)
  }

  const speakUserInitiatedText = async (text: string) => 
  {
    setRecordingState('speaking')
    const responseLanguage = currentVisitorLanguage || language
    toast.success(t.recording.toastSpeaking)
    
    try 
    {
      let textToSpeak = text
      
      if (responseLanguage !== language && currentUserSettings.mistralApiKey) 
      {
        toast.info(t.appMisc.translatingText)
        
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
    }
    catch (error) 
    {
      setRecordingState('idle')
      toast.error(t.recording.toastError)
      console.error('TTS error:', error)
    }
  }

  const saveUserInitiatedConversation = (userText: string) => 
  {
    const newTurn: ConversationTurn = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      visitorInput: '',
      userResponse: userText,
      isCustomResponse: false
    }
    
    setHistory((currentHistory) => 
    {
      const current = currentHistory || []
      return [...current, newTurn]
    })
  }

  const handleSelectResponse = async (responseText: string) => 
  {
    await speakResponse(responseText, false)
  }

  const handleCustomResponse = (responseText: string) => 
  {
    speakResponse(responseText, true)
  }

  const speakResponse = async (responseText: string, isCustom: boolean) => 
  {
    setRecordingState('speaking')
    toast.success(t.recording.toastSpeaking)
    
    try 
    {
      let textToSpeak = responseText
      const targetLanguage = currentVisitorLanguage || language
      const languageToSpeak: string = targetLanguage
      
      if (targetLanguage !== language && currentUserSettings.mistralApiKey) 
      {
        toast.info(t.appMisc.translatingResponse)
        
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
    }
    catch (error) 
    {
      setRecordingState('idle')
      toast.error(t.recording.toastError)
      console.error('TTS error:', error)
    }
  }

  const handleReplayLastResponse = async () => 
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
    }
    catch (error) 
    {
      setRecordingState('idle')
      toast.error(t.recording.toastError)
      console.error('TTS replay error:', error)
    }
  }

  const handleReplayFromHistory = async (turn: ConversationTurn) => 
  {
    if (recordingState !== 'idle') 
    {
      return
    }
    setRecordingState('speaking')

    try 
    {
      const targetLanguage = turn.visitorLanguage || language
      let textToSpeak = turn.userResponse

      if (targetLanguage !== language && currentUserSettings.mistralApiKey) 
      {
        toast.info(t.appMisc.translating)
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
    }
    catch (error) 
    {
      setRecordingState('idle')
      toast.error(t.recording.toastError)
      console.error('History replay error:', error)
    }
  }

  const saveConversationTurn = (userResponse: string, isCustom: boolean) => 
  {
    const newTurn: ConversationTurn = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      visitorInput: translatedVisitorText || transcribedText,
      userResponse,
      isCustomResponse: isCustom,
      visitorLanguage: currentVisitorLanguage || language
    }
    
    setHistory((currentHistory) => 
    {
      const current = currentHistory || []
      return [...current, newTurn]
    })
    
    setTranscribedText('')
    setTranslatedVisitorText('')
    setSuggestions([])
  }

  const handleDeleteConversation = (id: string) => 
  {
    setHistory((currentHistory) => 
    {
      const current = currentHistory || []
      return current.filter(turn => turn.id !== id)
    })
    toast.success(t.history.deleteConfirm)
  }

  const handleClearHistory = () => 
  {
    setHistory([])
    toast.success(t.appMisc.historyCleared)
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <Toaster position="top-center" />

      {needRefresh && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shadow-lg">
          <span className="text-sm font-medium">
            {t.appMisc.newVersionAvailable}
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => updateServiceWorker(true)}
            className="ml-4"
          >
            <ArrowsClockwise size={16} className="mr-2" />
            {t.appMisc.updateNow}
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
                          {t.appMisc.clearAll}
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
                        onClick={() => 
{
                          setVisitorLanguage(null)
                          setTranscribedText('')
                          setTranslatedVisitorText('')
                          setSuggestions([])
                        }}
                        className="ml-2 h-6 text-xs"
                      >
                        {t.appMisc.change}
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
                            {t.appMisc.mistralTtsEnabled}
                          </span>
                        </div>
                      ) : isTranscriptionAvailable(currentUserSettings.mistralApiKey) ? (
                        <div className="flex items-center gap-2 text-accent text-sm">
                          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                          <span className="font-medium">
                            {t.appMisc.mistralSttEnabled}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                          <span>
                            {t.appMisc.simulationMode}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-center py-4 sm:py-8">
                  <RecordingButton
                    state={recordingState}
                    onStartRecording={startRecording}
                    onStopRecording={stopRecording}
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
                  {t.appMisc.visitorsMessage}
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
                  onClick={() => 
{
                    setTranscribedText('')
                    setTranslatedVisitorText('')
                    setSuggestions([])
                  }}
                >
                  <X size={16} className="mr-2" />
                  {t.appMisc.dismiss}
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
          {t.appMisc.legalNotice}
        </Button>
      </footer>
    </div>
  )
}

function AppRouter() 
{
  const [onboardingCompleted, setOnboardingCompleted] = useKV<boolean>('onboarding-completed', false)

  // Still loading from IDB – render nothing to avoid flashing onboarding for returning users
  if (onboardingCompleted === undefined) 
  {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background" />
    )
  }

  if (!onboardingCompleted) 
  {
    return (
      <>
        <Toaster position="top-center" />
        <OnboardingPage onComplete={() => setOnboardingCompleted(true)} />
      </>
    )
  }

  return <AppContent />
}

function App() 
{
  return (
    <LanguageProvider>
      <AppRouter />
    </LanguageProvider>
  )
}

export default App