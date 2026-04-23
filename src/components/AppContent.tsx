import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Toaster, toast } from 'sonner'
import { ClockCounterClockwiseIcon, SpeakerHighIcon, GearIcon, XIcon, TrashIcon } from '@phosphor-icons/react'
import { RecordingButton } from '@/components/RecordingButton'
import { ResponseSuggestions } from '@/components/ResponseSuggestions'
import { ConversationHistory } from '@/components/ConversationHistory'
import { CustomResponseDialog } from '@/components/CustomResponseDialog'
import { VoiceIndicator } from '@/components/VoiceIndicator'
import { SettingsPage } from '@/components/SettingsPage'
import { TextInitiator } from '@/components/TextInitiator'
import { VisitorLanguageSelector } from '@/components/VisitorLanguageSelector'
import { MentionsLegales } from '@/components/MentionsLegales'
import { UpdateBanner } from '@/components/UpdateBanner'
import { useLanguage } from '@/hooks/use-language'
import { useKV } from '@/hooks/use-kv'
import { useRecording } from '@/hooks/use-recording'
import { useConversation } from '@/hooks/use-conversation'
import { useSuggestions } from '@/hooks/use-suggestions'
import { useTTSActions } from '@/hooks/use-tts-actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ArrowCounterClockwise } from '@phosphor-icons/react'
import { VoiceProfile, UserSettings } from '@/lib/types'
import { loadVoices, getCurrentVoice, getCurrentVoiceProfile, isClonedVoice, isMistralTTS, isTTSAvailable } from '@/lib/tts'
import { transcribeAudio, isTranscriptionAvailable, getSimulatedTranscription } from '@/lib/stt'
import { isMediaRecorderSupported } from '@/lib/media'
import { trimTrailingSeconds } from '@/lib/audio'
import { DEFAULT_USER_SETTINGS } from '@/lib/constants'
import { getLanguageDisplayName } from '@/lib/languages'
import { AppLogo } from '@/components/AppLogo'
import { AnimatePresence } from 'framer-motion'

export function AppContent()
{
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  const [userSettings] = useKV<UserSettings>('user-settings', { ...DEFAULT_USER_SETTINGS, createdAt: Date.now(), updatedAt: Date.now() })
  const [profiles] = useKV<VoiceProfile[]>('voice-profiles', [])
  const [selectedProfileId] = useKV<string | null>('selected-voice-profile', null)
  const [visitorLanguage, setVisitorLanguage] = useKV<string | null>('visitor-language', null)

  const [transcribedText, setTranscribedText] = useState('')
  const [translatedVisitorText, setTranslatedVisitorText] = useState('')
  const [customDialogOpen, setCustomDialogOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mentionsOpen, setMentionsOpen] = useState(false)

  const currentUserSettings = userSettings || DEFAULT_USER_SETTINGS
  const currentProfiles = profiles || []
  const currentVoiceProfile = selectedProfileId
    ? currentProfiles.find(p => p.id === selectedProfileId) || null
    : null
  const currentVisitorLanguage = visitorLanguage || null

  const conversation = useConversation()
  const suggestionsMgr = useSuggestions()

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
        toast.info(t.recording.toastTranscribing)
        transcribed = await transcribeAudio(finalBlob, transcriptionLanguage, currentUserSettings.mistralApiKey, ext)
        toast.success(t.recording.toastTranscriptionSuccess)
      }
      catch (error)
      {
        console.error('Mistral transcription error:', error)
        toast.error(t.recording.toastTranscriptionError)
        await new Promise(resolve => setTimeout(resolve, 800))
        transcribed = getSimulatedTranscription(transcriptionLanguage)
      }
    }
    else
    {
      toast.info(t.recording.toastSimulationMode)
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

    await suggestionsMgr.generateResponses({
      transcribedText: transcribed,
      conversationHistory: conversation.conversationHistory,
      apiKey: currentUserSettings.mistralApiKey,
      userSettings: currentUserSettings,
      contextTurns: currentUserSettings.mistralContextTurns ?? 20,
    })
    setRecordingState('idle')
  }

  const { recordingState, setRecordingState, startRecording, stopRecording } = useRecording({
    onComplete: processRecording,
    toastStarted: t.recording.toastStarted,
    toastPermissionDenied: t.recording.toastPermissionDenied,
  })

  const tts = useTTSActions({ setRecordingState })

  const stopRecordingRef = useRef(stopRecording)
  stopRecordingRef.current = stopRecording

  useEffect(() =>
  {
    loadVoices()
  }, [])

  const recordingStateRef = useRef(recordingState)
  recordingStateRef.current = recordingState
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

  handleStartRecordingRef.current = startRecording
  handleStopRecordingRef.current = stopRecording

  const ttsOpts = {
    targetLanguage: currentVisitorLanguage || language,
    voiceProfile: currentVoiceProfile,
    apiKey: currentUserSettings.mistralApiKey,
  }

  const handleSelectResponse = async (responseText: string) =>
  {
    const ok = await tts.speakResponse(responseText, ttsOpts)
    if (ok)
    {
      conversation.saveConversationTurn(
        responseText,
        false,
        translatedVisitorText || transcribedText,
        currentVisitorLanguage || language,
      )
      setTranscribedText('')
      setTranslatedVisitorText('')
      suggestionsMgr.clearSuggestions()
    }
  }

  const handleCustomResponse = async (responseText: string) =>
  {
    const ok = await tts.speakResponse(responseText, ttsOpts)
    if (ok)
    {
      conversation.saveConversationTurn(
        responseText,
        true,
        translatedVisitorText || transcribedText,
        currentVisitorLanguage || language,
      )
      setTranscribedText('')
      setTranslatedVisitorText('')
      suggestionsMgr.clearSuggestions()
    }
  }

  const handleTextSubmit = async (text: string) =>
  {
    const ok = await tts.speakUserInitiatedText(text, ttsOpts)
    if (ok)
    {
      conversation.saveUserInitiatedConversation(text)
    }
  }

  const handleLoadMoreSuggestions = () =>
    suggestionsMgr.loadMoreSuggestions({
      transcribedText,
      conversationHistory: conversation.conversationHistory,
      apiKey: currentUserSettings.mistralApiKey,
      userSettings: currentUserSettings,
      contextTurns: currentUserSettings.mistralContextTurns ?? 20,
    })

  const handleDismissSuggestions = () =>
  {
    setTranscribedText('')
    setTranslatedVisitorText('')
    suggestionsMgr.clearSuggestions()
  }

  const handleResetVisitorLanguage = () =>
  {
    setVisitorLanguage(null)
    setTranscribedText('')
    setTranslatedVisitorText('')
    suggestionsMgr.clearSuggestions()
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-secondary/30 to-background">
      <Toaster position="top-center" />
      <UpdateBanner />

      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8 max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => navigate('/')}
            >
              <AppLogo className="h-10 sm:h-14 w-auto group-hover:opacity-80 transition-opacity" />
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-1 sm:mb-2 group-hover:text-primary transition-colors">{t.app.title}</h1>
                <p className="text-sm sm:text-lg text-muted-foreground">{t.app.subtitle}</p>
              </div>
            </div>

            <div className="flex gap-1.5 sm:gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="sm:text-base sm:px-4 sm:py-2 sm:h-11"
                      onClick={() => tts.replayLastResponse({ voiceProfile: currentVoiceProfile, apiKey: currentUserSettings.mistralApiKey })}
                      disabled={!tts.lastSpokenResponse || recordingState !== 'idle'}
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
                <GearIcon size={20} className="sm:mr-2" />
                <span className="hidden sm:inline">{t.settings.button}</span>
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="sm:text-base sm:px-4 sm:py-2 sm:h-11">
                    <ClockCounterClockwiseIcon size={20} className="sm:mr-2" />
                    <span className="hidden sm:inline">{t.history.buttonLabel} ({conversation.conversationHistory.length})</span>
                    <span className="sm:hidden">{conversation.conversationHistory.length > 0 ? conversation.conversationHistory.length : ''}</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-[540px] sm:max-w-lg">
                  <SheetHeader>
                    <div className="flex items-center justify-between">
                      <SheetTitle className="text-2xl">{t.history.title}</SheetTitle>
                      {conversation.conversationHistory.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={conversation.clearHistory}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <TrashIcon size={16} className="mr-2" />
                          {t.appMisc.clearAll}
                        </Button>
                      )}
                    </div>
                  </SheetHeader>
                  <div className="mt-6 h-[calc(100vh-120px)]">
                    <ConversationHistory
                      history={conversation.conversationHistory}
                      onDelete={conversation.deleteConversation}
                      onReplay={(turn) => tts.replayFromHistory(turn, { voiceProfile: currentVoiceProfile, apiKey: currentUserSettings.mistralApiKey })}
                      disabled={recordingState !== 'idle'}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          <div className="space-y-6 order-2 lg:order-1">
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
                        onClick={handleResetVisitorLanguage}
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
                    <SpeakerHighIcon size={24} weight="fill" className="animate-pulse" />
                    <span className="font-medium">{t.appMisc.playingAudio}</span>
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

          <div className="space-y-6 order-1 lg:order-2">
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
            {suggestionsMgr.suggestions.length > 0 ? (
              <Card className="p-6">
                <ResponseSuggestions
                  suggestions={suggestionsMgr.suggestions}
                  onSelectResponse={handleSelectResponse}
                  onCustomResponse={() => setCustomDialogOpen(true)}
                  onLoadMore={handleLoadMoreSuggestions}
                  loadingMore={suggestionsMgr.loadingMoreSuggestions}
                  disabled={recordingState !== 'idle'}
                  keyboardShortcuts={currentUserSettings.keyboardShortcuts}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-3 text-muted-foreground hover:text-destructive"
                  disabled={recordingState !== 'idle'}
                  onClick={handleDismissSuggestions}
                >
                  <XIcon size={16} className="mr-2" />
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
