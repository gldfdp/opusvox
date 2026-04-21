import { useState, useRef, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Toaster, toast } from 'sonner'
import { ClockCounterClockwise, SpeakerHigh } from '@phosphor-icons/react'
import { RecordingButton } from '@/components/RecordingButton'
import { ResponseSuggestions } from '@/components/ResponseSuggestions'
import { ConversationHistory } from '@/components/ConversationHistory'
import { CustomResponseDialog } from '@/components/CustomResponseDialog'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { VoiceIndicator } from '@/components/VoiceIndicator'
import { VoiceCloning } from '@/components/VoiceCloning'
import { LanguageProvider, useLanguage } from '@/hooks/use-language'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ConversationTurn, ResponseSuggestion, RecordingState, VoiceProfile } from '@/lib/types'
import { speak, loadVoices, getCurrentVoice, getCurrentVoiceProfile, isClonedVoice } from '@/lib/tts'
import { AnimatePresence } from 'framer-motion'

function AppContent() {
  const { t, language } = useLanguage()
  const [history, setHistory] = useKV<ConversationTurn[]>('conversation-history', [])
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [transcribedText, setTranscribedText] = useState('')
  const [suggestions, setSuggestions] = useState<ResponseSuggestion[]>([])
  const [customDialogOpen, setCustomDialogOpen] = useState(false)
  const [currentVoiceProfile, setCurrentVoiceProfile] = useState<VoiceProfile | null>(null)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  
  const conversationHistory = history || []

  useEffect(() => {
    loadVoices()
  }, [])

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
    
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const simulatedTranscriptions = [
      "How are you feeling today?",
      "Would you like some water?",
      "Do you need anything right now?",
      "Should I adjust the temperature in the room?",
      "Are you comfortable?",
      "Would you like to watch TV?",
      "Is there anyone you'd like me to call?",
      "Do you want me to help you with something?"
    ]
    
    const transcribed = simulatedTranscriptions[Math.floor(Math.random() * simulatedTranscriptions.length)]
    setTranscribedText(transcribed)
    
    await generateResponses(transcribed)
    setRecordingState('idle')
  }

  const generateResponses = async (input: string) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const responseMap: Record<string, ResponseSuggestion[]> = {
      'feeling': [
        { id: '1', text: "I'm feeling okay, thank you for asking.", intent: 'positive' },
        { id: '2', text: "I'm a bit tired right now.", intent: 'neutral' },
        { id: '3', text: "Not great, I could use some help.", intent: 'negative' },
        { id: '4', text: "Better than yesterday, thanks.", intent: 'positive' }
      ],
      'water': [
        { id: '1', text: "Yes please, I would love some water.", intent: 'affirmative' },
        { id: '2', text: "No thank you, I'm fine for now.", intent: 'negative' },
        { id: '3', text: "Maybe in a little while.", intent: 'neutral' },
        { id: '4', text: "Yes, but just a small amount please.", intent: 'affirmative' }
      ],
      'need': [
        { id: '1', text: "I'm okay for now, thank you.", intent: 'negative' },
        { id: '2', text: "Yes, could you help me adjust my position?", intent: 'affirmative' },
        { id: '3', text: "I need to use the restroom.", intent: 'urgent' },
        { id: '4', text: "Some pain medication would be helpful.", intent: 'request' }
      ],
      'default': [
        { id: '1', text: "Yes, that would be great.", intent: 'affirmative' },
        { id: '2', text: "No thank you.", intent: 'negative' },
        { id: '3', text: "Let me think about it.", intent: 'neutral' },
        { id: '4', text: "I appreciate you asking.", intent: 'grateful' }
      ]
    }
    
    const lowerInput = input.toLowerCase()
    let responses = responseMap.default
    
    for (const [key, value] of Object.entries(responseMap)) {
      if (lowerInput.includes(key)) {
        responses = value
        break
      }
    }
    
    setSuggestions(responses)
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
      await speak({
        text: responseText,
        language,
        rate: 0.9,
        pitch: 1,
        volume: 1,
        voiceProfile: currentVoiceProfile
      })
      
      setRecordingState('idle')
      saveConversationTurn(responseText, isCustom)
    } catch (error) {
      setRecordingState('idle')
      toast.error(t.recording.toastError)
      console.error('TTS error:', error)
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

  const handleVoiceProfileChange = (profile: VoiceProfile | null) => {
    setCurrentVoiceProfile(profile)
    if (profile) {
      toast.success(language === 'fr' 
        ? `Voix personnalisée "${profile.name}" activée` 
        : `Personalized voice "${profile.name}" activated`)
    }
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
              <VoiceCloning onVoiceProfileChange={handleVoiceProfileChange} />
              <LanguageSwitcher />
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
                    <ConversationHistory history={conversationHistory} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="p-8">
              <div className="text-center space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">Listen to visitor</h2>
                  <p className="text-muted-foreground">
                    {recordingState === 'idle' && t.recording.statusIdle}
                    {recordingState === 'recording' && t.recording.statusRecording}
                    {recordingState === 'processing' && t.recording.statusProcessing}
                    {recordingState === 'speaking' && t.recording.statusSpeaking}
                  </p>
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
                />
              </Card>
            ) : (
              <Card className="p-8">
                <div className="text-center text-muted-foreground space-y-3">
                  <p className="text-lg">{t.responses.placeholder}</p>
                  <p className="text-sm">Record a visitor's message to get started</p>
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

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}

export default App