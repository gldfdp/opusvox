import { useState, useRef, useEffect } from 'react'
import { useKV } from '@/hooks/use-kv'
import { UserSettings, VoiceProfile, VoiceRecordingState } from '@/lib/types'
import { useLanguage } from '@/hooks/use-language'
import { Language } from '@/lib/i18n'
import { trimAudioMiddle30s, getAudioDuration } from '@/lib/audio'
import { DEFAULT_USER_SETTINGS } from '@/lib/constants'
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
  Stop,
  Trash, 
  Eye, 
  EyeSlash,
  CloudArrowUp,
  FloppyDisk,
  CheckCircle,
  Warning,
  ArrowsClockwise,
  Heart,
  Translate,
  Waveform
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { MistralStatusCard } from '@/components/MistralStatusCard'

const RECORDING_DURATION = 10000
const MIN_RECORDING_DURATION = 3000

interface SettingsPageProps {
  onClose: () => void
}

export function SettingsPage({ onClose }: SettingsPageProps) 
{
  const { language, setLanguage, t } = useLanguage()
  const [userSettings, setUserSettings] = useKV<UserSettings>('user-settings', { ...DEFAULT_USER_SETTINGS, createdAt: Date.now(), updatedAt: Date.now() })
  
  const [profiles, setProfiles]= useKV<VoiceProfile[]>('voice-profiles', [])
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
    userSettings?.keyboardShortcuts || ['q', 's', 'd', 'f']
  )
  const [contextTurns, setContextTurns] = useState<number>(
    userSettings?.mistralContextTurns ?? 20
  )
  const [recordingShortcut, setRecordingShortcut] = useState<string>(
    userSettings?.recordingShortcut ?? ' '
  )
  
  const [recordingState, setRecordingState] = useState<VoiceRecordingState>('idle')
  const [recordingProgress, setRecordingProgress] = useState(0)
  const [profileName, setProfileName] = useState('')
  const [previewAudio, setPreviewAudio] = useState<string | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [testingVoice, setTestingVoice] = useState<string | null>(null)
  const [retryingVoice, setRetryingVoice] = useState<string | null>(null)
  
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
    mistralContextTurns: 20,
    recordingShortcut: ' ',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  
  const currentProfiles = profiles || []

  useEffect(() => 
  {
    if (!userSettings) 
    {
      return
    }
    setFirstName(userSettings.firstName || '')
    setLastName(userSettings.lastName || '')
    setAge(userSettings.age?.toString() || '')
    setCommunicationStyle(userSettings.preferredCommunicationStyle || '')
    setMedicalConditions(userSettings.medicalConditions || '')
    setAllergies(userSettings.allergies || '')
    setSpecialNeeds(userSettings.specialNeeds || '')
    setApiKey(userSettings.mistralApiKey || '')
    setKeyboardShortcuts(userSettings.keyboardShortcuts)
    setContextTurns(userSettings.mistralContextTurns ?? 20)
    setRecordingShortcut(userSettings.recordingShortcut ?? ' ')
  }, [userSettings])

  const handleSaveProfile = () => 
  {
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
      recordingShortcut,
      mistralContextTurns: contextTurns,
      updatedAt: Date.now()
    }
    
    setUserSettings(updated)
    toast.success(t.userProfile.saved)
  }

  const handleTestMistralConnection = async () => 
  {
    if (!apiKey.trim()) 
    {
      toast.error(t.mistralApi.enterApiKey)
      return
    }

    setTestingConnection(true)
    
    try 
    {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const updated: UserSettings = {
        ...currentSettings,
        mistralApiKey: apiKey.trim(),
        mistralConnected: true,
        updatedAt: Date.now()
      }
      
      setUserSettings(updated)
      toast.success(t.mistralApi.connectionSuccessful)
    }
    catch 
    {
      toast.error(t.mistralApi.connectionFailed)
    }
    finally 
    {
      setTestingConnection(false)
    }
  }

  const handleDisconnectMistral = () => 
  {
    const updated: UserSettings = {
      ...currentSettings,
      mistralApiKey: '',
      mistralConnected: false,
      updatedAt: Date.now()
    }
    
    setUserSettings(updated)
    setApiKey('')
    toast.info(t.mistralApi.disconnected)
  }

  const startRecording = async () => 
  {
    if (!profileName.trim()) 
    {
      toast.error(t.voiceProfiles.enterVoiceName)
      return
    }

    try 
    {
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
      
      mediaRecorder.ondataavailable = (event) => 
      {
        if (event.data.size > 0) 
        {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => 
      {
        stream.getTracks().forEach(track => track.stop())
        await processRecording()
      }
      
      mediaRecorder.start()
      setRecordingState('recording')
      setRecordingProgress(0)
      
      progressIntervalRef.current = window.setInterval(() => 
      {
        setRecordingProgress(prev => 
        {
          const next = prev + (100 / (RECORDING_DURATION / 100))
          return next >= 100 ? 100 : next
        })
      }, 100)
      
      recordingTimerRef.current = window.setTimeout(() => 
      {
        stopRecording()
      }, RECORDING_DURATION)
      
      toast.success(t.voiceProfiles.recordingStarted)
      
    }
    catch (error) 
    {
      toast.error(t.voiceProfiles.microphoneError)
      console.error('Microphone access error:', error)
      setRecordingState('error')
    }
  }

  const stopRecording = () => 
  {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') 
    {
      mediaRecorderRef.current.stop()
      
      if (recordingTimerRef.current) 
      {
        clearTimeout(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
      
      if (progressIntervalRef.current) 
      {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      
      setRecordingState('processing')
    }
  }

  const processRecording = async () => 
  {
    if (audioChunksRef.current.length === 0) 
    {
      setRecordingState('error')
      toast.error(t.voiceProfiles.noAudioRecorded)
      return
    }

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' })
    
    const audioDuration = await getAudioDuration(audioBlob)
    
    if (audioDuration < MIN_RECORDING_DURATION) 
    {
      setRecordingState('error')
      toast.error(t.voiceProfiles.recordingTooShort)
      return
    }

    const audioDataUrl = await new Promise<string>((resolve, reject) => 
    {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(audioBlob)
    })

    const newProfile: VoiceProfile = {
      id: `voice-${Date.now()}`,
      name: profileName.trim(),
      language,
      audioDataUrl,
      createdAt: Date.now(),
      duration: audioDuration
    }

    if (currentSettings.mistralApiKey) 
    {
      const { voiceId, syncError, errorDetail } = await registerVoiceWithMistral(audioDataUrl, newProfile.name, 'webm')
      if (voiceId) 
      {
        newProfile.mistralVoiceId = voiceId
      }
      else if (syncError) 
      {
        newProfile.mistralSyncError = syncError
        if (errorDetail) 
        {
          toast.warning(errorDetail, { description: 'Mistral API' })
        }
      }
    }

    setProfiles((current) => [...(current || []), newProfile])
    setSelectedProfile(newProfile.id)
    setRecordingState('success')
    setProfileName('')

    toast.success(t.voiceProfiles.profileCreatedNamed(newProfile.name))

    setTimeout(() => 
    {
      setRecordingState('idle')
      setRecordingProgress(0)
    }, 1500)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => 
  {
    const file = event.target.files?.[0]
    if (!file) 
    {
      return
    }

    if (!profileName.trim()) 
    {
      toast.error(t.voiceProfiles.enterVoiceName)
      return
    }

    if (!file.type.startsWith('audio/')) 
    {
      toast.error(t.voiceProfiles.selectAudioFile)
      return
    }

    setUploadingFile(true)

    try 
    {
      const audioDuration = await getAudioDuration(file)

      if (audioDuration < MIN_RECORDING_DURATION) 
      {
        toast.error(t.voiceProfiles.audioTooShort)
        setUploadingFile(false)
        return
      }

      const rawDataUrl = await new Promise<string>((resolve, reject) => 
      {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      let audioDataUrl = rawDataUrl
      let finalDuration = audioDuration
      if (audioDuration > 30000) 
      {
        toast.info(t.voiceProfiles.fileTooLong)
        const { dataUrl, trimmed } = await trimAudioMiddle30s(rawDataUrl)
        audioDataUrl = dataUrl
        if (trimmed) 
        {
          finalDuration = 30000
        }
      }

      const newProfile: VoiceProfile = {
        id: `voice-${Date.now()}`,
        name: profileName.trim(),
        language,
        audioDataUrl,
        createdAt: Date.now(),
        duration: finalDuration
      }

      if (currentSettings.mistralApiKey) 
      {
        toast.info(t.voiceProfiles.registeringVoice)
        const ext = file.type.includes('wav') ? 'wav'
          : file.type.includes('mp3') || file.type.includes('mpeg') ? 'mp3'
            : file.type.includes('ogg') ? 'ogg'
              : file.type.includes('flac') ? 'flac'
                : 'wav'
        const { voiceId, syncError, errorDetail } = await registerVoiceWithMistral(audioDataUrl, newProfile.name, ext)
        if (voiceId) 
        {
          newProfile.mistralVoiceId = voiceId
        }
        else if (syncError) 
        {
          newProfile.mistralSyncError = syncError
          if (errorDetail) 
          {
            toast.warning(errorDetail, { description: 'Mistral API' })
          }
        }
      }

      setProfiles((current) => [...(current || []), newProfile])
      setSelectedProfile(newProfile.id)
      setProfileName('')
      setUploadingFile(false)

      toast.success(t.voiceProfiles.profileCreatedNamed(newProfile.name))
    }
    catch 
    {
      toast.error(t.voiceProfiles.uploadError)
      setUploadingFile(false)
    }
  }

  const deleteProfile = async (profileId: string) => 
  {
    const profile = (profiles || []).find(p => p.id === profileId)

    if (profile?.mistralVoiceId && currentSettings.mistralApiKey) 
    {
      try 
      {
        await fetch(`https://api.mistral.ai/v1/audio/voices/${profile.mistralVoiceId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${currentSettings.mistralApiKey}` }
        })
        console.log('Voice deleted from Mistral:', profile.mistralVoiceId)
      }
      catch (error) 
      {
        console.warn('Failed to delete voice from Mistral:', error)
      }
    }

    setProfiles((current) => 
    {
      const updated = (current || []).filter(p => p.id !== profileId)
      return updated
    })

    if (selectedProfile === profileId) 
    {
      setSelectedProfile(null)
    }

    toast.success(t.voiceProfiles.deleted)
  }

  const selectProfile = (profileId: string | null) => 
  {
    setSelectedProfile(profileId)
    if (profileId === null) 
    {
      toast.info(t.voiceProfiles.defaultSystemVoice)
    }
  }

  const registerVoiceWithMistral = async (audioDataUrl: string, name: string, ext: string): Promise<{ voiceId: string | null; syncError: 'plan' | 'error' | null; errorDetail: string | null }> => 
  {
    if (!currentSettings.mistralApiKey) 
    {
      return { voiceId: null, syncError: null, errorDetail: null }
    }
    try 
    {
      const base64Audio = audioDataUrl.split(',')[1]
      const response = await fetch('https://api.mistral.ai/v1/audio/voices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSettings.mistralApiKey}`
        },
        body: JSON.stringify({
          name,
          sample_audio: base64Audio,
          sample_filename: `voice-${Date.now()}.${ext}`
        })
      })
      if (!response.ok) 
      {
        const errorText = await response.text()
        console.warn('Mistral voice registration failed:', errorText)
        let errorDetail: string | null = null
        try 
        {
          errorDetail = JSON.parse(errorText)?.detail ?? errorText 
        }
        catch 
        {
          errorDetail = errorText 
        }
        const isPlanError = response.status === 403 && errorText.toLowerCase().includes('paid plan')
        return { voiceId: null, syncError: isPlanError ? 'plan' : 'error', errorDetail }
      }
      const data = await response.json()
      console.log('Voice registered with Mistral, id:', data.id)
      return { voiceId: data.id as string, syncError: null, errorDetail: null }
    }
    catch (error) 
    {
      console.warn('Failed to register voice with Mistral:', error)
      return { voiceId: null, syncError: 'error', errorDetail: String(error) }
    }
  }

  const retryVoiceRegistration = async (profile: VoiceProfile) => 
  {
    setRetryingVoice(profile.id)
    try 
    {
      const mimeMatch = profile.audioDataUrl.match(/data:audio\/([^;]+)/)
      const ext = mimeMatch?.[1] === 'mpeg' ? 'mp3' : (mimeMatch?.[1] ?? 'wav')
      const { voiceId, syncError, errorDetail } = await registerVoiceWithMistral(profile.audioDataUrl, profile.name, ext)
      if (voiceId) 
      {
        setProfiles(current => (current || []).map(p =>
          p.id === profile.id ? { ...p, mistralVoiceId: voiceId, mistralSyncError: undefined } : p
        ))
        toast.success(t.voiceProfiles.syncedMistral)
      }
      else 
      {
        setProfiles(current => (current || []).map(p =>
          p.id === profile.id ? { ...p, mistralSyncError: syncError ?? 'error' } : p
        ))
        toast.error(errorDetail ?? t.voiceProfiles.syncFailed,
          { description: t.voiceProfiles.syncError }
        )
      }
    }
    finally 
    {
      setRetryingVoice(null)
    }
  }


  const playPreview = (audioDataUrl: string) => 
  {
    if (previewAudio === audioDataUrl) 
    {
      audioRef.current?.pause()
      setPreviewAudio(null)
    }
    else 
    {
      if (audioRef.current) 
      {
        audioRef.current.src = audioDataUrl
        audioRef.current.play()
        setPreviewAudio(audioDataUrl)
        audioRef.current.onended = () => setPreviewAudio(null)
      }
    }
  }

  const testVoice = async (profile: VoiceProfile) => 
  {
    if (!currentSettings.mistralApiKey) 
    {
      toast.error(t.voiceProfiles.testVoiceNoKey)
      return
    }

    if (testingVoice === profile.id) 
    {
      if (testAudioRef.current) 
      {
        testAudioRef.current.pause()
        testAudioRef.current.src = ''
      }
      setTestingVoice(null)
      return
    }

    setTestingVoice(profile.id)
    
    const testText = t.voiceProfiles.testText(currentSettings.firstName || t.userProfile.defaultFirstName)

    try 
    {
      toast.info(t.voiceProfiles.generatingVoicePreview)

      const speed = 0.9

      const base64Audio = profile.audioDataUrl.split(',')[1]
      if (!base64Audio) 
      {
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
          'Authorization': `Bearer ${currentSettings.mistralApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!ttsResponse.ok) 
      {
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

      if (testAudioRef.current) 
      {
        testAudioRef.current.src = audioUrl
        testAudioRef.current.volume = 1
        
        testAudioRef.current.onended = () => 
        {
          URL.revokeObjectURL(audioUrl)
          setTestingVoice(null)
        }

        testAudioRef.current.onerror = () => 
        {
          URL.revokeObjectURL(audioUrl)
          setTestingVoice(null)
          toast.error(t.voiceProfiles.audioPlaybackError)
        }

        await testAudioRef.current.play()
        toast.success(t.voiceProfiles.playingPreview)
      }
    }
    catch (error) 
    {
      console.error('Voice test error:', error)
      setTestingVoice(null)
      toast.error(t.voiceProfiles.voiceTestError)
    }
  }

  const cancelRecording = () => 
  {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') 
    {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
    
    if (recordingTimerRef.current) 
    {
      clearTimeout(recordingTimerRef.current)
    }
    if (progressIntervalRef.current) 
    {
      clearInterval(progressIntervalRef.current)
    }
    
    setRecordingState('idle')
    setRecordingProgress(0)
    audioChunksRef.current = []
  }

  const handleForceRefresh = async () => 
  {
    toast.info(t.appSettings.clearingCache)
    try 
    {
      if ('serviceWorker' in navigator) 
      {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map(r => r.unregister()))
      }
      if ('caches' in window) 
      {
        const keys = await caches.keys()
        await Promise.all(keys.map(k => caches.delete(k)))
      }
    }
    finally 
    {
      window.location.reload()
    }
  }

  const userName = currentSettings.firstName || t.userProfile.defaultFirstName
  const sampleText = t.userProfile.sampleText(userName)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background p-3 sm:p-6">
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
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t.settings.title}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t.appSettings.subtitle}
            </p>
          </div>
          <Button onClick={onClose} variant="outline">
            {t.appSettings.close}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Translate size={24} weight="fill" className="text-primary" />
              {t.appSettings.interfaceLanguageTitle}
            </CardTitle>
            <CardDescription>
              {t.appSettings.interfaceLanguageDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language-select">
                {t.language.label}
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
                {t.appSettings.interfaceLanguageHint}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={24} weight="fill" className="text-primary" />
              {t.userProfile.title}
            </CardTitle>
            <CardDescription>
              {t.userProfile.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  {t.userProfile.firstName}
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t.userProfile.firstNamePlaceholder}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  {t.userProfile.lastName}
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t.userProfile.lastNamePlaceholder}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">
                {t.userProfile.age}
              </Label>
              <Input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder={t.userProfile.agePlaceholder}
                min="0"
                max="150"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="communicationStyle">
                {t.userProfile.communicationStyle}
              </Label>
              <Select value={communicationStyle} onValueChange={(value) => setCommunicationStyle(value as UserSettings['preferredCommunicationStyle'])}>
                <SelectTrigger id="communicationStyle">
                  <SelectValue placeholder={t.userProfile.selectStyle} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">
                    {t.userProfile.formal}
                  </SelectItem>
                  <SelectItem value="casual">
                    {t.userProfile.casual}
                  </SelectItem>
                  <SelectItem value="professional">
                    {t.userProfile.professional}
                  </SelectItem>
                  <SelectItem value="friendly">
                    {t.userProfile.friendly}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {t.userProfile.communicationStyleHint}
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="medicalConditions" className="flex items-center gap-2">
                <Heart size={18} weight="fill" className="text-accent" />
                {t.userProfile.medicalConditions}
              </Label>
              <Textarea
                id="medicalConditions"
                value={medicalConditions}
                onChange={(e) => setMedicalConditions(e.target.value)}
                placeholder={t.userProfile.medicalConditionsPlaceholder}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">
                {t.userProfile.allergies}
              </Label>
              <Textarea
                id="allergies"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder={t.userProfile.allergiesPlaceholder}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialNeeds">
                {t.userProfile.specialNeeds}
              </Label>
              <Textarea
                id="specialNeeds"
                value={specialNeeds}
                onChange={(e) => setSpecialNeeds(e.target.value)}
                placeholder={t.userProfile.specialNeedsPlaceholder}
                rows={3}
              />
            </div>
            
            <Button onClick={handleSaveProfile} className="w-full sm:w-auto">
              <FloppyDisk size={20} className="mr-2" weight="fill" />
              {t.userProfile.save}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-primary text-2xl">⌨️</span>
              {t.shortcuts.title}
            </CardTitle>
            <CardDescription>
              {t.shortcuts.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`shortcut-${index}`}>
                    {t.shortcuts.responseLabel} {index + 1}
                  </Label>
                  <Input
                    id={`shortcut-${index}`}
                    value={keyboardShortcuts[index]}
                    onChange={(e) => 
{
                      const newKey = e.target.value.toLowerCase().slice(-1)
                      if (newKey && /^[a-z]$/.test(newKey)) 
{
                        const newShortcuts: [string, string, string, string] = [...keyboardShortcuts] as [string, string, string, string]
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
                {t.shortcuts.hint}
              </AlertDescription>
            </Alert>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="recordingShortcut" className="font-medium">
                {t.shortcuts.recordingStartKey}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t.shortcuts.recordingStartKeyDesc}
              </p>
              <Input
                id="recordingShortcut"
                readOnly
                value={recordingShortcut === ' '
                  ? t.shortcuts.spaceKey
                  : recordingShortcut.length === 1
                    ? recordingShortcut.toUpperCase()
                    : recordingShortcut}
                onKeyDown={(e) => 
{
                  e.preventDefault()
                  if (e.key === 'Escape' || e.key === 'Tab') 
{
return
}
                  setRecordingShortcut(e.key)
                }}
                className="text-center font-semibold text-lg max-w-[160px] cursor-pointer"
                placeholder={t.shortcuts.clickThenPress}
                title={t.shortcuts.clickThenPressTitle}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key size={24} weight="fill" className="text-primary" />
              {t.mistralApi.title}
            </CardTitle>
            <CardDescription>
              {t.mistralApi.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentSettings.mistralConnected ? (
              <Alert className="bg-accent/10 border-accent/30">
                <CheckCircle size={20} weight="fill" className="text-accent" />
                <AlertDescription className="ml-2">
                  <strong>{t.mistralApi.connected}</strong>
                  <br />
                  {t.mistralApi.connectedAlert}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <Warning size={20} weight="fill" />
                <AlertDescription className="ml-2">
                  {t.mistralApi.noApiKeyAlert}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="mistralApiKey">
                {t.mistralApi.keyLabel}
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="mistralApiKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
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
                {t.mistralApi.getKeyHint}
              </p>
            </div>

            <div className="flex gap-3">
              {currentSettings.mistralConnected ? (
                <Button onClick={handleDisconnectMistral} variant="outline">
                  <X size={20} className="mr-2" />
                  {t.mistralApi.disconnect}
                </Button>
              ) : (
                <Button 
                  onClick={handleTestMistralConnection} 
                  disabled={testingConnection || !apiKey.trim()}
                >
                  {testingConnection ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {t.mistralApi.testing}
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} className="mr-2" weight="fill" />
                      {t.mistralApi.testConnection}
                    </>
                  )}
                </Button>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="contextTurns">
                {t.mistralApi.contextTurnsLabel}
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="contextTurns"
                  type="number"
                  value={contextTurns}
                  onChange={(e) => 
{
                    const val = parseInt(e.target.value)
                    if (!isNaN(val) && val >= 1 && val <= 100) 
{
setContextTurns(val)
}
                  }}
                  min={1}
                  max={100}
                  className="w-24"
                />
                <p className="text-sm text-muted-foreground">
                  {t.mistralApi.contextTurnsDesc}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <MistralStatusCard apiKey={currentSettings.mistralApiKey} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Microphone size={24} weight="fill" className="text-primary" />
              {t.voiceProfiles.title}
            </CardTitle>
            <CardDescription>
              {t.voiceProfiles.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">
                  {t.voiceProfiles.nameLabel}
                </Label>
                <Input
                  id="profile-name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder={t.voiceProfiles.namePlaceholder}
                  disabled={recordingState !== 'idle' || uploadingFile}
                />
              </div>

              {recordingState === 'idle' && !uploadingFile && (
                <div className="space-y-3">
                  <Alert className="bg-accent/10 border-accent/30">
                    <AlertDescription className="text-sm">
                      <strong>{t.voiceProfiles.textToRead}</strong>
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
                      {t.voiceProfiles.record}
                    </Button>
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!profileName.trim()}
                      variant="outline"
                      className="flex-1"
                    >
                      <CloudArrowUp size={20} className="mr-2" weight="fill" />
                      {t.voiceProfiles.upload}
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
                      <strong>{t.voiceProfiles.readThisText}</strong>
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
                      {t.voiceProfiles.recordingInProgress}
                    </p>
                  </div>

                  <div className="flex justify-center gap-3">
                    <Button onClick={stopRecording} variant="default">
                      <Check size={20} className="mr-2" />
                      {t.voiceProfiles.finish}
                    </Button>
                    <Button onClick={cancelRecording} variant="outline">
                      <X size={20} className="mr-2" />
                      {t.voiceProfiles.cancel}
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
                    {t.voiceProfiles.processing}
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
                    {t.voiceProfiles.profileCreated}
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
                    {t.voiceProfiles.recordingError}
                  </p>
                  <Button onClick={() => setRecordingState('idle')} variant="outline">
                    {t.voiceProfiles.tryAgain}
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
                    {t.voiceProfiles.uploading}
                  </p>
                </motion.div>
              )}
            </div>

            <Separator />

            {currentProfiles.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">
                  {t.voiceProfiles.savedProfiles}
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
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                              selectedProfile === profile.id ? 'bg-accent' : 'bg-muted'
                            }`}>
                              <User size={20} weight="fill" className={
                                selectedProfile === profile.id ? 'text-white' : 'text-muted-foreground'
                              } />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 flex-wrap">
                                <p className="font-medium truncate max-w-[120px] sm:max-w-none">{profile.name}</p>
                                <Badge variant="outline" className="text-xs">
                                  {profile.language.toUpperCase()}
                                </Badge>
                                {selectedProfile === profile.id && (
                                  <Badge className="bg-accent text-xs">
                                    {t.voiceProfiles.active}
                                  </Badge>
                                )}
                                {currentSettings.mistralApiKey && !profile.mistralVoiceId && (
                                  <Badge variant="outline" className={`text-xs gap-1 flex items-center ${
                                    profile.mistralSyncError === 'plan'
                                      ? 'text-muted-foreground border-muted-foreground/40'
                                      : 'text-orange-500 border-orange-400'
                                  }`}>
                                    <Warning size={10} weight="fill" />
                                    {profile.mistralSyncError === 'plan'
                                      ? t.voiceProfiles.paidPlanRequired
                                      : t.voiceProfiles.notSynced}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {new Date(profile.createdAt).toLocaleDateString()} · {Math.round(profile.duration / 1000)}s
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant={previewAudio === profile.audioDataUrl ? 'default' : 'ghost'}
                              onClick={(e) => 
{
                                e.stopPropagation()
                                playPreview(profile.audioDataUrl)
                              }}
                              title={previewAudio === profile.audioDataUrl
                                ? t.voiceProfiles.stopPlayback
                                : t.voiceProfiles.playOriginal}
                            >
                              {previewAudio === profile.audioDataUrl
                                ? <Stop size={16} weight="fill" />
                                : <Play size={16} />}
                            </Button>
                            <Button
                              size="sm"
                              variant={testingVoice === profile.id ? 'default' : 'ghost'}
                              onClick={(e) => 
{
                                e.stopPropagation()
                                testVoice(profile)
                              }}
                              disabled={testingVoice !== null && testingVoice !== profile.id}
                              title={t.voiceProfiles.testClonedVoice}
                            >
                              <Waveform size={16} weight={testingVoice === profile.id ? 'fill' : 'regular'} className={testingVoice === profile.id ? 'animate-pulse' : ''} />
                            </Button>
                            {currentSettings.mistralApiKey && !profile.mistralVoiceId && profile.mistralSyncError !== 'plan' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => 
{
                                  e.stopPropagation()
                                  retryVoiceRegistration(profile)
                                }}
                                disabled={retryingVoice !== null}
                                title={t.voiceProfiles.retrySyncMistral}
                                className="text-orange-500 hover:text-orange-600"
                              >
                                <ArrowsClockwise size={16} className={retryingVoice === profile.id ? 'animate-spin' : ''} />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => 
{
                                e.stopPropagation()
                                deleteProfile(profile.id)
                              }}
                              title={t.voiceProfiles.deleteProfile}
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowsClockwise size={20} />
              {t.appSettings.applicationTitle}
            </CardTitle>
            <CardDescription>
              {t.appSettings.applicationDesc}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleForceRefresh}
            >
              <ArrowsClockwise size={16} />
              {t.appSettings.clearCacheAndReload}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
