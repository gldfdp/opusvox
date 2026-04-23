# PRD — OpusVox

## Vision

OpusVox est une application web PWA d'aide à la communication pour les personnes ayant perdu l'usage de la parole (ALS, AVC, trachéotomie, etc.). Elle permet de capturer la voix du visiteur, de générer des suggestions de réponses contextuelles par IA, et de les synthétiser avec la voix clonée de l'utilisateur.

**Qualités d'expérience :**
1. **Empowering** — L'interface renforce l'autonomie de l'utilisateur à chaque interaction.
2. **Responsive** — Transitions immédiates ; tout délai brise le rythme naturel de la conversation.
3. **Trustworthy** — Confidentialité, fiabilité et hiérarchie visuelle claire. Les données restent locales.

---

## État actuel de l'application

### Architecture

| Couche | Technologie |
|--------|-------------|
| Framework | React 18 + Vite |
| Langage | TypeScript strict |
| UI | shadcn/ui + Tailwind CSS |
| Animations | Framer Motion |
| IA | Mistral AI (STT, LLM, TTS, clonage vocal) |
| Mobile | Capacitor (Android/iOS) |
| PWA | vite-plugin-pwa |
| Persistance | localStorage via hook `use-kv` |

### Structure des fichiers

```
src/
  App.tsx                       # Composant principal (~690 lignes)
  components/
    SettingsPage.tsx             # Paramètres complets (~1 280 lignes)
    RecordingButton.tsx          # Bouton microphone animé
    ResponseSuggestions.tsx      # Suggestions de réponses IA
    ConversationHistory.tsx      # Historique des échanges
    VoiceIndicator.tsx           # Indicateur voix active
    VoiceCloning.tsx             # Clonage vocal (dialog)
    MistralStatusCard.tsx        # Statut connexion Mistral
    MentionsLegales.tsx          # Page mentions légales
    OnboardingPage.tsx           # Wizard premier démarrage (3 étapes)
    TextInitiator.tsx            # Zone de saisie manuelle
    VisitorLanguageSelector.tsx  # Sélecteur langue visiteur
    LanguageSwitcher.tsx         # Sélecteur langue interface
    CustomResponseDialog.tsx     # Dialog réponse personnalisée
  hooks/
    use-recording.ts             # Enregistrement + détection de silence
    use-kv.ts                    # Persistance localStorage typée
    use-language.tsx             # Contexte i18n
  lib/
    i18n.ts                      # Traductions FR/EN (~130 clés, 15 sections)
    audio.ts                     # Utilitaires audio (WAV encode, trim, duration)
    constants.ts                 # DEFAULT_USER_SETTINGS partagé
    types.ts                     # Types TypeScript partagés
    tts.ts                       # Synthèse vocale (Mistral TTS + Web Speech API)
    stt.ts                       # Transcription (Mistral STT)
    mistral.ts                   # Génération de réponses Mistral
    media.ts                     # Détection format MediaRecorder
  mobile/
    app-lifecycle.ts             # Lifecycle Android (back button, background)
```

---

## Fonctionnalités implémentées

### 1. Onboarding
- Wizard 3 étapes : choix de langue → profil utilisateur → clé API Mistral
- Skippable à chaque étape
- Données sauvegardées en localStorage

### 2. Enregistrement vocal visiteur
- Bouton microphone + raccourci clavier configurable (espace par défaut)
- Détection de silence automatique : 3 secondes de silence → arrêt automatique
- Suppression du blanc de fin avant envoi à l'API
- Gestion du cas « enregistrement en arrière-plan » (Android)
- Mode simulation si pas de clé API

### 3. Transcription (STT)
- Mistral `voix-large-v3` si clé API configurée
- Fallback vers transcription simulée
- Détection automatique de la langue visiteur

### 4. Traduction
- Traduction automatique visiteur→interface si langues différentes
- Traduction de la réponse interface→visiteur avant synthèse

### 5. Suggestions de réponses
- Génération par `mistral-medium` avec historique de conversation (configurable, défaut 20 tours)
- 4 suggestions couvrant différentes intentions
- Bouton « Charger plus »
- Réponse personnalisée via dialog

### 6. Synthèse vocale (TTS)
- Mistral TTS (`mistral-tts-1`) avec voix clonée si profil vocal sélectionné
- Fallback Web Speech API
- Contrôles : rate 0.9, pitch 1, volume 1

### 7. Clonage de voix
- Enregistrement 10 secondes de l'utilisateur avec texte guide
- Import fichier audio (>30s → extraction des 30s centrales)
- Durée minimum : 3 secondes
- Envoi à `POST /v1/audio/voices` Mistral (plan payant requis)
- Statuts : synced / plan_required / error + bouton retry
- Prévisualisation de l'échantillon + test TTS avec la voix clonée
- Suppression synchronisée (local + Mistral)
- Plusieurs profils, sélection active

### 8. Historique des conversations
- Sauvegarde automatique après chaque échange
- Affichage visiteur / utilisateur avec horodatage
- Rejeu de n'importe quelle réponse passée
- Suppression individuelle ou globale
- Persistance localStorage

### 9. Paramètres
- Profil utilisateur (prénom, nom, âge, style de communication, conditions médicales, allergies, besoins spéciaux)
- Clé API Mistral avec test de connexion
- Langue de l'interface (FR/EN)
- Raccourcis clavier réponses (4 touches configurables)
- Raccourci enregistrement (configurable)
- Nombre de tours de contexte Mistral
- Force-refresh (vide le cache service worker)

### 10. Internationalisation
- Système i18n maison (`src/lib/i18n.ts`)
- 2 langues : FR et EN
- ~130 clés réparties en 15 sections
- Zéro ternaire `language === 'fr'` dans les composants React

### 11. PWA & Mobile
- Service worker via vite-plugin-pwa
- Installation sur Android via Capacitor
- Gestion bouton retour Android
- Mise en arrière-plan : arrêt automatique de l'enregistrement

### 12. Déploiement
- Dockerfile + nginx pour la production
- docker-compose.yml

---

## Règles de code

- **Linting** : ESLint avec `curly: all`, `brace-style: allman`, `indent: 2`, `react-hooks/exhaustive-deps: error`
- **Build** : `yarn build` (eslint + tsc + vite)
- **Formatage** : `npx eslint --fix "src/**/*.{ts,tsx}"`
- **Constantes partagées** : toujours utiliser `DEFAULT_USER_SETTINGS` de `src/lib/constants.ts`
- **Traductions** : toujours ajouter les chaînes dans `src/lib/i18n.ts` (FR + EN), jamais de ternaire inline dans les composants

---

## Cas limites gérés

| Cas | Comportement |
|-----|-------------|
| Pas de microphone | Message d'erreur clair |
| Clé API absente | Mode simulation avec indicateur |
| Clé API invalide | Erreur dans paramètres + fallback simulation |
| Enregistrement trop court | Message d'erreur, retour idle |
| Fichier audio >30s | Extraction automatique des 30s centrales |
| Réseau offline | Fallback simulation STT ; TTS échoue proprement |
| Mistral plan gratuit (clonage vocal) | Badge `plan_required` + message explicatif |
| Enregistrement en arrière-plan (Android) | Arrêt automatique |

---

## Améliorations possibles

- Détection adaptative du niveau de bruit (seuil dynamique au lieu de fixe 0.01 RMS)
- Export de l'historique (PDF, CSV)
- Support de langues supplémentaires (ES, DE…)
- Mode hors-ligne complet avec modèle STT embarqué
- Accessibilité WCAG AA complète
- Tests automatisés (unit + e2e)
