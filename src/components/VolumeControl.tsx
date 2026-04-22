import { SpeakerHigh, SpeakerLow, SpeakerX } from '@phosphor-icons/react'
import { Slider } from '@/components/ui/slider'
import { useLanguage } from '@/hooks/use-language'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface VolumeControlProps {
  volume: number
  onVolumeChange: (volume: number) => void
}

export function VolumeControl({ volume, onVolumeChange }: VolumeControlProps) {
  const { t } = useLanguage()
  
  const getVolumeIcon = () => {
    if (volume === 0) return <SpeakerX size={20} weight="fill" />
    if (volume < 0.5) return <SpeakerLow size={20} weight="fill" />
    return <SpeakerHigh size={20} weight="fill" />
  }

  const handleVolumeChange = (values: number[]) => {
    onVolumeChange(values[0])
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-3 w-full">
            <div className="text-muted-foreground">
              {getVolumeIcon()}
            </div>
            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              min={0}
              max={1}
              step={0.05}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground font-medium min-w-[3ch] text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t.volume.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
