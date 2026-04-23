import { useRegisterSW } from 'virtual:pwa-register/react'
import { ArrowsClockwise } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/hooks/use-language'

export function UpdateBanner()
{
  const { t } = useLanguage()
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()

  if (!needRefresh)
  {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shadow-lg">
      <span className="text-sm font-medium">
        {t.appMisc.newVersionAvailable}
      </span>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => updateServiceWorker(true)}
        className="ml-4"
      >
        <ArrowsClockwise size={16} className="mr-2" />
        {t.appMisc.updateNow}
      </Button>
    </div>
  )
}
