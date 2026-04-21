import { Microphone, Stop } from '@phosphor-icons/react'
import { RecordingState } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/hooks/use-language'

interface RecordingButtonProps {
  state: RecordingState
  onStartRecording: () => void
  onStopRecording: () => void
}

export function RecordingButton({ state, onStartRecording, onStopRecording }: RecordingButtonProps) {
  const { t } = useLanguage()
  const isRecording = state === 'recording'
  const isProcessing = state === 'processing'
  const isSpeaking = state === 'speaking'
  const isDisabled = isProcessing || isSpeaking

  const handleClick = () => {
    if (isRecording) {
      onStopRecording()
    } else if (!isDisabled) {
      onStartRecording()
    }
  }

  return (
    <div className="relative flex items-center justify-center">
      {isRecording && (
        <>
          <div 
            className="absolute inset-0 rounded-full bg-accent"
            style={{
              animation: 'pulse-ring 1.5s ease-in-out infinite'
            }}
          />
          <div 
            className="absolute inset-0 rounded-full bg-accent opacity-50"
            style={{
              animation: 'pulse-ring 1.5s ease-in-out infinite 0.75s'
            }}
          />
        </>
      )}
      
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          "relative z-10 flex items-center justify-center w-20 h-20 rounded-full transition-all duration-200",
          "focus:outline-none focus:ring-4 focus:ring-ring focus:ring-offset-2",
          "active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
          isRecording 
            ? "bg-accent text-accent-foreground shadow-lg shadow-accent/30" 
            : "bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:scale-105"
        )}
        aria-label={isRecording ? t.recording.buttonStopLabel : t.recording.buttonStartLabel}
      >
        {isRecording ? (
          <Stop size={32} weight="fill" />
        ) : (
          <Microphone size={32} weight="fill" />
        )}
      </button>

      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
