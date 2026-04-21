# Planning Guide

A web-based communication assistance application for people who have lost the ability to speak, enabling them to communicate through AI-powered speech recognition, contextual response generation, and voice synthesis.

**Experience Qualities**:
1. **Empowering** - The interface should feel supportive and confidence-building, never condescending or limiting. Every interaction should reinforce the user's agency.
2. **Responsive** - Lightning-fast transitions and immediate feedback are critical for natural conversation flow. Any delay breaks the communication rhythm.
3. **Trustworthy** - Design should convey privacy, security, and reliability through clear visual hierarchy and purposeful minimalism. Users need to feel safe.

**Complexity Level**: Light Application (multiple features with basic state)
This application has distinct features (voice recording, contextual responses, text-to-speech, conversation history) but maintains straightforward state management. The focus is on simplicity and reliability over complex interactions.

## Essential Features

### Voice Recognition
- **Functionality**: Captures audio input and transcribes it to text using speech-to-text
- **Purpose**: Allows caregivers and visitors to speak to the user, creating natural two-way conversation
- **Trigger**: User presses and holds a microphone button
- **Progression**: Press microphone button → Audio recording indicator appears → Release button → Transcription displays → Response options generated
- **Success criteria**: Audio successfully captures, transcription appears within 500ms, text is accurate

### Contextual Response Generation
- **Functionality**: Analyzes transcribed speech with conversation history to generate relevant response options
- **Purpose**: Provides intelligent, context-aware responses that feel natural and appropriate
- **Trigger**: Automatically after speech transcription completes
- **Progression**: Transcription completes → Last 5 conversation turns sent to LLM → 3-5 response suggestions appear as buttons → User selects one or types custom
- **Success criteria**: Responses are contextually relevant, appear within 300ms, cover different communication intents

### Voice Synthesis
- **Functionality**: Converts selected text response to natural-sounding speech
- **Purpose**: Enables the user to "speak" their chosen response aloud
- **Trigger**: User taps a response button or confirms custom text
- **Progression**: Response selected → Text sent to TTS API → Audio plays through device speakers → Visual indicator shows playback
- **Success criteria**: Voice sounds natural, playback starts within 200ms, volume is appropriate

### Conversation History
- **Functionality**: Stores and displays past conversation exchanges locally
- **Purpose**: Maintains context for better responses and allows review of past communications
- **Trigger**: Automatically saved after each exchange
- **Progression**: Exchange completes → Saved to local encrypted storage → Appears in scrollable history → Available for context in future responses
- **Success criteria**: All exchanges persist, history loads instantly, privacy is maintained

### Custom Response Input
- **Functionality**: Allows user to type or edit their own response beyond AI suggestions
- **Purpose**: Provides full communication freedom when suggestions don't match intent
- **Trigger**: User taps "Custom response" button
- **Progression**: Tap custom button → Text input appears with keyboard → User types message → Confirm button → TTS speaks the message
- **Success criteria**: Keyboard appears instantly, text is editable, works seamlessly with TTS

## Edge Case Handling

- **No microphone access**: Display clear permission request with instructions to enable microphone in browser settings
- **API failures**: Show friendly error message with retry button, cache last successful responses as fallback
- **Network offline**: Indicate offline status clearly, allow viewing history and typing custom responses (TTS will fail gracefully)
- **Empty transcription**: Prompt user to speak more clearly or adjust microphone position, suggest checking audio input
- **Very long conversations**: Automatically trim context to last 5 exchanges to maintain performance and reduce API costs
- **Rapid successive inputs**: Debounce microphone button to prevent overlapping recordings and API calls

## Design Direction

The design should evoke **calm confidence and medical reliability** while feeling **modern and accessible**. Visual language should communicate dignity, clarity, and ease. Think clean medical interfaces meets thoughtful consumer tech - professional without being sterile, simple without being simplistic. The experience should feel like a trusted communication partner.

## Color Selection

A **medical-tech aesthetic** with warm, accessible undertones to avoid feeling clinical or cold.

- **Primary Color**: Deep medical blue `oklch(0.45 0.12 250)` - communicates trust, reliability, and medical professionalism without harshness
- **Secondary Colors**: 
  - Soft cloud gray `oklch(0.96 0.01 250)` for backgrounds - creates breathing room and reduces visual strain
  - Warm slate `oklch(0.35 0.02 250)` for secondary UI elements - adds depth without competing with primary
- **Accent Color**: Vibrant teal `oklch(0.65 0.15 195)` - brings energy and positivity, used for active recording states and positive feedback
- **Foreground/Background Pairings**:
  - Primary blue on white background: `oklch(0.45 0.12 250)` on `oklch(1 0 0)` - Ratio 7.2:1 ✓ (AAA)
  - White text on primary blue: `oklch(1 0 0)` on `oklch(0.45 0.12 250)` - Ratio 7.2:1 ✓ (AAA)
  - Warm slate on cloud gray: `oklch(0.35 0.02 250)` on `oklch(0.96 0.01 250)` - Ratio 8.5:1 ✓ (AAA)
  - White on accent teal: `oklch(1 0 0)` on `oklch(0.65 0.15 195)` - Ratio 5.1:1 ✓ (AA+)

## Font Selection

Typography should be **exceptionally legible, warm, and trustworthy** - critical for users with potential vision or cognitive challenges. **IBM Plex Sans** for UI and **JetBrains Mono** for conversation text provide technical clarity with human warmth.

- **Typographic Hierarchy**:
  - H1 (Main header): IBM Plex Sans Bold / 32px / -0.02em letter spacing / 1.2 line height
  - H2 (Section titles): IBM Plex Sans Semibold / 20px / -0.01em letter spacing / 1.3 line height
  - Body (UI labels): IBM Plex Sans Regular / 16px / 0em letter spacing / 1.5 line height
  - Conversation text: JetBrains Mono Regular / 18px / 0.01em letter spacing / 1.6 line height
  - Button labels: IBM Plex Sans Medium / 16px / 0em letter spacing / 1.4 line height
  - Small labels: IBM Plex Sans Regular / 14px / 0em letter spacing / 1.4 line height

## Animations

Animations should **reduce cognitive load and provide clear feedback** without creating distraction. Every motion should feel purposeful and calm - **subtle transitions for UI changes (200-250ms)**, **satisfying feedback for button presses (100-150ms)**, and **gentle pulsing for active recording state**. Avoid flashy effects; prioritize clarity and reassurance. The recording indicator should have a gentle breathing animation to show active listening.

## Component Selection

- **Components**:
  - **Button** (shadcn) - Primary interaction for response selection, customized with larger touch targets (min 60px height) and rounded corners
  - **Card** (shadcn) - Container for response options and conversation history items, with subtle shadows for depth
  - **Textarea** (shadcn) - Custom response input with auto-resize and clear focus states
  - **ScrollArea** (shadcn) - Conversation history with smooth scrolling and fade indicators
  - **Alert** (shadcn) - Error messages and system notifications with appropriate severity styling
  - **Separator** (shadcn) - Visual breaks between conversation turns

- **Customizations**:
  - **Microphone button** - Custom large circular button with animated recording state (pulsing ring), uses primary color with white icon
  - **Response cards** - Card variants with hover states that slightly lift and change border color, tap feedback with quick scale animation
  - **Conversation bubbles** - Custom styled divs with directional styling (user responses vs. visitor input), rounded heavily with tail indicators
  - **Recording indicator** - Custom component with animated concentric circles in accent color, pulsing smoothly at 1.5s intervals

- **States**:
  - Buttons: Default (solid primary), Hover (slightly darker with subtle lift), Active (scale 0.98 with deeper shadow), Disabled (50% opacity, no interaction)
  - Recording button: Idle (primary blue), Recording (accent teal with pulsing animation), Processing (muted with spinner)
  - Response cards: Default (white with border), Hover (lifted shadow + accent border), Selected (accent background with white text), Disabled (muted)
  - Text inputs: Default (border-input), Focus (ring-2 ring-accent with border-accent), Error (border-destructive with red ring), Success (border-accent)

- **Icon Selection**: 
  - Microphone (filled) - primary action for voice input
  - Stop/Square - stop recording
  - Play/Speaker - TTS playback
  - PencilSimple - custom text input
  - ClockCounterClockwise - conversation history
  - Warning - error states
  - CheckCircle - success confirmations

- **Spacing**:
  - Page margins: p-6 (24px) on mobile, p-8 (32px) on tablet+
  - Component gaps: gap-4 (16px) for related elements, gap-6 (24px) for distinct sections
  - Card padding: p-5 (20px) for comfortable breathing room
  - Button padding: px-6 py-4 (24px horizontal, 16px vertical) for easy touch targets
  - Stack spacing: space-y-3 (12px) for compact lists, space-y-6 (24px) for major sections

- **Mobile**:
  - Single column layout on mobile (< 768px), two-column on desktop for conversation + responses
  - Microphone button fixed at bottom center on mobile for thumb access, integrated into layout on desktop
  - Response cards stack vertically on mobile with full width, grid layout (2 columns) on tablet
  - Font sizes increase slightly on mobile for readability (body 17px vs 16px)
  - History drawer slides from bottom on mobile, sidebar on desktop
  - Touch targets minimum 60x60px on mobile, 48x48px acceptable on desktop
