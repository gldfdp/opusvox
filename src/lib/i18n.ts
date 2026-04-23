export type Language = 'en' | 'fr'

export type VisitorLanguageCode = string

export interface Translations {
  app: {
    title: string
    subtitle: string
  }
  onboarding: {
    step1Title: string
    step1Subtitle: string
    step2Title: string
    step2Subtitle: string
    firstNameLabel: string
    firstNamePlaceholder: string
    lastNameLabel: string
    lastNamePlaceholder: string
    step3Title: string
    step3Subtitle: string
    mistralKeyLabel: string
    mistralKeyPlaceholder: string
    mistralKeyHint: string
    back: string
    next: string
    skip: string
    getStarted: string
    stepOf: (current: number, total: number) => string
  }
  recording: {
    buttonStartLabel: string
    buttonStopLabel: string
    statusIdle: string
    statusRecording: string
    statusProcessing: string
    statusSpeaking: string
    toastStarted: string
    toastPermissionDenied: string
    toastSpeaking: string
    toastError: string
    listenTitle: string
    toastTranscribing: string
    toastTranscriptionSuccess: string
    toastTranscriptionError: string
    toastSimulationMode: string
  }
  replay: {
    button: string
    tooltip: string
    toastNoResponse: string
    toastReplaying: string
  }
  responses: {
    title: string
    customButton: string
    placeholder: string
    getStarted: string
  }
  history: {
    title: string
    buttonLabel: string
    empty: string
    visitor: string
    you: string
    custom: string
    delete: string
    deleteConfirm: string
  }
  customDialog: {
    title: string
    description: string
    placeholder: string
    cancel: string
    send: string
    tip: string
  }
  transcribed: {
    label: string
  }
  language: {
    label: string
  }
  settings: {
    title: string
    button: string
  }
  translation: {
    autoTranslating: string
  }
  initiateConversation: {
    title: string
    placeholder: string
    button: string
    tooltip: string
  }
  visitorLanguage: {
    title: string
    description: string
  }
  appMisc: {
    audioRecordingNotAvailable: string
    errorGeneratingResponses: string
    errorLoadingSuggestions: string
    translatingText: string
    translatingResponse: string
    translating: string
    historyCleared: string
    newVersionAvailable: string
    updateNow: string
    clearAll: string
    change: string
    mistralTtsEnabled: string
    mistralSttEnabled: string
    simulationMode: string
    visitorsMessage: string
    dismiss: string
    legalNotice: string
    playingAudio: string
  }
  voiceIndicator: {
    mistralTts: string
    clonedVoice: string
    aiSpeechSynthesis: string
    personalizedVoice: string
  }
  mistralStatus: {
    checking: string
    notConfigured: string
    connectionError: string
    connected: string
    unknown: string
    now: string
    title: string
    connection: string
    configureApiKey: string
    usageLimits: string
    remainingRequests: string
    resetsIn: string
    connectedNoLimits: string
    transcriptionStt: string
    speechSynthesisTts: string
    responseGeneration: string
    active: string
    simulated: string
    offline: string
  }
  responseSuggestions: {
    loading: string
    loadMore: string
  }
  visitorSelector: {
    searchPlaceholder: string
  }
  appSettings: {
    subtitle: string
    close: string
    interfaceLanguageTitle: string
    interfaceLanguageDesc: string
    interfaceLanguageHint: string
    applicationTitle: string
    applicationDesc: string
    clearCacheAndReload: string
    clearingCache: string
  }
  userProfile: {
    title: string
    description: string
    firstName: string
    firstNamePlaceholder: string
    lastName: string
    lastNamePlaceholder: string
    age: string
    agePlaceholder: string
    communicationStyle: string
    communicationStyleHint: string
    selectStyle: string
    formal: string
    casual: string
    professional: string
    friendly: string
    medicalConditions: string
    medicalConditionsPlaceholder: string
    allergies: string
    allergiesPlaceholder: string
    specialNeeds: string
    specialNeedsPlaceholder: string
    save: string
    saved: string
    defaultFirstName: string
    sampleText: (name: string) => string
  }
  shortcuts: {
    title: string
    description: string
    responseLabel: string
    hint: string
    recordingStartKey: string
    recordingStartKeyDesc: string
    spaceKey: string
    clickThenPress: string
    clickThenPressTitle: string
  }
  mistralApi: {
    title: string
    description: string
    connected: string
    connectedAlert: string
    noApiKeyAlert: string
    keyLabel: string
    getKeyHint: string
    contextTurnsLabel: string
    contextTurnsDesc: string
    disconnect: string
    testing: string
    testConnection: string
    enterApiKey: string
    connectionSuccessful: string
    connectionFailed: string
    disconnected: string
  }
  voiceProfiles: {
    title: string
    description: string
    nameLabel: string
    namePlaceholder: string
    textToRead: string
    readThisText: string
    record: string
    upload: string
    recordingInProgress: string
    finish: string
    cancel: string
    processing: string
    profileCreated: string
    recordingError: string
    tryAgain: string
    uploading: string
    savedProfiles: string
    active: string
    paidPlanRequired: string
    notSynced: string
    stopPlayback: string
    playOriginal: string
    testClonedVoice: string
    retrySyncMistral: string
    deleteProfile: string
    noAudioRecorded: string
    selectAudioFile: string
    enterVoiceName: string
    registeringVoice: string
    uploadError: string
    deleted: string
    syncedMistral: string
    syncFailed: string
    syncError: string
    audioPlaybackError: string
    playingPreview: string
    recordingStarted: string
    microphoneError: string
    recordingTooShort: string
    profileCreatedNamed: (name: string) => string
    audioTooShort: string
    fileTooLong: string
    defaultSystemVoice: string
    testVoiceNoKey: string
    testText: (name: string) => string
    generatingVoicePreview: string
    voiceTestError: string
  }
}

export const translations: Record<Language, Translations> = {
  en: {
    app: {
      title: 'OpusVox',
      subtitle: 'Communication assistant'
    },
    onboarding: {
      step1Title: 'Welcome to OpusVox',
      step1Subtitle: 'Choose the language of the interface.',
      step2Title: 'Tell us about you',
      step2Subtitle: 'This information helps OpusVox personalise your experience.',
      firstNameLabel: 'First name',
      firstNamePlaceholder: 'Your first name',
      lastNameLabel: 'Last name (optional)',
      lastNamePlaceholder: 'Your last name',
      step3Title: 'Connect Mistral AI',
      step3Subtitle: 'Add your Mistral API key to enable real speech-to-text and AI responses. You can skip this step and configure it later in Settings.',
      mistralKeyLabel: 'Mistral API key',
      mistralKeyPlaceholder: 'Enter your Mistral API key…',
      mistralKeyHint: 'Get a free key at console.mistral.ai',
      back: 'Back',
      next: 'Next',
      skip: 'Skip for now',
      getStarted: 'Get started',
      stepOf: (c, t) => `Step ${c} of ${t}`,
    },
    recording: {
      buttonStartLabel: 'Start recording',
      buttonStopLabel: 'Stop recording',
      statusIdle: 'Press the button to record',
      statusRecording: 'Recording... Repress when done',
      statusProcessing: 'Processing your recording...',
      statusSpeaking: 'Speaking your response...',
      toastStarted: 'Recording started',
      toastPermissionDenied: 'Microphone access denied. Please enable microphone permissions.',
      toastSpeaking: 'Speaking response...',
      toastError: 'Speech synthesis failed',
      listenTitle: 'Listen to visitor',
      toastTranscribing: 'Transcribing with Mistral API...',
      toastTranscriptionSuccess: 'Transcription successful!',
      toastTranscriptionError: 'Transcription error — using simulated mode',
      toastSimulationMode: 'Simulation mode (configure Mistral API in settings for real transcription)'
    },
    replay: {
      button: 'Replay last response',
      tooltip: 'Repeat the last spoken response',
      toastNoResponse: 'No response to replay',
      toastReplaying: 'Replaying last response...'
    },
    responses: {
      title: 'Select your response',
      customButton: 'Write custom response',
      placeholder: 'Response suggestions will appear here',
      getStarted: 'Record a visitor\'s message to get started'
    },
    history: {
      title: 'Conversation History',
      buttonLabel: 'History',
      empty: 'No conversation history yet. Start recording to begin.',
      visitor: 'Visitor',
      you: 'You',
      custom: 'Custom',
      delete: 'Delete',
      deleteConfirm: 'Conversation deleted'
    },
    customDialog: {
      title: 'Write your response',
      description: 'Type your custom message and press Send when ready.',
      placeholder: 'Type your message here...',
      cancel: 'Cancel',
      send: 'Send Response',
      tip: 'Tip: Press Cmd+Enter (Mac) or Ctrl+Enter (Windows) to send'
    },
    transcribed: {
      label: 'Visitor said:'
    },
    language: {
      label: 'Language'
    },
    settings: {
      title: 'Settings',
      button: 'Settings'
    },
    translation: {
      autoTranslating: 'Auto-translating responses to English...'
    },
    initiateConversation: {
      title: 'Or type to start a conversation',
      placeholder: 'Type your message here...',
      button: 'Speak to my visitor',
      tooltip: 'Type a custom message to initiate the conversation'
    },
    visitorLanguage: {
      title: 'Visitor language',
      description: 'Select the language your visitor will speak in'
    },
    appMisc: {
      audioRecordingNotAvailable: 'Audio recording is not available on this device.',
      errorGeneratingResponses: 'Error generating responses',
      errorLoadingSuggestions: 'Error loading more suggestions',
      translatingText: 'Translating text...',
      translatingResponse: 'Translating response...',
      translating: 'Translating...',
      historyCleared: 'History cleared',
      newVersionAvailable: '🔄 New version available',
      updateNow: 'Update now',
      clearAll: 'Clear all',
      change: 'Change',
      mistralTtsEnabled: 'Mistral TTS enabled',
      mistralSttEnabled: 'Mistral STT enabled',
      simulationMode: 'Simulation mode',
      visitorsMessage: "Visitor's message",
      dismiss: 'Dismiss — no response needed',
      legalNotice: 'Legal Notice',
      playingAudio: 'Playing audio...'
    },
    voiceIndicator: {
      mistralTts: 'Mistral TTS',
      clonedVoice: 'Cloned Voice',
      aiSpeechSynthesis: 'AI speech synthesis',
      personalizedVoice: 'Personalized voice'
    },
    mistralStatus: {
      checking: 'Checking...',
      notConfigured: 'Not configured',
      connectionError: 'Connection error',
      connected: 'Connected',
      unknown: 'Unknown',
      now: 'Now',
      title: 'Mistral API Status',
      connection: 'Connection',
      configureApiKey: 'Configure your Mistral API key to enable advanced transcription and speech synthesis.',
      usageLimits: 'Usage Limits',
      remainingRequests: 'Remaining requests',
      resetsIn: 'Resets in',
      connectedNoLimits: 'API connected successfully. Usage limit information not available.',
      transcriptionStt: 'Transcription (STT)',
      speechSynthesisTts: 'Speech Synthesis (TTS)',
      responseGeneration: 'Response Generation',
      active: 'Active',
      simulated: 'Simulated',
      offline: 'Offline'
    },
    responseSuggestions: {
      loading: 'Loading…',
      loadMore: 'Load more suggestions'
    },
    visitorSelector: {
      searchPlaceholder: 'Search for a language...'
    },
    appSettings: {
      subtitle: 'Configure your profile and preferences',
      close: 'Close',
      interfaceLanguageTitle: 'Interface Language',
      interfaceLanguageDesc: 'Select the application language',
      interfaceLanguageHint: 'This will affect the entire interface and generated responses',
      applicationTitle: 'Application',
      applicationDesc: 'Force a full reload without cache if something seems broken',
      clearCacheAndReload: 'Clear cache and reload',
      clearingCache: 'Clearing cache…'
    },
    userProfile: {
      title: 'User Profile',
      description: 'Personal information to personalize your experience',
      firstName: 'First Name',
      firstNamePlaceholder: 'Enter your first name',
      lastName: 'Last Name',
      lastNamePlaceholder: 'Enter your last name',
      age: 'Age',
      agePlaceholder: 'Enter your age',
      communicationStyle: 'Preferred Communication Style',
      communicationStyleHint: 'This will influence the tone of generated response suggestions',
      selectStyle: 'Select a style',
      formal: 'Formal',
      casual: 'Casual',
      professional: 'Professional',
      friendly: 'Friendly',
      medicalConditions: 'Medical Conditions',
      medicalConditionsPlaceholder: 'Enter any medical conditions relevant to conversations...',
      allergies: 'Allergies',
      allergiesPlaceholder: 'List your allergies (food, medications, etc.)...',
      specialNeeds: 'Special Needs',
      specialNeedsPlaceholder: 'Any additional information useful for communication...',
      save: 'Save Profile',
      saved: 'Profile saved',
      defaultFirstName: 'John',
      sampleText: (name: string) => `Hello, my name is ${name}. I use this application to communicate with my loved ones. This technology allows me to keep my voice and continue expressing myself.`
    },
    shortcuts: {
      title: 'Keyboard Shortcuts',
      description: 'Configure keys to quickly select suggested responses',
      responseLabel: 'Response',
      hint: 'Use these keys to quickly select response suggestions on the main page.',
      recordingStartKey: 'Recording start key',
      recordingStartKeyDesc: 'Press this key (outside input fields) to start / stop recording.',
      spaceKey: 'Space',
      clickThenPress: 'Click then press',
      clickThenPressTitle: 'Click this field then press the desired key'
    },
    mistralApi: {
      title: 'Mistral API',
      description: 'Connect your Mistral account for advanced AI tasks',
      connected: 'Connected',
      connectedAlert: 'Your Mistral API key is configured and active',
      noApiKeyAlert: 'No API key configured. Response suggestions use the default Spark API.',
      keyLabel: 'Mistral API Key',
      getKeyHint: 'Get your API key from console.mistral.ai',
      contextTurnsLabel: 'Exchanges sent to Mistral for context',
      contextTurnsDesc: 'Number of recent exchanges included in each request (1–100)',
      disconnect: 'Disconnect',
      testing: 'Testing...',
      testConnection: 'Test Connection',
      enterApiKey: 'Please enter an API key',
      connectionSuccessful: 'Mistral connection successful!',
      connectionFailed: 'Mistral connection failed',
      disconnected: 'Mistral disconnected'
    },
    voiceProfiles: {
      title: 'Voice Cloning',
      description: 'Record or upload a sample of your voice',
      nameLabel: 'Voice Profile Name',
      namePlaceholder: 'Ex: My Voice',
      textToRead: '📝 Text to read:',
      readThisText: '📝 Read this text:',
      record: 'Record',
      upload: 'Upload',
      recordingInProgress: 'Recording in progress...',
      finish: 'Finish',
      cancel: 'Cancel',
      processing: 'Processing recording...',
      profileCreated: 'Voice profile created!',
      recordingError: 'Recording error',
      tryAgain: 'Try Again',
      uploading: 'Uploading...',
      savedProfiles: 'Saved Voice Profiles',
      active: 'Active',
      paidPlanRequired: 'Paid plan required',
      notSynced: 'Not synced',
      stopPlayback: 'Stop playback',
      playOriginal: 'Play original recording',
      testClonedVoice: 'Test cloned voice with Mistral TTS',
      retrySyncMistral: 'Retry Mistral sync',
      deleteProfile: 'Delete profile',
      noAudioRecorded: 'No audio recorded',
      selectAudioFile: 'Please select an audio file',
      enterVoiceName: 'Please enter a name for the voice profile',
      registeringVoice: 'Registering voice with Mistral...',
      uploadError: 'Upload error',
      deleted: 'Voice profile deleted',
      syncedMistral: 'Voice synced with Mistral',
      syncFailed: 'Failed to sync with Mistral',
      syncError: 'Mistral API error',
      audioPlaybackError: 'Audio playback error',
      playingPreview: 'Playing voice preview',
      recordingStarted: 'Recording started - read the displayed text',
      microphoneError: 'Could not access microphone',
      recordingTooShort: 'Recording too short (minimum 3 seconds)',
      profileCreatedNamed: (name: string) => `Voice profile "${name}" created successfully`,
      audioTooShort: 'Audio too short (minimum 3 seconds)',
      fileTooLong: 'File too long — extracting middle 30 seconds…',
      defaultSystemVoice: 'Default system voice activated',
      testVoiceNoKey: 'Please configure your Mistral API key in settings to test the voice',
      testText: (name: string) => `Hello, I am ${name}. This is a preview of my cloned voice.`,
      generatingVoicePreview: 'Generating voice preview...',
      voiceTestError: 'Error testing voice. Check your Mistral API key.'
    }
  },
  fr: {
    app: {
      title: 'OpusVox',
      subtitle: 'Assistant de communication'
    },
    onboarding: {
      step1Title: 'Bienvenue sur OpusVox',
      step1Subtitle: "Choisissez la langue de l'interface.",
      step2Title: 'Parlez-nous de vous',
      step2Subtitle: 'Ces informations aident OpusVox à personnaliser votre expérience.',
      firstNameLabel: 'Prénom',
      firstNamePlaceholder: 'Votre prénom',
      lastNameLabel: 'Nom (facultatif)',
      lastNamePlaceholder: 'Votre nom',
      step3Title: 'Connecter Mistral AI',
      step3Subtitle: "Ajoutez votre clé API Mistral pour activer la transcription vocale et les réponses IA. Vous pouvez ignorer cette étape et la configurer plus tard dans les Paramètres.",
      mistralKeyLabel: 'Clé API Mistral',
      mistralKeyPlaceholder: 'Entrez votre clé API Mistral…',
      mistralKeyHint: 'Obtenez une clé gratuite sur console.mistral.ai',
      back: 'Retour',
      next: 'Suivant',
      skip: "Ignorer pour l'instant",
      getStarted: 'Commencer',
      stepOf: (c, t) => `Étape ${c} sur ${t}`,
    },
    recording: {
      buttonStartLabel: 'Démarrer l\'enregistrement',
      buttonStopLabel: 'Arrêter l\'enregistrement',
      statusIdle: 'Appuyez sur le bouton pour enregistrer',
      statusRecording: 'Enregistrement... Réappuyez pour terminer',
      statusProcessing: 'Traitement de votre enregistrement...',
      statusSpeaking: 'Énonciation de votre réponse...',
      toastStarted: 'Enregistrement démarré',
      toastPermissionDenied: 'Accès au microphone refusé. Veuillez activer les autorisations du microphone.',
      toastSpeaking: 'Énonciation de la réponse...',
      toastError: 'Échec de la synthèse vocale',
      listenTitle: 'Écouter le visiteur',
      toastTranscribing: 'Transcription avec Mistral API...',
      toastTranscriptionSuccess: 'Transcription réussie !',
      toastTranscriptionError: 'Erreur de transcription — utilisation du mode simulé',
      toastSimulationMode: 'Mode simulation (configurez Mistral API dans les paramètres pour une vraie transcription)'
    },
    replay: {
      button: 'Rejouer la dernière réponse',
      tooltip: 'Répéter la dernière réponse prononcée',
      toastNoResponse: 'Aucune réponse à rejouer',
      toastReplaying: 'Lecture de la dernière réponse...'
    },
    responses: {
      title: 'Sélectionnez votre réponse',
      customButton: 'Écrire une réponse personnalisée',
      placeholder: 'Les suggestions de réponse apparaîtront ici',
      getStarted: 'Enregistrez un message du visiteur pour commencer'
    },
    history: {
      title: 'Historique des conversations',
      buttonLabel: 'Historique',
      empty: 'Aucun historique de conversation pour le moment. Commencez un enregistrement pour débuter.',
      visitor: 'Visiteur',
      you: 'Vous',
      custom: 'Personnalisé',
      delete: 'Supprimer',
      deleteConfirm: 'Conversation supprimée'
    },
    customDialog: {
      title: 'Écrivez votre réponse',
      description: 'Tapez votre message personnalisé et appuyez sur Envoyer quand vous êtes prêt.',
      placeholder: 'Tapez votre message ici...',
      cancel: 'Annuler',
      send: 'Envoyer la réponse',
      tip: 'Astuce : Appuyez sur Cmd+Entrée (Mac) ou Ctrl+Entrée (Windows) pour envoyer'
    },
    transcribed: {
      label: 'Le visiteur a dit :'
    },
    language: {
      label: 'Langue'
    },
    settings: {
      title: 'Paramètres',
      button: 'Paramètres'
    },
    translation: {
      autoTranslating: 'Traduction automatique des réponses en français...'
    },
    initiateConversation: {
      title: 'Ou tapez pour initier une conversation',
      placeholder: 'Tapez votre message ici...',
      button: 'Dicter à mon interlocuteur',
      tooltip: 'Tapez un message personnalisé pour initier la conversation'
    },
    visitorLanguage: {
      title: 'Langue du visiteur',
      description: 'Sélectionnez la langue dans laquelle votre visiteur parlera'
    },
    appMisc: {
      audioRecordingNotAvailable: "L'enregistrement audio n'est pas disponible sur cet appareil.",
      errorGeneratingResponses: 'Erreur lors de la génération des réponses',
      errorLoadingSuggestions: 'Erreur lors du chargement des suggestions',
      translatingText: 'Traduction du texte en cours...',
      translatingResponse: 'Traduction de la réponse en cours...',
      translating: 'Traduction en cours...',
      historyCleared: 'Historique effacé',
      newVersionAvailable: '🔄 Nouvelle version disponible',
      updateNow: 'Mettre à jour',
      clearAll: 'Tout effacer',
      change: 'Changer',
      mistralTtsEnabled: 'Mistral TTS activé',
      mistralSttEnabled: 'Mistral STT activé',
      simulationMode: 'Mode simulation',
      visitorsMessage: 'Ce que dit votre interlocuteur',
      dismiss: 'Ignorer — pas de réponse nécessaire',
      legalNotice: 'Mentions légales',
      playingAudio: 'Lecture en cours...'
    },
    voiceIndicator: {
      mistralTts: 'Mistral TTS',
      clonedVoice: 'Voix clonée',
      aiSpeechSynthesis: 'Synthèse vocale IA',
      personalizedVoice: 'Voix personnalisée'
    },
    mistralStatus: {
      checking: 'Vérification...',
      notConfigured: 'Non configurée',
      connectionError: 'Erreur de connexion',
      connected: 'Connectée',
      unknown: 'Inconnue',
      now: 'Maintenant',
      title: 'Statut Mistral API',
      connection: 'Connexion',
      configureApiKey: 'Configurez votre clé API Mistral pour activer la transcription et la synthèse vocale avancées.',
      usageLimits: "Limites d'utilisation",
      remainingRequests: 'Requêtes restantes',
      resetsIn: 'Réinitialisation dans',
      connectedNoLimits: "API connectée avec succès. Les informations de limite d'utilisation ne sont pas disponibles.",
      transcriptionStt: 'Transcription (STT)',
      speechSynthesisTts: 'Synthèse vocale (TTS)',
      responseGeneration: 'Génération de réponses',
      active: 'Actif',
      simulated: 'Simulé',
      offline: 'Hors-ligne'
    },
    responseSuggestions: {
      loading: 'Chargement…',
      loadMore: "Voir d'autres suggestions"
    },
    visitorSelector: {
      searchPlaceholder: 'Rechercher une langue...'
    },
    appSettings: {
      subtitle: 'Configurez votre profil et vos préférences',
      close: 'Fermer',
      interfaceLanguageTitle: "Langue de l'interface",
      interfaceLanguageDesc: "Sélectionnez la langue de l'application",
      interfaceLanguageHint: "Cela affectera toute l'interface et les réponses générées",
      applicationTitle: 'Application',
      applicationDesc: 'Forcer le rechargement complet sans cache en cas de problème',
      clearCacheAndReload: 'Vider le cache et recharger',
      clearingCache: 'Vidage du cache en cours…'
    },
    userProfile: {
      title: 'Profil utilisateur',
      description: 'Informations personnelles pour personnaliser votre expérience',
      firstName: 'Prénom',
      firstNamePlaceholder: 'Entrez votre prénom',
      lastName: 'Nom',
      lastNamePlaceholder: 'Entrez votre nom',
      age: 'Âge',
      agePlaceholder: 'Entrez votre âge',
      communicationStyle: 'Style de communication préféré',
      communicationStyleHint: 'Cela influencera le ton des suggestions de réponses générées',
      selectStyle: 'Sélectionnez un style',
      formal: 'Formel',
      casual: 'Décontracté',
      professional: 'Professionnel',
      friendly: 'Amical',
      medicalConditions: 'Conditions médicales',
      medicalConditionsPlaceholder: 'Entrez toute condition médicale pertinente pour les conversations...',
      allergies: 'Allergies',
      allergiesPlaceholder: 'Listez vos allergies (nourriture, médicaments, etc.)...',
      specialNeeds: 'Besoins spéciaux',
      specialNeedsPlaceholder: 'Toute information supplémentaire utile pour la communication...',
      save: 'Enregistrer le profil',
      saved: 'Profil enregistré',
      defaultFirstName: 'Marie',
      sampleText: (name: string) => `Bonjour, je m'appelle ${name}. J'utilise cette application pour communiquer avec mes proches. Cette technologie me permet de garder ma voix et de continuer à m'exprimer.`
    },
    shortcuts: {
      title: 'Raccourcis clavier',
      description: 'Configurez les touches pour sélectionner rapidement les réponses suggérées',
      responseLabel: 'Réponse',
      hint: 'Utilisez ces touches pour sélectionner rapidement les suggestions de réponses sur la page principale.',
      recordingStartKey: "Touche de démarrage de l'enregistrement",
      recordingStartKeyDesc: "Appuyez sur cette touche (hors champ de saisie) pour démarrer / arrêter l'enregistrement.",
      spaceKey: 'Espace',
      clickThenPress: 'Cliquez puis appuyez',
      clickThenPressTitle: 'Cliquez sur ce champ puis appuyez sur la touche souhaitée'
    },
    mistralApi: {
      title: 'Mistral API',
      description: "Connectez votre compte Mistral pour les tâches d'IA avancées",
      connected: 'Connecté',
      connectedAlert: 'Votre clé API Mistral est configurée et active',
      noApiKeyAlert: "Aucune clé API configurée. Les suggestions de réponses utilisent l'API Spark par défaut.",
      keyLabel: 'Clé API Mistral',
      getKeyHint: 'Obtenez votre clé API sur console.mistral.ai',
      contextTurnsLabel: 'Échanges envoyés à Mistral pour le contexte',
      contextTurnsDesc: 'Nombre de derniers échanges inclus dans chaque requête (1–100)',
      disconnect: 'Déconnecter',
      testing: 'Test en cours...',
      testConnection: 'Tester la connexion',
      enterApiKey: 'Veuillez entrer une clé API',
      connectionSuccessful: 'Connexion Mistral réussie !',
      connectionFailed: 'Échec de la connexion Mistral',
      disconnected: 'Mistral déconnecté'
    },
    voiceProfiles: {
      title: 'Voix personnalisée',
      description: 'Enregistrez ou téléchargez un échantillon de votre voix',
      nameLabel: 'Nom du profil vocal',
      namePlaceholder: 'Ex: Ma voix',
      textToRead: '📝 Texte à lire :',
      readThisText: '📝 Lisez ce texte :',
      record: 'Enregistrer',
      upload: 'Télécharger',
      recordingInProgress: 'Enregistrement en cours...',
      finish: 'Terminer',
      cancel: 'Annuler',
      processing: "Traitement de l'enregistrement...",
      profileCreated: 'Profil vocal créé !',
      recordingError: "Erreur d'enregistrement",
      tryAgain: 'Réessayer',
      uploading: 'Téléchargement en cours...',
      savedProfiles: 'Profils vocaux enregistrés',
      active: 'Actif',
      paidPlanRequired: 'Plan payant requis',
      notSynced: 'Non sync. Mistral',
      stopPlayback: 'Arrêter la lecture',
      playOriginal: "Écouter l'enregistrement original",
      testClonedVoice: 'Tester la voix clonée avec Mistral TTS',
      retrySyncMistral: 'Réessayer la synchronisation avec Mistral',
      deleteProfile: 'Supprimer le profil',
      noAudioRecorded: 'Aucun audio enregistré',
      selectAudioFile: 'Veuillez sélectionner un fichier audio',
      enterVoiceName: 'Veuillez entrer un nom pour le profil vocal',
      registeringVoice: 'Enregistrement de la voix chez Mistral...',
      uploadError: 'Erreur lors du téléchargement',
      deleted: 'Profil vocal supprimé',
      syncedMistral: 'Voix synchronisée avec Mistral',
      syncFailed: 'Échec de la synchronisation avec Mistral',
      syncError: 'Erreur Mistral API',
      audioPlaybackError: 'Erreur de lecture audio',
      playingPreview: "Lecture de l'aperçu vocal",
      recordingStarted: 'Enregistrement démarré - lisez le texte affiché',
      microphoneError: "Impossible d'accéder au microphone",
      recordingTooShort: 'Enregistrement trop court (minimum 3 secondes)',
      profileCreatedNamed: (name: string) => `Profil vocal "${name}" créé avec succès`,
      audioTooShort: 'Audio trop court (minimum 3 secondes)',
      fileTooLong: 'Fichier trop long — extraction des 30 secondes centrales…',
      defaultSystemVoice: 'Voix système par défaut activée',
      testVoiceNoKey: 'Veuillez configurer votre clé API Mistral dans les paramètres pour tester la voix',
      testText: (name: string) => `Bonjour, je suis ${name}. Voici un aperçu de ma voix clonée.`,
      generatingVoicePreview: "Génération de l'aperçu vocal...",
      voiceTestError: 'Erreur lors du test de la voix. Vérifiez votre clé API Mistral.'
    }
  }
}

export function getTranslations(language: Language): Translations 
{
  return translations[language]
}
