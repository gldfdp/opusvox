export async function transcribeAudio(
  audioBlob: Blob,
  language: string,
  apiKey?: string,
  /** File extension matching the actual recorder MIME type (webm, mp4, ogg…) */
  ext = 'webm'
): Promise<string> {
  if (!apiKey) {
    throw new Error('Mistral API key is required for transcription')
  }

  try {
    const mimeType = audioBlob.type || `audio/${ext}`
    const audioFile = new File([audioBlob], `recording.${ext}`, { type: mimeType })
    
    const formData = new FormData()
    formData.append('file', audioFile)
    formData.append('model', 'voxtral-mini-latest')
    formData.append('language', language)
    formData.append('response_format', 'json')

    const response = await fetch('https://api.mistral.ai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Mistral STT API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      throw new Error(`Mistral STT API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.text) {
      throw new Error('No transcription text in response')
    }

    return data.text.trim()
  } catch (error) {
    console.error('Transcription error:', error)
    throw error
  }
}

export function isTranscriptionAvailable(apiKey?: string): boolean {
  return !!apiKey && apiKey.trim().length > 0
}

export function getSimulatedTranscription(language: string): string {
  const transcriptions = language === 'fr' 
    ? [
        "Comment te sens-tu aujourd'hui ?",
        "Voudrais-tu de l'eau ?",
        "As-tu besoin de quelque chose maintenant ?",
        "Devrais-je ajuster la température de la pièce ?",
        "Es-tu confortable ?",
        "Voudrais-tu regarder la télévision ?",
        "Y a-t-il quelqu'un que tu voudrais que j'appelle ?",
        "Veux-tu que je t'aide avec quelque chose ?"
      ]
    : [
        "How are you feeling today?",
        "Would you like some water?",
        "Do you need anything right now?",
        "Should I adjust the temperature in the room?",
        "Are you comfortable?",
        "Would you like to watch TV?",
        "Is there anyone you'd like me to call?",
        "Do you want me to help you with something?"
      ]
  
  return transcriptions[Math.floor(Math.random() * transcriptions.length)]
}
