import { SpeakerHigh } from '@phosphor-icons/react'
import { Language } from '@/lib/i18n'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'

interface VoiceIndicatorProps {
  language: Language
  voiceName?: string
  isActive: boolean
}

const languageFlags: Record<Language, string> = {
  en: '🇬🇧',
  fr: '🇫🇷'
}

const languageLabels: Record<Language, string> = {
  en: 'English Voice',
  fr: 'Voix Française'
}

export function VoiceIndicator({ language, voiceName, isActive }: VoiceIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`p-4 border-2 ${isActive ? 'bg-accent/20 border-accent' : 'bg-secondary/30 border-border'}`}>
        <div className="flex items-center gap-3">
          <motion.div
            animate={isActive ? {
              scale: [1, 1.1, 1],
            } : {}}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <SpeakerHigh 
              size={32} 
              weight="fill" 
              className={isActive ? 'text-accent' : 'text-muted-foreground'}
            />
          </motion.div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{languageFlags[language]}</span>
              <span className="font-semibold text-foreground">
                {languageLabels[language]}
              </span>
            </div>
            {voiceName && (
              <p className="text-xs text-muted-foreground font-mono">
                {voiceName}
              </p>
            )}
          </div>

          {isActive && (
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-accent rounded-full"
                  animate={{
                    height: [12, 24, 12],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.15
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
