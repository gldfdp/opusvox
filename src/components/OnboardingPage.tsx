import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useKV } from '@/hooks/use-kv'
import { useLanguage } from '@/hooks/use-language'
import { UserSettings } from '@/lib/types'
import { Language } from '@/lib/i18n'
import { DEFAULT_USER_SETTINGS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeSlash } from '@phosphor-icons/react'

const TOTAL_STEPS = 3

interface OnboardingPageProps {
  onComplete: () => void
}

export function OnboardingPage({ onComplete }: OnboardingPageProps) 
{
  const { t, language, setLanguage } = useLanguage()
  const [, setUserSettings] = useKV<UserSettings>('user-settings', { ...DEFAULT_USER_SETTINGS, createdAt: Date.now(), updatedAt: Date.now() })

  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)

  const goNext = () => 
  {
    setDirection(1)
    setStep(s => s + 1)
  }

  const goBack = () => 
  {
    setDirection(-1)
    setStep(s => s - 1)
  }

  const handleLanguageSelect = (lang: Language) => 
  {
    setLanguage(lang)
    goNext()
  }

  const handleFinish = () => 
  {
    setUserSettings({
      ...DEFAULT_USER_SETTINGS,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      mistralApiKey: apiKey.trim(),
      mistralConnected: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    onComplete()
  }

  const variants = {
    enter: (dir: number) => ({ x: dir * 60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -60, opacity: 0 }),
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex flex-col items-center justify-center p-6">

      {/* Progress dots */}
      <div className="flex gap-2 mb-10">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i + 1 === step
                ? 'w-6 bg-primary'
                : i + 1 < step
                ? 'w-2 bg-primary/50'
                : 'w-2 bg-muted-foreground/20'
            }`}
          />
        ))}
      </div>

      <div className="w-full max-w-md overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {step === 1 && (
              <Step1Language
                t={t}
                selectedLanguage={language}
                onSelect={handleLanguageSelect}
              />
            )}
            {step === 2 && (
              <Step2Profile
                t={t}
                firstName={firstName}
                lastName={lastName}
                onFirstNameChange={setFirstName}
                onLastNameChange={setLastName}
                onBack={goBack}
                onNext={goNext}
              />
            )}
            {step === 3 && (
              <Step3Mistral
                t={t}
                apiKey={apiKey}
                showApiKey={showApiKey}
                onApiKeyChange={setApiKey}
                onToggleShow={() => setShowApiKey(v => !v)}
                onBack={goBack}
                onFinish={handleFinish}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        {t.onboarding.stepOf(step, TOTAL_STEPS)}
      </p>
    </div>
  )
}

/* ─────────────────────────────────────── Step 1 ─ Language ── */

function Step1Language({
  t,
  selectedLanguage,
  onSelect,
}: {
  t: ReturnType<typeof useLanguage>['t']
  selectedLanguage: Language
  onSelect: (l: Language) => void
}) 
{
  const langs: { code: Language; label: string; flag: string }[] = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ]

  return (
    <div className="text-center space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">{t.onboarding.step1Title}</h1>
        <p className="text-muted-foreground">{t.onboarding.step1Subtitle}</p>
      </div>

      <div className="flex flex-col gap-4">
        {langs.map(({ code, label, flag }) => (
          <button
            key={code}
            onClick={() => onSelect(code)}
            className={`flex items-center gap-4 w-full px-6 py-5 rounded-2xl border-2 transition-all duration-200 text-left
              ${
                selectedLanguage === code
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-secondary/40'
              }`}
          >
            <span className="text-4xl">{flag}</span>
            <span className="text-xl font-semibold text-foreground">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────── Step 2 ─ Profile ─── */

function Step2Profile({
  t,
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
  onBack,
  onNext,
}: {
  t: ReturnType<typeof useLanguage>['t']
  firstName: string
  lastName: string
  onFirstNameChange: (v: string) => void
  onLastNameChange: (v: string) => void
  onBack: () => void
  onNext: () => void
}) 
{
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">{t.onboarding.step2Title}</h2>
        <p className="text-muted-foreground">{t.onboarding.step2Subtitle}</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">{t.onboarding.firstNameLabel}</Label>
          <Input
            id="firstName"
            autoFocus
            placeholder={t.onboarding.firstNamePlaceholder}
            value={firstName}
            onChange={e => onFirstNameChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && firstName.trim() && onNext()}
            className="h-12 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">{t.onboarding.lastNameLabel}</Label>
          <Input
            id="lastName"
            placeholder={t.onboarding.lastNamePlaceholder}
            value={lastName}
            onChange={e => onLastNameChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && firstName.trim() && onNext()}
            className="h-12 text-base"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="ghost" className="flex-1" onClick={onBack}>
          {t.onboarding.back}
        </Button>
        <Button className="flex-1" disabled={!firstName.trim()} onClick={onNext}>
          {t.onboarding.next}
        </Button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────── Step 3 ─ Mistral ─── */

function Step3Mistral({
  t,
  apiKey,
  showApiKey,
  onApiKeyChange,
  onToggleShow,
  onBack,
  onFinish,
}: {
  t: ReturnType<typeof useLanguage>['t']
  apiKey: string
  showApiKey: boolean
  onApiKeyChange: (v: string) => void
  onToggleShow: () => void
  onBack: () => void
  onFinish: () => void
}) 
{
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">{t.onboarding.step3Title}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">{t.onboarding.step3Subtitle}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="apiKey">{t.onboarding.mistralKeyLabel}</Label>
        <div className="relative">
          <Input
            id="apiKey"
            autoFocus
            type={showApiKey ? 'text' : 'password'}
            placeholder={t.onboarding.mistralKeyPlaceholder}
            value={apiKey}
            onChange={e => onApiKeyChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onFinish()}
            className="h-12 text-base pr-12"
          />
          <button
            type="button"
            onClick={onToggleShow}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showApiKey ? <EyeSlash size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">{t.onboarding.mistralKeyHint}</p>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="ghost" className="flex-1" onClick={onBack}>
          {t.onboarding.back}
        </Button>
        {apiKey.trim() ? (
          <Button className="flex-1" onClick={onFinish}>
            {t.onboarding.getStarted}
          </Button>
        ) : (
          <Button variant="outline" className="flex-1" onClick={onFinish}>
            {t.onboarding.skip}
          </Button>
        )}
      </div>
    </div>
  )
}
