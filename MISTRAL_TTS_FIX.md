# Correction de l'erreur Mistral TTS

## Problème
L'appel à l'API Mistral TTS pour le clonage de voix retournait l'erreur :
```
"Input should be a valid dictionary or object to extract fields from"
```

## Cause
Le code envoyait les données en `FormData` avec un fichier blob, alors que l'API Mistral TTS attend un objet JSON avec le champ `voice_sample` contenant directement la chaîne base64 de l'audio.

## Solution

### Fichiers modifiés

#### 1. `/src/lib/tts.ts` (ligne 79-123)
**Avant :**
```typescript
const formData = new FormData()
formData.append('model', 'tts-1')
formData.append('input', options.text)
formData.append('speed', speed.toString())
formData.append('response_format', 'wav')

const audioBlob = await base64ToBlob(base64Audio)
formData.append('voice_sample', audioBlob, 'voice_sample.webm')

const clonedResponse = await fetch('https://api.mistral.ai/v1/audio/speech', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${options.apiKey}`
  },
  body: formData
})
```

**Après :**
```typescript
const requestBody = {
  model: 'tts-1',
  input: options.text,
  voice_sample: base64Audio,
  speed: speed,
  response_format: 'wav'
}

const clonedResponse = await fetch('https://api.mistral.ai/v1/audio/speech', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${options.apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestBody)
})
```

#### 2. `/src/components/VoiceCloning.tsx` (ligne 278-299)
**Avant :**
```typescript
const response = await fetch(`data:audio/webm;base64,${base64Audio}`)
const voiceBlob = await response.blob()

const formData = new FormData()
formData.append('model', 'tts-1')
formData.append('input', testText)
formData.append('voice_sample', voiceBlob, 'voice_sample.wav')
formData.append('speed', speed.toString())
formData.append('response_format', 'wav')

const ttsResponse = await fetch('https://api.mistral.ai/v1/audio/speech', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${currentUserSettings.mistralApiKey}`
  },
  body: formData
})
```

**Après :**
```typescript
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
```

## Changements clés
1. ✅ Remplacement de `FormData` par un objet JSON
2. ✅ Envoi direct de la chaîne base64 dans `voice_sample` au lieu d'un Blob
3. ✅ Ajout du header `Content-Type: application/json`
4. ✅ Utilisation de `JSON.stringify()` pour le body de la requête
5. ✅ Application de la correction dans les deux fichiers concernés (`tts.ts` et `VoiceCloning.tsx`)

## Test
Pour tester la correction :
1. Configurer une clé API Mistral dans les paramètres
2. Créer un profil vocal (enregistrer 10 secondes de voix)
3. Cliquer sur l'icône de forme d'onde pour tester la voix clonée
4. Ou sélectionner une réponse sur la page d'accueil avec un profil vocal actif

L'erreur ne devrait plus apparaître et l'audio devrait être généré avec succès.
