# OpusVox

**OpusVox** est une application web PWA d'aide à la communication pour les personnes ayant perdu l'usage de la parole. Elle permet de transcrire la voix du visiteur, de générer des suggestions de réponses contextuelles par IA, et de les synthétiser vocalement — avec la voix clonée de l'utilisateur si disponible.

---

## Fonctionnalités

- 🎙️ **Transcription vocale** — via l'API Mistral Speech-to-Text, ou mode simulation sans clé API
- 🤖 **Suggestions de réponses contextuelles** — générées par Mistral AI en tenant compte de l'historique de conversation
- 🔊 **Synthèse vocale** — via Mistral TTS avec clonage de voix, ou synthèse système native
- 🗣️ **Clonage de voix** — enregistrement d'un échantillon de 10 secondes ou import de fichier audio pour créer un profil vocal personnalisé
- 🌍 **Multilingue** — interface et TTS en français et en anglais, avec détection automatique de la langue du visiteur
- ⌨️ **Raccourcis clavier** — démarrage/arrêt de l'enregistrement par touche configurable (espace par défaut)
- 🔇 **Fin automatique** — l'enregistrement s'arrête automatiquement après 3 secondes de silence
- 📜 **Historique** — toutes les conversations sont sauvegardées localement et rejouables
- 📱 **PWA & Android** — installable sur mobile via Capacitor

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | React 18 + Vite |
| Langage | TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| Animations | Framer Motion |
| IA | Mistral AI (STT, LLM, TTS, clonage vocal) |
| Mobile | Capacitor (Android/iOS) |
| PWA | vite-plugin-pwa |
| Persistance | localStorage via hook `use-kv` |

---

## Structure du projet

```
src/
  App.tsx                   # Composant principal
  components/
    SettingsPage.tsx         # Paramètres (profil, API, profils vocaux, raccourcis)
    RecordingButton.tsx      # Bouton microphone
    ResponseSuggestions.tsx  # Suggestions de réponses IA
    ConversationHistory.tsx  # Historique des échanges
    VoiceIndicator.tsx       # Indicateur de voix active
    MistralStatusCard.tsx    # Statut connexion Mistral
    OnboardingPage.tsx       # Wizard de premier démarrage
    ...
  hooks/
    use-recording.ts         # Hook enregistrement + détection de silence
    use-kv.ts                # Persistance localStorage typée
    use-language.tsx         # Contexte i18n
  lib/
    i18n.ts                  # Traductions FR/EN (~130 clés)
    audio.ts                 # Utilitaires audio (WAV, trim, duration)
    constants.ts             # Constantes partagées (DEFAULT_USER_SETTINGS)
    types.ts                 # Types TypeScript partagés
    tts.ts                   # Synthèse vocale (Mistral TTS + Web Speech API)
    stt.ts                   # Transcription (Mistral STT)
    mistral.ts               # Génération de réponses Mistral
    media.ts                 # Détection format MediaRecorder
```

---

## Démarrage rapide

### Prérequis

- Node.js 18+
- Yarn

### Développement

```bash
yarn install
yarn dev
```

### Production (local)

```bash
yarn build
yarn preview
```

### Docker

```bash
docker-compose up -d
```

L'application est servie sur `http://localhost:80` via nginx.

---

## Configuration

Au premier lancement, un wizard d'onboarding guide l'utilisateur pour :

1. Choisir la langue de l'interface (FR / EN)
2. Renseigner son prénom et ses informations de profil
3. Saisir sa clé API Mistral (optionnel — l'app fonctionne en mode simulation sans clé)

La clé API Mistral est nécessaire pour :
- La transcription vocale réelle (STT)
- La génération de réponses par IA
- La synthèse vocale avec clonage (TTS)
- Le clonage de voix (plan payant Mistral requis)

---

## Linting & build

```bash
yarn build        # eslint + tsc + vite build
npx eslint --fix "src/**/*.{ts,tsx}"   # auto-correction du formatage
```

Règles ESLint actives : `curly: all`, `brace-style: allman`, `indent: 2`.

---

## Licence

Voir [LICENSE](./LICENSE).
