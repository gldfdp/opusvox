import { useState, useRef, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Microphone, Play, Trash, Check, X, Plus, User, Waveform } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { VoiceProfile, VoiceRecordingState, UserSettings } from '@/lib/types'
import { useLanguage } from '@/hooks/use-language'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

const RECORDING_DURATION = 10000
const MIN_RECORDING_DURATION = 3000

export function VoiceCloning() {
  const { t, language } = useLanguage()
  const [profiles, setProfiles] = useKV<VoiceProfile[]>('voice-profiles', [])
  const [selectedProfile, setSelectedProfile] = useKV<string | null>('selected-voice-profile', null)
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
    ttsVolume: 0.8,
    createdAt: Date.now(),
    updatedAt: Date.now()
  })
  const [recordingState, setRecordingState] = useState<VoiceRecordingState>('idle')
  const [recordingProgress, setRecordingProgress] = useState(0)
  const [profileName, setProfileName] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [previewAudio, setPreviewAudio] = useState<string | null>(null)
  const [testingVoice, setTestingVoice] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<number | null>(null)
  const progressIntervalRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const testAudioRef = useRef<HTMLAudioElement | null>(null)

  const currentProfiles = profiles || []
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
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  const startRecording = async () => {
    if (!profileName.trim()) {
      toast.error(language === 'fr' ? 'Veuillez entrer un nom pour le profil vocal' : 'Please enter a name for the voice profile')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
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
      setRecordingProgress(0)
      
      progressIntervalRef.current = window.setInterval(() => {
        setRecordingProgress(prev => {
          const next = prev + (100 / (RECORDING_DURATION / 100))
          return next >= 100 ? 100 : next
        })
      }, 100)
      
      recordingTimerRef.current = window.setTimeout(() => {
        stopRecording()
      }, RECORDING_DURATION)
      
      toast.success(language === 'fr' 
        ? 'Enregistrement démarré - lisez le texte affiché' 
        : 'Recording started - read the displayed text')
      
    } catch (error) {
      toast.error(language === 'fr' 
        ? 'Impossible d\'accéder au microphone' 
        : 'Could not access microphone')
      console.error('Microphone access error:', error)
      setRecordingState('error')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      
      setRecordingState('processing')
    }
  }

  const processRecording = async () => {
    if (audioChunksRef.current.length === 0) {
      setRecordingState('error')
      toast.error(language === 'fr' ? 'Aucun audio enregistré' : 'No audio recorded')
      return
    }

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' })
    
    const audioDuration = await getAudioDuration(audioBlob)
    
    if (audioDuration < MIN_RECORDING_DURATION) {
      setRecordingState('error')
      toast.error(language === 'fr' 
        ? 'Enregistrement trop court (minimum 3 secondes)' 
        : 'Recording too short (minimum 3 seconds)')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const audioDataUrl = reader.result as string
      
      const newProfile: VoiceProfile = {
        id: `voice-${Date.now()}`,
        name: profileName.trim(),
        language,
        audioDataUrl,
        createdAt: Date.now(),
        duration: audioDuration,
        voiceType: 'custom'
      }
      
      setProfiles((current) => {
        const updated = [...(current || []), newProfile]
        return updated
      })
      
      setSelectedProfile(newProfile.id)
      setRecordingState('success')
      setProfileName('')
      
      toast.success(language === 'fr' 
        ? `Profil vocal "${newProfile.name}" créé avec succès` 
        : `Voice profile "${newProfile.name}" created successfully`)
      
      setTimeout(() => {
        setDialogOpen(false)
        setRecordingState('idle')
        setRecordingProgress(0)
      }, 1500)
    }
    
    reader.readAsDataURL(audioBlob)
  }

  const getAudioDuration = (blob: Blob): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio()
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration * 1000)
        URL.revokeObjectURL(audio.src)
      })
      audio.src = URL.createObjectURL(blob)
    })
  }

  const deleteProfile = (profileId: string) => {
    setProfiles((current) => {
      const updated = (current || []).filter(p => p.id !== profileId)
      return updated
    })
    
    if (selectedProfile === profileId) {
      setSelectedProfile(null)
    }
    
    toast.success(language === 'fr' ? 'Profil vocal supprimé' : 'Voice profile deleted')
  }

  const selectProfile = (profileId: string | null) => {
    setSelectedProfile(profileId)
    if (profileId === null) {
      toast.info(language === 'fr' 
        ? 'Voix système par défaut activée' 
        : 'Default system voice activated')
    }
  }

  const playPreview = (audioDataUrl?: string) => {
    if (!audioDataUrl) return
    
    if (previewAudio === audioDataUrl) {
      audioRef.current?.pause()
      setPreviewAudio(null)
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioDataUrl
        audioRef.current.play()
        setPreviewAudio(audioDataUrl)
        audioRef.current.onended = () => setPreviewAudio(null)
      }
    }
  }

  const testVoice = async (profile: VoiceProfile) => {
    if (!currentUserSettings.mistralApiKey) {
      toast.error(language === 'fr' 
        ? 'Veuillez configurer votre clé API Mistral dans les paramètres pour tester la voix'
        : 'Please configure your Mistral API key in settings to test the voice')
      return
    }

    if (profile.voiceType !== 'custom' || !profile.audioDataUrl) {
      toast.error(language === 'fr' 
        ? 'Ce profil ne peut pas être testé'
        : 'This profile cannot be tested')
      return
    }

    if (testingVoice === profile.id) {
      if (testAudioRef.current) {
        testAudioRef.current.pause()
        testAudioRef.current.src = ''
      }
      setTestingVoice(null)
      return
    }

    setTestingVoice(profile.id)
    
    const testText = language === 'fr'
      ? `Bonjour, je suis ${currentUserSettings.firstName || 'Marie'}. Voici un aperçu de ma voix clonée.`
      : `Hello, I am ${currentUserSettings.firstName || 'John'}. This is a preview of my cloned voice.`

    try {
      toast.info(language === 'fr' 
        ? 'Génération de l\'aperçu vocal...' 
        : 'Generating voice preview...')

      const speed = 0.9

      const base64Audio = profile.audioDataUrl.split(',')[1]
      if (!base64Audio) {
        throw new Error('Invalid audio data')
      }

      const requestBody = {
        model: 'tts-1',
        input: testText,
        voice_sample: base64Audio,
        speed: speed,
        response_format: 'wav'
      }

      const ttsResponse = await fetch('https://api.mistral.ai/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUserSettings.mistralApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!ttsResponse.ok) {
        const errorText = await ttsResponse.text().catch(() => '')
        console.error('Mistral TTS test error:', {
          status: ttsResponse.status,
          statusText: ttsResponse.statusText,
          body: errorText
        })
        throw new Error(`Mistral TTS API error: ${ttsResponse.status}`)
      }

      const audioBlob = await ttsResponse.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      if (testAudioRef.current) {
        testAudioRef.current.src = audioUrl
        testAudioRef.current.volume = 1
        
        testAudioRef.current.onended = () => {
          URL.revokeObjectURL(audioUrl)
          setTestingVoice(null)
        }

        testAudioRef.current.onerror = () => {
          URL.revokeObjectURL(audioUrl)
          setTestingVoice(null)
          toast.error(language === 'fr' ? 'Erreur de lecture audio' : 'Audio playback error')
        }

        await testAudioRef.current.play()
        toast.success(language === 'fr' ? 'Lecture de l\'aperçu vocal' : 'Playing voice preview')
      }
    } catch (error) {
      console.error('Voice test error:', error)
      setTestingVoice(null)
      toast.error(language === 'fr' 
        ? 'Erreur lors du test de la voix. Vérifiez votre clé API Mistral.'
        : 'Error testing voice. Check your Mistral API key.')
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
    
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current)
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }
    
    setRecordingState('idle')
    setRecordingProgress(0)
    audioChunksRef.current = []
  }

  const userName = currentUserSettings.firstName || (language === 'fr' ? 'Marie' : 'John')
  const sampleText = language === 'fr'
    ? `Bonjour, je m'appelle ${userName}. J'utilise cette application pour communiquer avec mes proches. Cette technologie me permet de garder ma voix et de continuer à m'exprimer.`
    : `Hello, my name is ${userName}. I use this application to communicate with my loved ones. This technology allows me to keep my voice and continue expressing myself.`

  return (
    <>
      <audio ref={audioRef} className="hidden" />
      <audio ref={testAudioRef} className="hidden" />
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="lg">
            <User size={20} className="mr-2" />
            {language === 'fr' ? 'Voix personnalisée' : 'Voice Cloning'}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {language === 'fr' ? 'Clonage de voix' : 'Voice Cloning'}
            </DialogTitle>
            <DialogDescription>
              {language === 'fr' 
                ? 'Enregistrez un échantillon de votre voix pour personnaliser la synthèse vocale. L\'enregistrement dure 10 secondes.' 
                : 'Record a voice sample to personalize speech synthesis. Recording lasts 10 seconds.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-6 py-4">
            {recordingState === 'idle' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="profile-name" className="text-base">
                    {language === 'fr' ? 'Nom du profil vocal' : 'Voice Profile Name'}
                  </Label>
                  <Input
                    id="profile-name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder={language === 'fr' ? 'Ex: Ma voix' : 'Ex: My Voice'}
                    className="mt-2"
                  />
                </div>

                <Alert className="bg-accent/10 border-accent/30">
                  <AlertDescription className="text-sm">
                    <strong>{language === 'fr' ? '📝 Texte à lire :' : '📝 Text to read:'}</strong>
                    <p className="mt-2 leading-relaxed">{sampleText}</p>
                  </AlertDescription>
                </Alert>

                <div className="flex justify-center">
                  <Button 
                    size="lg" 
                    onClick={startRecording}
                    disabled={!profileName.trim()}
                    className="px-8"
                  >
                    <Microphone size={24} className="mr-2" weight="fill" />
                    {language === 'fr' ? 'Commencer l\'enregistrement' : 'Start Recording'}
                  </Button>
                </div>
              </div>
            )}

            {recordingState === 'recording' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <Alert className="bg-accent/10 border-accent/30">
                  <AlertDescription className="text-sm">
                    <strong>{language === 'fr' ? '📝 Lisez ce texte :' : '📝 Read this text:'}</strong>
                    <p className="mt-2 leading-relaxed">{sampleText}</p>
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div className="flex justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-32 h-32 rounded-full bg-accent/20 flex items-center justify-center"
                    >
                      <Microphone size={48} weight="fill" className="text-accent" />
                    </motion.div>
                  </div>
                  
                  <Progress value={recordingProgress} className="h-2" />
                  
                  <p className="text-center text-sm text-muted-foreground">
                    {language === 'fr' ? 'Enregistrement en cours...' : 'Recording in progress...'}
                  </p>
                </div>

                <div className="flex justify-center gap-3">
                  <Button onClick={stopRecording} variant="default">
                    <Check size={20} className="mr-2" />
                    {language === 'fr' ? 'Terminer' : 'Finish'}
                  </Button>
                  <Button onClick={cancelRecording} variant="outline">
                    <X size={20} className="mr-2" />
                    {language === 'fr' ? 'Annuler' : 'Cancel'}
                  </Button>
                </div>
              </motion.div>
            )}

            {recordingState === 'processing' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-4 py-8"
              >
                <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-muted-foreground">
                  {language === 'fr' ? 'Traitement de l\'enregistrement...' : 'Processing recording...'}
                </p>
              </motion.div>
            )}

            {recordingState === 'success' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4 py-8"
              >
                <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
                  <Check size={48} weight="bold" className="text-accent" />
                </div>
                <p className="text-lg font-semibold">
                  {language === 'fr' ? 'Profil vocal créé !' : 'Voice profile created!'}
                </p>
              </motion.div>
            )}

            {recordingState === 'error' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4 py-8"
              >
                <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
                  <X size={48} weight="bold" className="text-destructive" />
                </div>
                <p className="text-lg font-semibold text-destructive">
                  {language === 'fr' ? 'Erreur d\'enregistrement' : 'Recording error'}
                </p>
                <Button onClick={() => setRecordingState('idle')} variant="outline">
                  {language === 'fr' ? 'Réessayer' : 'Try Again'}
                </Button>
              </motion.div>
            )}

            {recordingState === 'idle' && currentProfiles.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">
                  {language === 'fr' ? 'Profils vocaux enregistrés' : 'Saved Voice Profiles'}
                </h3>
                
                <Alert className="bg-primary/5 border-primary/30">
                  <AlertDescription className="text-sm">
                    <strong className="flex items-center gap-2">
                      <Waveform size={16} />
                      {language === 'fr' ? 'Tester votre voix clonée' : 'Test your cloned voice'}
                    </strong>
                    <p className="mt-1">
                      {language === 'fr' 
                        ? 'Cliquez sur l\'icône de forme d\'onde pour entendre un aperçu de votre voix clonée avec Mistral TTS. Assurez-vous d\'avoir configuré votre clé API Mistral dans les paramètres.'
                        : 'Click the waveform icon to hear a preview of your cloned voice with Mistral TTS. Make sure you have configured your Mistral API key in settings.'}
                    </p>
                  </AlertDescription>
                </Alert>
                
                <ScrollArea className="h-64 rounded-md border p-4">
                  <div className="space-y-2">
                    {currentProfiles.map((profile) => (
                      <Card
                        key={profile.id}
                        className={`p-4 cursor-pointer transition-all ${
                          selectedProfile === profile.id 
                            ? 'border-accent bg-accent/5' 
                            : 'hover:border-accent/50'
                        }`}
                        onClick={() => selectProfile(profile.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              selectedProfile === profile.id ? 'bg-accent' : 'bg-muted'
                            }`}>
                              <User size={20} weight="fill" className={
                                selectedProfile === profile.id ? 'text-white' : 'text-muted-foreground'
                              } />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{profile.name}</p>
                                <Badge variant="outline" className="text-xs">
                                  {profile.language.toUpperCase()}
                                </Badge>
                                {selectedProfile === profile.id && (
                                  <Badge className="bg-accent text-xs">
                                    {language === 'fr' ? 'Actif' : 'Active'}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {new Date(profile.createdAt).toLocaleDateString()}{profile.duration ? ` · ${Math.round(profile.duration / 1000)}s` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                playPreview(profile.audioDataUrl)
                              }}
                              title={language === 'fr' ? 'Écouter l\'enregistrement original' : 'Play original recording'}
                            >
                              <Play size={16} weight={previewAudio === profile.audioDataUrl ? 'fill' : 'regular'} />
                            </Button>
                            <Button
                              size="sm"
                              variant={testingVoice === profile.id ? 'default' : 'ghost'}
                              onClick={(e) => {
                                e.stopPropagation()
                                testVoice(profile)
                              }}
                              disabled={testingVoice !== null && testingVoice !== profile.id}
                              title={language === 'fr' ? 'Tester la voix clonée avec Mistral TTS' : 'Test cloned voice with Mistral TTS'}
                            >
                              <Waveform size={16} weight={testingVoice === profile.id ? 'fill' : 'regular'} className={testingVoice === profile.id ? 'animate-pulse' : ''} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteProfile(profile.id)
                              }}
                              title={language === 'fr' ? 'Supprimer le profil' : 'Delete profile'}
                            >
                              <Trash size={16} className="text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
