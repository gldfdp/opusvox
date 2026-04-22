export type Language = 'en' | 'fr'

export interface Translations {
  app: {
    title: string
    subtitle: string
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
  responses: {
    title: string
    customButton: string
    placeholder: string
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
  privacy: {
    title: string
    message: string
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
}

export const translations: Record<Language, Translations> = {
  en: {
    app: {
      title: 'VoiceConnect',
      subtitle: 'Communication assistant for enhanced conversation'
    },
    recording: {
      buttonStartLabel: 'Start recording',
      buttonStopLabel: 'Stop recording',
      statusIdle: 'Press the button to record',
      statusRecording: 'Recording... Release when done',
      statusProcessing: 'Processing your recording...',
      statusSpeaking: 'Speaking your response...',
      toastStarted: 'Recording started',
      toastPermissionDenied: 'Microphone access denied. Please enable microphone permissions.',
      toastSpeaking: 'Speaking response...',
      toastError: 'Speech synthesis failed',
      listenTitle: 'Listen to visitor'
    },
    responses: {
      title: 'Select your response',
      customButton: 'Write custom response',
      placeholder: 'Response suggestions will appear here'
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
    privacy: {
      title: 'Privacy Notice:',
      message: 'All conversations are stored locally on your device and encrypted. Your data never leaves your browser.'
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
    }
  },
  fr: {
    app: {
      title: 'VoiceConnect',
      subtitle: 'Assistant de communication pour conversations enrichies'
    },
    recording: {
      buttonStartLabel: 'Démarrer l\'enregistrement',
      buttonStopLabel: 'Arrêter l\'enregistrement',
      statusIdle: 'Appuyez sur le bouton pour enregistrer',
      statusRecording: 'Enregistrement... Relâchez pour terminer',
      statusProcessing: 'Traitement de votre enregistrement...',
      statusSpeaking: 'Énonciation de votre réponse...',
      toastStarted: 'Enregistrement démarré',
      toastPermissionDenied: 'Accès au microphone refusé. Veuillez activer les autorisations du microphone.',
      toastSpeaking: 'Énonciation de la réponse...',
      toastError: 'Échec de la synthèse vocale',
      listenTitle: 'Écouter le visiteur'
    },
    responses: {
      title: 'Sélectionnez votre réponse',
      customButton: 'Écrire une réponse personnalisée',
      placeholder: 'Les suggestions de réponse apparaîtront ici'
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
    privacy: {
      title: 'Avis de confidentialité :',
      message: 'Toutes les conversations sont stockées localement sur votre appareil et chiffrées. Vos données ne quittent jamais votre navigateur.'
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
    }
  }
}

export function getTranslations(language: Language): Translations {
  return translations[language]
}
