import { Toaster } from 'sonner'
import { useKV } from '@/hooks/use-kv'
import { OnboardingPage } from '@/components/OnboardingPage'
import { AppContent } from '@/components/AppContent'

export function AppRouter()
{
  const [onboardingCompleted, setOnboardingCompleted] = useKV<boolean>('onboarding-completed', false)

  // Still loading from IDB – render nothing to avoid flashing onboarding for returning users
  if (onboardingCompleted === undefined)
  {
    return (
      <div className="min-h-screen bg-linear-to-br from-background via-secondary/30 to-background" />
    )
  }

  if (!onboardingCompleted)
  {
    return (
      <>
        <Toaster position="top-center" />
        <OnboardingPage onComplete={() => setOnboardingCompleted(true)} />
      </>
    )
  }

  return <AppContent />
}
