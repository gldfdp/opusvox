# Mistral Voice Profiles - Guide d'Utilisation

## Vue d'ensemble

Cette application utilise l'API Mistral pour gérer deux types de profils vocaux :

1. **Voix personnalisées** : Voix clonées à partir d'enregistrements audio de l'utilisateur
2. **Voix pré-définies** : Voix fournies par Mistral AI (atlas, celeste, koda)

## Architecture

### Types de profils vocaux

Le système supporte désormais deux types de profils via l'interface `VoiceProfile` :

```typescript
interface VoiceProfile {
  id: string
  name: string
  language: 'en' | 'fr'
  audioDataUrl?: string              // Pour les voix personnalisées
  createdAt: number
  duration?: number                  // Pour les voix personnalisées
  voiceType: 'custom' | 'mistral-preset'
  mistralVoiceId?: MistralVoiceId   // Pour les voix pré-définies
}

type MistralVoiceId = 'atlas' | 'celeste' | 'koda'
```

### Fonctionnement de la synthèse vocale

Le fichier `src/lib/tts.ts` contient la logique principale :

1. **Voix personnalisées** : Utilise le paramètre `ref_audio` de l'API Mistral avec le modèle `voxtral-mini-tts-2603`
2. **Voix pré-définies** : Utilise le paramètre `voice` avec l'ID de la voix choisie
3. **Fallback** : Si Mistral échoue ou n'est pas configuré, retombe sur la synthèse vocale du navigateur

### Endpoints de l'API Mistral

L'application utilise l'endpoint de synthèse vocale de Mistral :
```
POST https://api.mistral.ai/v1/audio/speech
```

#### Paramètres pour les voix personnalisées:
```json
{
  "model": "voxtral-mini-tts-2603",
  "input": "Texte à synthétiser",
  "ref_audio": "base64_encoded_audio",
  "speed": 0.9
}
```

#### Paramètres pour les voix pré-définies:
```json
{
  "model": "voxtral-mini-tts-2603",
  "input": "Texte à synthétiser",
  "voice": "atlas",
  "speed": 0.9
}
```

## Utilisation

### 1. Configuration de l'API Mistral

1. Allez dans **Paramètres** (bouton en haut à droite)
2. Section **API Mistral**
3. Entrez votre clé API Mistral
4. Cliquez sur **Tester la connexion**

### 2. Création d'un profil vocal personnalisé

1. Toujours dans **Paramètres**, section **Voix personnalisée**
2. Entrez un nom pour votre profil (ex: "Ma voix")
3. Deux options :
   - **Enregistrer** : Enregistrez 10 secondes d'audio en lisant le texte affiché
   - **Télécharger** : Importez un fichier audio existant (minimum 3 secondes)
4. Le profil est automatiquement activé après création

### 3. Test des voix

Dans la liste des profils vocaux sauvegardés :
- 🎵 **Icône Play** : Écoute l'enregistrement original
- 🌊 **Icône Waveform** : Teste la voix clonée via Mistral TTS
  - Génère un aperçu avec le texte : "Bonjour, je suis [Prénom]. Voici un aperçu de ma voix clonée."
  - Nécessite une clé API Mistral configurée

### 4. Utilisation dans l'application

Une fois un profil vocal sélectionné (badge "Actif"), toutes les réponses synthétisées utiliseront ce profil :
- Si une clé API Mistral est configurée → Utilise Mistral TTS avec la voix clonée
- Sinon → Utilise la voix système du navigateur

## Voix pré-définies Mistral (à implémenter)

Les voix suivantes sont disponibles via l'API Mistral :

- **atlas** : Voix par défaut équilibrée
- **celeste** : Voix féminine
- **koda** : Voix masculine

Pour ajouter la sélection de voix pré-définies, il faudrait :

1. Ajouter une interface dans `SettingsPage.tsx` pour sélectionner une voix pré-définie
2. Créer des profils avec `voiceType: 'mistral-preset'` et `mistralVoiceId` défini
3. Le système TTS détectera automatiquement le type et utilisera le bon paramètre API

## Détails techniques

### Gestion de la vitesse (speed)

Le paramètre `speed` est optionnel dans l'API Mistral :
- Si `speed === 1.0` : Le paramètre n'est pas envoyé (comportement par défaut)
- Sinon : Le paramètre est inclus dans la requête
- Plage valide : 0.5 à 2.0

### Format audio

- **Entrée** : Base64 encodé (webm/opus pour les enregistrements)
- **Sortie** : Blob audio (wav ou mp3 selon l'API)

### Stockage

Les profils vocaux sont stockés dans le KV store de Spark :
- Clé : `'voice-profiles'`
- Type : `VoiceProfile[]`
- Profil sélectionné : `'selected-voice-profile'` (ID du profil)

## Limitations actuelles

1. Les voix pré-définies ne sont pas encore exposées dans l'UI
2. Pas de sélection multi-voix (une seule voix active à la fois)
3. Les enregistrements sont limités à 10 secondes maximum
4. Le format d'audio est fixe (webm/opus)

## Évolutions possibles

1. **Sélecteur de voix pré-définies** :
   - Dropdown avec atlas/celeste/koda dans les paramètres
   - Aperçu de chaque voix avant sélection

2. **Gestion avancée** :
   - Import/export de profils vocaux
   - Édition du nom des profils
   - Catégorisation des profils (personnel, professionnel, etc.)

3. **Paramètres de qualité** :
   - Ajustement de la vitesse par profil
   - Contrôle du ton/pitch si supporté par l'API

4. **Gestion des quotas** :
   - Affichage de la consommation API
   - Alertes de quota

## Ressources

- [Documentation Mistral Audio API](https://docs.mistral.ai/studio-api/audio/text_to_speech/voices)
- [Mistral Console](https://console.mistral.ai)
