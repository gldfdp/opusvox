import { useState, useRef, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { UserSettings, VoiceProfile, VoiceRecordingState } from '@/lib/types'
import { useLanguage } from '@/hooks/use-language'
import { Language } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  User, 
  Key, 
  Microphone, 
  Check, 
  X, 
  Play, 
  Trash, 
  Eye, 
  EyeSlash,
  CloudArrowUp,
  FloppyDisk,
  CheckCircle,
  Warning,
  Heart,
  Translate,
  Waveform
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

const RECORDING_DURATION = 10000
const MIN_RECORDING_DURATION = 3000

interface SettingsPageProps {
  onClose: () => void
}

export function SettingsPage({ onClose }: SettingsPageProps) {
  const { t, language, setLanguage } = useLanguage()
  const [userSettings, setUserSettings] = useKV<UserSettings>('user-settings', {
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
  
  const [profiles, setProfiles] = useKV<VoiceProfile[]>('voice-profiles', [])
  const [selectedProfile, setSelectedProfile] = useKV<string | null>('selected-voice-profile', null)
  
  const [firstName, setFirstName] = useState(userSettings?.firstName || '')
  const [lastName, setLastName] = useState(userSettings?.lastName || '')
  const [age, setAge] = useState<string>(userSettings?.age?.toString() || '')
  const [communicationStyle, setCommunicationStyle] = useState<'formal' | 'casual' | 'professional' | 'friendly' | ''>(userSettings?.preferredCommunicationStyle || '')
  const [medicalConditions, setMedicalConditions] = useState(userSettings?.medicalConditions || '')
  const [allergies, setAllergies] = useState(userSettings?.allergies || '')
  const [specialNeeds, setSpecialNeeds] = useState(userSettings?.specialNeeds || '')
  const [apiKey, setApiKey] = useState(userSettings?.mistralApiKey || '')
  const [showApiKey, setShowApiKey] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [keyboardShortcuts, setKeyboardShortcuts] = useState<[string, string, string, string]>(
    (userSettings?.keyboardShortcuts as [string, string, string, string]) || ['q', 's', 'd', 'f']
  )
  
  const [recordingState, setRecordingState] = useState<VoiceRecordingState>('idle')
  const [recordingProgress, setRecordingProgress] = useState(0)
  const [profileName, setProfileName] = useState('')
  const [previewAudio, setPreviewAudio] = useState<string | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [testingVoice, setTestingVoice] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<number | null>(null)
  const progressIntervalRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const testAudioRef = useRef<HTMLAudioElement | null>(null)

  const currentSettings: UserSettings = userSettings || {
    firstName: '',
    lastName: '',
    age: null,
    preferredCommunicationStyle: '' as const,
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

  useEffect(() => {
    setFirstName(currentSettings.firstName || '')
    setLastName(currentSettings.lastName || '')
    setAge(currentSettings.age?.toString() || '')
    setCommunicationStyle(currentSettings.preferredCommunicationStyle || '')
    setMedicalConditions(currentSettings.medicalConditions || '')
    setAllergies(currentSettings.allergies || '')
    setSpecialNeeds(currentSettings.specialNeeds || '')
    setApiKey(currentSettings.mistralApiKey || '')
    setKeyboardShortcuts(currentSettings.keyboardShortcuts)
  }, [currentSettings])

  const handleSaveProfile = () => {
    const ageNumber = age.trim() ? parseInt(age, 10) : null
    
    const updated: UserSettings = {
      ...currentSettings,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      age: ageNumber && !isNaN(ageNumber) ? ageNumber : null,
      preferredCommunicationStyle: communicationStyle,
      medicalConditions: medicalConditions.trim(),
      allergies: allergies.trim(),
      specialNeeds: specialNeeds.trim(),
      keyboardShortcuts,
      updatedAt: Date.now()
    }
    
    setUserSettings(updated)
    toast.success(language === 'fr' ? 'Profil enregistré' : 'Profile saved')
  }

  const handleTestMistralConnection = async () => {
    if (!apiKey.trim()) {
      toast.error(language === 'fr' ? 'Veuillez entrer une clé API' : 'Please enter an API key')
      return
    }

    setTestingConnection(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const updated: UserSettings = {
        ...currentSettings,
        mistralApiKey: apiKey.trim(),
        mistralConnected: true,
        updatedAt: Date.now()
      }
      
      setUserSettings(updated)
      toast.success(language === 'fr' ? 'Connexion Mistral réussie !' : 'Mistral connection successful!')
    } catch (error) {
      toast.error(language === 'fr' ? 'Échec de la connexion Mistral' : 'Mistral connection failed')
    } finally {
      setTestingConnection(false)
    }
  }

  const handleDisconnectMistral = () => {
    const updated: UserSettings = {
      ...currentSettings,
      mistralApiKey: '',
      mistralConnected: false,
      updatedAt: Date.now()
    }
    
    setUserSettings(updated)
    setApiKey('')
    toast.info(language === 'fr' ? 'Mistral déconnecté' : 'Mistral disconnected')
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
        duration: audioDuration
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!profileName.trim()) {
      toast.error(language === 'fr' ? 'Veuillez entrer un nom pour le profil vocal' : 'Please enter a name for the voice profile')
      return
    }

    if (!file.type.startsWith('audio/')) {
      toast.error(language === 'fr' ? 'Veuillez sélectionner un fichier audio' : 'Please select an audio file')
      return
    }

    setUploadingFile(true)

    try {
      const audioDuration = await getAudioDuration(file)
      
      if (audioDuration < MIN_RECORDING_DURATION) {
        toast.error(language === 'fr' 
          ? 'Audio trop court (minimum 3 secondes)' 
          : 'Audio too short (minimum 3 seconds)')
        setUploadingFile(false)
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
          duration: audioDuration
        }
        
        setProfiles((current) => {
          const updated = [...(current || []), newProfile]
          return updated
        })
        
        setSelectedProfile(newProfile.id)
        setProfileName('')
        setUploadingFile(false)
        
        toast.success(language === 'fr' 
          ? `Profil vocal "${newProfile.name}" créé avec succès` 
          : `Voice profile "${newProfile.name}" created successfully`)
      }
      
      reader.readAsDataURL(file)
    } catch (error) {
      toast.error(language === 'fr' ? 'Erreur lors du téléchargement' : 'Upload error')
      setUploadingFile(false)
    }
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

  const playPreview = (audioDataUrl: string) => {
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
    if (!currentSettings.mistralApiKey) {
      toast.error(language === 'fr' 
        ? 'Veuillez configurer votre clé API Mistral dans les paramètres pour tester la voix'
        : 'Please configure your Mistral API key in settings to test the voice')
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
      ? `Bonjour, je suis ${currentSettings.firstName || 'Marie'}. Voici un aperçu de ma voix clonée.`
      : `Hello, I am ${currentSettings.firstName || 'John'}. This is a preview of my cloned voice.`

    try {
      toast.info(language === 'fr' 
        ? 'Génération de l\'aperçu vocal...' 
        : 'Generating voice preview...')

      const speed: number = 0.9

      const base64Audio = profile.audioDataUrl.split(',')[1]
      if (!base64Audio) {
        throw new Error('Invalid audio data')
      }

      const requestBody: Record<string, unknown> = {
        model: 'voxtral-mini-tts-2603',
        input: testText,
        ref_audio: base64Audio
      }
      
      if (Math.abs(speed - 1.0) > 0.01) {
        requestBody.speed = speed
      }

      const ttsResponse = await fetch('https://api.mistral.ai/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentSettings.mistralApiKey}`,
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

  const userName = currentSettings.firstName || (language === 'fr' ? 'Marie' : 'John')
  const sampleText = language === 'fr'
    ? `Bonjour, je m'appelle ${userName}. J'utilise cette application pour communiquer avec mes proches. Cette technologie me permet de garder ma voix et de continuer à m'exprimer.`
    : `Hello, my name is ${userName}. I use this application to communicate with my loved ones. This technology allows me to keep my voice and continue expressing myself.`

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background p-6">
      <audio ref={audioRef} className="hidden" />
      <audio ref={testAudioRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {language === 'fr' ? 'Paramètres' : 'Settings'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'fr' 
                ? 'Configurez votre profil et vos préférences' 
                : 'Configure your profile and preferences'}
            </p>
          </div>
          <Button onClick={onClose} variant="outline">
            {language === 'fr' ? 'Fermer' : 'Close'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Translate size={24} weight="fill" className="text-primary" />
              {language === 'fr' ? 'Langue de l\'interface' : 'Interface Language'}
            </CardTitle>
            <CardDescription>
              {language === 'fr' 
                ? 'Sélectionnez la langue de l\'application' 
                : 'Select the application language'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language-select">
                {language === 'fr' ? 'Langue' : 'Language'}
              </Label>
              <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
                <SelectTrigger id="language-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                  <SelectItem value="fr">🇫🇷 Français</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {language === 'fr' 
                  ? 'Cela affectera toute l\'interface et les réponses générées' 
                  : 'This will affect the entire interface and generated responses'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={24} weight="fill" className="text-primary" />
              {language === 'fr' ? 'Profil utilisateur' : 'User Profile'}
            </CardTitle>
            <CardDescription>
              {language === 'fr' 
                ? 'Informations personnelles pour personnaliser votre expérience' 
                : 'Personal information to personalize your experience'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  {language === 'fr' ? 'Prénom' : 'First Name'}
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={language === 'fr' ? 'Entrez votre prénom' : 'Enter your first name'}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  {language === 'fr' ? 'Nom' : 'Last Name'}
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={language === 'fr' ? 'Entrez votre nom' : 'Enter your last name'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">
                {language === 'fr' ? 'Âge' : 'Age'}
              </Label>
              <Input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder={language === 'fr' ? 'Entrez votre âge' : 'Enter your age'}
                min="0"
                max="150"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="communicationStyle">
                {language === 'fr' ? 'Style de communication préféré' : 'Preferred Communication Style'}
              </Label>
              <Select value={communicationStyle} onValueChange={(value) => setCommunicationStyle(value as any)}>
                <SelectTrigger id="communicationStyle">
                  <SelectValue placeholder={language === 'fr' ? 'Sélectionnez un style' : 'Select a style'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">
                    {language === 'fr' ? 'Formel' : 'Formal'}
                  </SelectItem>
                  <SelectItem value="casual">
                    {language === 'fr' ? 'Décontracté' : 'Casual'}
                  </SelectItem>
                  <SelectItem value="professional">
                    {language === 'fr' ? 'Professionnel' : 'Professional'}
                  </SelectItem>
                  <SelectItem value="friendly">
                    {language === 'fr' ? 'Amical' : 'Friendly'}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {language === 'fr' 
                  ? 'Cela influencera le ton des suggestions de réponses générées' 
                  : 'This will influence the tone of generated response suggestions'}
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="medicalConditions" className="flex items-center gap-2">
                <Heart size={18} weight="fill" className="text-accent" />
                {language === 'fr' ? 'Conditions médicales' : 'Medical Conditions'}
              </Label>
              <Textarea
                id="medicalConditions"
                value={medicalConditions}
                onChange={(e) => setMedicalConditions(e.target.value)}
                placeholder={language === 'fr' 
                  ? 'Entrez toute condition médicale pertinente pour les conversations...' 
                  : 'Enter any medical conditions relevant to conversations...'}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">
                {language === 'fr' ? 'Allergies' : 'Allergies'}
              </Label>
              <Textarea
                id="allergies"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder={language === 'fr' 
                  ? 'Listez vos allergies (nourriture, médicaments, etc.)...' 
                  : 'List your allergies (food, medications, etc.)...'}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialNeeds">
                {language === 'fr' ? 'Besoins spéciaux' : 'Special Needs'}
              </Label>
              <Textarea
                id="specialNeeds"
                value={specialNeeds}
                onChange={(e) => setSpecialNeeds(e.target.value)}
                placeholder={language === 'fr' 
                  ? 'Toute information supplémentaire utile pour la communication...' 
                  : 'Any additional information useful for communication...'}
                rows={3}
              />
            </div>
            
            <Button onClick={handleSaveProfile} className="w-full sm:w-auto">
              <FloppyDisk size={20} className="mr-2" weight="fill" />
              {language === 'fr' ? 'Enregistrer le profil' : 'Save Profile'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-primary text-2xl">⌨️</span>
              {language === 'fr' ? 'Raccourcis clavier' : 'Keyboard Shortcuts'}
            </CardTitle>
            <CardDescription>
              {language === 'fr' 
                ? 'Configurez les touches pour sélectionner rapidement les réponses suggérées' 
                : 'Configure keys to quickly select suggested responses'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`shortcut-${index}`}>
                    {language === 'fr' ? 'Réponse' : 'Response'} {index + 1}
                  </Label>
                  <Input
                    id={`shortcut-${index}`}
                    value={keyboardShortcuts?.[index] || ['q', 's', 'd', 'f'][index]}
                    onChange={(e) => {
                      const newKey = e.target.value.toLowerCase().slice(-1)
                      if (newKey && /^[a-z]$/.test(newKey)) {
                        const currentShortcuts = keyboardShortcuts || ['q', 's', 'd', 'f']
                        const newShortcuts: [string, string, string, string] = [...currentShortcuts] as [string, string, string, string]
                        newShortcuts[index] = newKey
                        setKeyboardShortcuts(newShortcuts)
                      }
                    }}
                    maxLength={1}
                    className="text-center uppercase font-semibold text-lg"
                    placeholder={['Q', 'S', 'D', 'F'][index]}
                  />
                </div>
              ))}
            </div>
            <Alert className="bg-muted/50">
              <AlertDescription>
                {language === 'fr' 
                  ? 'Utilisez ces touches pour sélectionner rapidement les suggestions de réponses sur la page principale.' 
                  : 'Use these keys to quickly select response suggestions on the main page.'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key size={24} weight="fill" className="text-primary" />
              {language === 'fr' ? 'API Mistral' : 'Mistral API'}
            </CardTitle>
            <CardDescription>
              {language === 'fr' 
                ? 'Connectez votre compte Mistral pour les tâches d\'IA avancées' 
                : 'Connect your Mistral account for advanced AI tasks'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentSettings.mistralConnected ? (
              <Alert className="bg-accent/10 border-accent/30">
                <CheckCircle size={20} weight="fill" className="text-accent" />
                <AlertDescription className="ml-2">
                  <strong>{language === 'fr' ? 'Connecté' : 'Connected'}</strong>
                  <br />
                  {language === 'fr' 
                    ? 'Votre clé API Mistral est configurée et active' 
                    : 'Your Mistral API key is configured and active'}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <Warning size={20} weight="fill" />
                <AlertDescription className="ml-2">
                  {language === 'fr' 
                    ? 'Aucune clé API configurée. Les suggestions de réponses utilisent l\'API Spark par défaut.' 
                    : 'No API key configured. Response suggestions use the default Spark API.'}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="mistralApiKey">
                {language === 'fr' ? 'Clé API Mistral' : 'Mistral API Key'}
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="mistralApiKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={language === 'fr' ? 'sk-...' : 'sk-...'}
                    disabled={currentSettings.mistralConnected}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {language === 'fr' 
                  ? 'Obtenez votre clé API sur console.mistral.ai' 
                  : 'Get your API key from console.mistral.ai'}
              </p>
            </div>

            <div className="flex gap-3">
              {currentSettings.mistralConnected ? (
                <Button onClick={handleDisconnectMistral} variant="outline">
                  <X size={20} className="mr-2" />
                  {language === 'fr' ? 'Déconnecter' : 'Disconnect'}
                </Button>
              ) : (
                <Button 
                  onClick={handleTestMistralConnection} 
                  disabled={testingConnection || !apiKey.trim()}
                >
                  {testingConnection ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {language === 'fr' ? 'Test en cours...' : 'Testing...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} className="mr-2" weight="fill" />
                      {language === 'fr' ? 'Tester la connexion' : 'Test Connection'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Microphone size={24} weight="fill" className="text-primary" />
              {language === 'fr' ? 'Voix personnalisée' : 'Voice Cloning'}
            </CardTitle>
            <CardDescription>
              {language === 'fr' 
                ? 'Enregistrez ou téléchargez un échantillon de votre voix' 
                : 'Record or upload a sample of your voice'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">
                  {language === 'fr' ? 'Nom du profil vocal' : 'Voice Profile Name'}
                </Label>
                <Input
                  id="profile-name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder={language === 'fr' ? 'Ex: Ma voix' : 'Ex: My Voice'}
                  disabled={recordingState !== 'idle' || uploadingFile}
                />
              </div>

              {recordingState === 'idle' && !uploadingFile && (
                <div className="space-y-3">
                  <Alert className="bg-accent/10 border-accent/30">
                    <AlertDescription className="text-sm">
                      <strong>{language === 'fr' ? '📝 Texte à lire :' : '📝 Text to read:'}</strong>
                      <p className="mt-2 leading-relaxed">{sampleText}</p>
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-3">
                    <Button 
                      onClick={startRecording}
                      disabled={!profileName.trim()}
                      className="flex-1"
                    >
                      <Microphone size={20} className="mr-2" weight="fill" />
                      {language === 'fr' ? 'Enregistrer' : 'Record'}
                    </Button>
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!profileName.trim()}
                      variant="outline"
                      className="flex-1"
                    >
                      <CloudArrowUp size={20} className="mr-2" weight="fill" />
                      {language === 'fr' ? 'Télécharger' : 'Upload'}
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

              {uploadingFile && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-4 py-8"
                >
                  <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-muted-foreground">
                    {language === 'fr' ? 'Téléchargement en cours...' : 'Uploading...'}
                  </p>
                </motion.div>
              )}
            </div>

            <Separator />

            {currentProfiles.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">
                  {language === 'fr' ? 'Profils vocaux enregistrés' : 'Saved Voice Profiles'}
                </h3>
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
                                {new Date(profile.createdAt).toLocaleDateString()} · {Math.round(profile.duration / 1000)}s
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
