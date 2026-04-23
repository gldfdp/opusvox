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
      listenTitle: 'Listen to visitor'
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
      listenTitle: 'Écouter le visiteur'
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
    }
  }
}

export function getTranslations(language: Language): Translations {
  return translations[language]
}
