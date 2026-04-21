import { ResponseSuggestion, ConversationTurn } from './types'
import { Language } from './i18n'

interface MistralResponseContext {
  transcribedText: string
  language: Language
  conversationHistory: ConversationTurn[]
  apiKey?: string
}

interface MistralMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function generateResponseSuggestions(
  context: MistralResponseContext
): Promise<ResponseSuggestion[]> {
  const { transcribedText, language, conversationHistory, apiKey } = context
  
  if (!apiKey) {
    console.warn('No Mistral API key provided, using fallback responses')
    return getFallbackResponses(transcribedText, language)
  }

  const systemMessage = language === 'fr'
    ? `Vous êtes un assistant de communication pour une personne qui a perdu l'usage de la parole. Votre rôle est de générer des réponses appropriées et empathiques que l'utilisateur pourrait vouloir dire.

Générez exactement 4 suggestions de réponse qui :
1. Sont adaptées au contexte de la conversation
2. Couvrent différentes intentions (affirmative, négative, neutre, et une alternative)
3. Sont naturelles et conversationnelles
4. Sont courtes et faciles à dire par synthèse vocale
5. Reflètent le ton et le contexte de la situation

Retournez UNIQUEMENT un objet JSON valide avec la structure suivante (sans texte avant ou après) :
{
  "responses": [
    {"id": "1", "text": "...", "intent": "affirmative"},
    {"id": "2", "text": "...", "intent": "negative"},
    {"id": "3", "text": "...", "intent": "neutral"},
    {"id": "4", "text": "...", "intent": "alternative"}
  ]
}`
    : `You are a communication assistant for a person who has lost the ability to speak. Your role is to generate appropriate and empathetic responses that the user might want to say.

Generate exactly 4 response suggestions that:
1. Are appropriate to the conversation context
2. Cover different intents (affirmative, negative, neutral, and an alternative)
3. Are natural and conversational
4. Are short and easy to speak via text-to-speech
5. Reflect the tone and context of the situation

Return ONLY a valid JSON object with the following structure (no text before or after):
{
  "responses": [
    {"id": "1", "text": "...", "intent": "affirmative"},
    {"id": "2", "text": "...", "intent": "negative"},
    {"id": "3", "text": "...", "intent": "neutral"},
    {"id": "4", "text": "...", "intent": "alternative"}
  ]
}`

  const messages: MistralMessage[] = [
    {
      role: 'system',
      content: systemMessage
    }
  ]

  const recentHistory = conversationHistory.slice(-5)
  for (const turn of recentHistory) {
    messages.push({
      role: 'user',
      content: `Visitor's message: "${turn.visitorInput}"`
    })
    messages.push({
      role: 'assistant',
      content: JSON.stringify({
        responses: [
          { id: '1', text: turn.userResponse, intent: 'selected' }
        ]
      })
    })
  }

  messages.push({
    role: 'user',
    content: `Visitor's new message: "${transcribedText}"\n\nGenerate 4 response suggestions now.`
  })

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'mistral-medium-latest',
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Mistral API error:', response.status, errorText)
      throw new Error(`Mistral API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from Mistral API')
    }

    const content = data.choices[0].message.content
    const parsed = JSON.parse(content)
    
    if (parsed.responses && Array.isArray(parsed.responses)) {
      return parsed.responses.map((r: { id: string; text: string; intent: string }) => ({
        id: r.id || Math.random().toString(36).substring(7),
        text: r.text,
        intent: r.intent
      }))
    }
    
    throw new Error('Invalid response format from Mistral API')
  } catch (error) {
    console.error('Error generating responses with Mistral:', error)
    return getFallbackResponses(transcribedText, language)
  }
}

function getFallbackResponses(input: string, language: Language): ResponseSuggestion[] {
  const lowerInput = input.toLowerCase()
  
  if (language === 'fr') {
    const responseMap: Record<string, ResponseSuggestion[]> = {
      'comment': [
        { id: '1', text: "Je vais bien, merci de demander.", intent: 'positive' },
        { id: '2', text: "Un peu fatigué en ce moment.", intent: 'neutral' },
        { id: '3', text: "Pas très bien, j'aurais besoin d'aide.", intent: 'negative' },
        { id: '4', text: "Mieux qu'hier, merci.", intent: 'positive' }
      ],
      'eau': [
        { id: '1', text: "Oui s'il vous plaît, j'aimerais de l'eau.", intent: 'affirmative' },
        { id: '2', text: "Non merci, ça va pour le moment.", intent: 'negative' },
        { id: '3', text: "Peut-être dans un petit moment.", intent: 'neutral' },
        { id: '4', text: "Oui, mais juste un peu s'il vous plaît.", intent: 'affirmative' }
      ],
      'besoin': [
        { id: '1', text: "Ça va pour le moment, merci.", intent: 'negative' },
        { id: '2', text: "Oui, pourriez-vous m'aider à me repositionner?", intent: 'affirmative' },
        { id: '3', text: "J'ai besoin d'aller aux toilettes.", intent: 'urgent' },
        { id: '4', text: "Un médicament contre la douleur serait utile.", intent: 'request' }
      ],
      'default': [
        { id: '1', text: "Oui, ce serait bien.", intent: 'affirmative' },
        { id: '2', text: "Non merci.", intent: 'negative' },
        { id: '3', text: "Laissez-moi y réfléchir.", intent: 'neutral' },
        { id: '4', text: "Je vous remercie de me le demander.", intent: 'grateful' }
      ]
    }
    
    for (const [key, value] of Object.entries(responseMap)) {
      if (lowerInput.includes(key)) {
        return value
      }
    }
    return responseMap.default
  } else {
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
    
    for (const [key, value] of Object.entries(responseMap)) {
      if (lowerInput.includes(key)) {
        return value
      }
    }
    return responseMap.default
  }
}
