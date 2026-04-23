import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event
{
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function getStoredPrompt(): BeforeInstallPromptEvent | null
{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).__pwaInstallPrompt ?? null
}

function isIos(): boolean
{
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isStandalone(): boolean
{
  return window.matchMedia('(display-mode: standalone)').matches
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    || (navigator as any).standalone === true
}

export function usePwaInstall()
{
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(getStoredPrompt)
  const [isInstalled, setIsInstalled] = useState(isStandalone)

  useEffect(() =>
  {
    // Pick up the event if it fires after mount
    const onReady = () => setPromptEvent(getStoredPrompt())
    window.addEventListener('pwaInstallPromptReady', onReady)

    const onInstalled = () =>
    {
      setIsInstalled(true)
      setPromptEvent(null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).__pwaInstallPrompt
    }
    window.addEventListener('appinstalled', onInstalled)

    return () =>
    {
      window.removeEventListener('pwaInstallPromptReady', onReady)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = async (): Promise<'native' | 'ios' | 'unsupported' | 'dismissed'>  =>
  {
    if (promptEvent)
    {
      await promptEvent.prompt()
      const { outcome } = await promptEvent.userChoice
      if (outcome === 'accepted')
      {
        setPromptEvent(null)
        setIsInstalled(true)
        return 'native'
      }
      return 'dismissed'
    }
    if (isIos())
    {
      return 'ios'
    }
    return 'unsupported'
  }

  // Show button if: not already installed, and either prompt available OR iOS (needs manual guide)
  const canInstall = !isInstalled && (!!promptEvent || isIos())

  return { canInstall, isInstalled, isIos: isIos(), install }
}
