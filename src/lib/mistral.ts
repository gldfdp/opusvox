import { ResponseSuggestion, ConversationTurn, UserSettings } from './types'
import { Language } from './i18n'

interface MistralResponseContext {
  transcribedText: string
  language: Language
  conversationHistory: ConversationTurn[]
  apiKey?: string
  userSettings?: UserSettings
}

interface MistralMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export function detectLanguage(text: string): Language {
  const frenchWords = ['le', 'la', 'les', 'de', 'des', 'un', 'une', 'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'oui', 'non', 'bonjour', 'merci', 'est', 'suis', 'êtes', 'sont', 'comment', 'ça', 'va', 'bien', 'pas', 'avec', 'pour', 'dans', 'ce', 'cette', 'ces', 'quel', 'quelle', 'quoi', 'qui', 'où', 'quand', 'pourquoi']
  const englishWords = ['the', 'a', 'an', 'is', 'are', 'am', 'was', 'were', 'yes', 'no', 'hello', 'thank', 'you', 'i', 'we', 'they', 'he', 'she', 'how', 'what', 'where', 'when', 'why', 'who', 'with', 'for', 'in', 'this', 'that', 'these', 'those', 'good', 'bad', 'well', 'not']
  
  const lowerText = text.toLowerCase()
  const words = lowerText.split(/\s+/)
  
  let frenchScore = 0
  let englishScore = 0
  
  words.forEach(word => {
    if (frenchWords.includes(word)) frenchScore++
    if (englishWords.includes(word)) englishScore++
  })
  
  if (lowerText.match(/[àâäéèêëïîôùûüÿç]/)) {
    frenchScore += 3
  }
  
  return frenchScore > englishScore ? 'fr' : 'en'
}

export async function translateText(text: string, targetLanguage: Language, apiKey: string): Promise<string> {
  try {
    const systemMessage = targetLanguage === 'fr'
      ? `Tu es un traducteur professionnel. Traduis le texte suivant en français de manière naturelle et fluide. Retourne UNIQUEMENT la traduction, sans aucun texte supplémentaire.`
      : `You are a professional translator. Translate the following text into English in a natural and fluent way. Return ONLY the translation, without any additional text.`

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    })

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0].message.content.trim()
  } catch (error) {
    console.error('Translation error:', error)
    return text
  }
}

export async function generateResponseSuggestions(
  context: MistralResponseContext
): Promise<ResponseSuggestion[]> {
  const { transcribedText, language, conversationHistory, apiKey, userSettings } = context
  
  if (!apiKey) {
    console.warn('No Mistral API key provided, using fallback responses')
    return getFallbackResponses(transcribedText, language)
  }

  const userContextParts: string[] = []
  
  if (userSettings?.firstName) {
    const nameContext = language === 'fr' 
      ? `L'utilisateur s'appelle ${userSettings.firstName}${userSettings.lastName ? ` ${userSettings.lastName}` : ''}.`
      : `The user's name is ${userSettings.firstName}${userSettings.lastName ? ` ${userSettings.lastName}` : ''}.`
    userContextParts.push(nameContext)
  }
  
  if (userSettings?.age) {
    const ageContext = language === 'fr'
      ? `L'utilisateur a ${userSettings.age} ans.`
      : `The user is ${userSettings.age} years old.`
    userContextParts.push(ageContext)
  }
  
  if (userSettings?.preferredCommunicationStyle) {
    const styleMap: Record<string, { fr: string; en: string }> = {
      'formal': { fr: 'formel', en: 'formal' },
      'casual': { fr: 'décontracté', en: 'casual' },
      'professional': { fr: 'professionnel', en: 'professional' },
      'friendly': { fr: 'amical', en: 'friendly' }
    }
    const styleName = styleMap[userSettings.preferredCommunicationStyle]
    if (styleName) {
      const styleContext = language === 'fr'
        ? `Style de communication préféré : ${styleName.fr}. Adaptez le ton des réponses en conséquence.`
        : `Preferred communication style: ${styleName.en}. Adapt the tone of responses accordingly.`
      userContextParts.push(styleContext)
    }
  }
  
  if (userSettings?.medicalConditions) {
    const medicalContext = language === 'fr'
      ? `Conditions médicales : ${userSettings.medicalConditions}`
      : `Medical conditions: ${userSettings.medicalConditions}`
    userContextParts.push(medicalContext)
  }
  
  if (userSettings?.allergies) {
    const allergyContext = language === 'fr'
      ? `Allergies : ${userSettings.allergies}`
      : `Allergies: ${userSettings.allergies}`
    userContextParts.push(allergyContext)
  }
  
  if (userSettings?.specialNeeds) {
    const specialNeedsContext = language === 'fr'
      ? `Besoins spéciaux : ${userSettings.specialNeeds}`
      : `Special needs: ${userSettings.specialNeeds}`
    userContextParts.push(specialNeedsContext)
  }
  
  const userContext = userContextParts.length > 0 
    ? userContextParts.join('\n') + '\n\n'
    : ''

  const systemMessage = language === 'fr'
    ? `Vous êtes un assistant de communication pour une personne qui a perdu l'usage de la parole. Votre rôle est de générer des réponses appropriées et empathiques que l'utilisateur pourrait vouloir dire.

${userContext ? 'Informations sur l\'utilisateur :\n' + userContext : ''}Générez exactement 4 suggestions de réponse qui :
1. Sont adaptées au contexte de la conversation
2. Couvrent différentes intentions (affirmative, négative, neutre, et une alternative)
3. Sont naturelles et conversationnelles
4. Sont courtes et faciles à dire par synthèse vocale
5. Reflètent le ton et le contexte de la situation
6. Tiennent compte des informations personnelles de l'utilisateur (âge, style de communication, conditions médicales, etc.)

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

${userContext ? 'User information:\n' + userContext : ''}Generate exactly 4 response suggestions that:
1. Are appropriate to the conversation context
2. Cover different intents (affirmative, negative, neutral, and an alternative)
3. Are natural and conversational
4. Are short and easy to speak via text-to-speech
5. Reflect the tone and context of the situation
6. Take into account the user's personal information (age, communication style, medical conditions, etc.)

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
      const responses = parsed.responses.map((r: { id: string; text: string; intent: string }) => ({
        id: r.id || Math.random().toString(36).substring(7),
        text: r.text,
        intent: r.intent
      }))
      
      const detectedLang = detectLanguage(responses[0].text)
      
      if (detectedLang !== language) {
        const translatedResponses = await Promise.all(
          responses.map(async (response: ResponseSuggestion) => ({
            ...response,
            text: await translateText(response.text, language, apiKey)
          }))
        )
        return translatedResponses
      }
      
      return responses
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
