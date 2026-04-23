import { SpeakerHigh, User, Sparkle } from '@phosphor-icons/react'
import { Language } from '@/lib/i18n'
import { useLanguage } from '@/hooks/use-language'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface VoiceIndicatorProps {
  language: Language
  voiceName?: string
  isActive: boolean
  isClonedVoice?: boolean
  profileName?: string
  isMistralTTS?: boolean
}

const languageFlags: Record<Language, string> = {
  en: '🇬🇧',
  fr: '🇫🇷'
}

const languageLabels: Record<Language, string> = {
  en: 'English Voice',
  fr: 'Voix Française'
}

export function VoiceIndicator({ language, voiceName, isActive, isClonedVoice, profileName, isMistralTTS }: VoiceIndicatorProps) 
{
  const { t } = useLanguage()
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
            {isMistralTTS ? (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                <Sparkle size={20} weight="fill" className="text-white" />
              </div>
            ) : isClonedVoice ? (
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                <User size={20} weight="fill" className="text-white" />
              </div>
            ) : (
              <SpeakerHigh 
                size={32} 
                weight="fill" 
                className={isActive ? 'text-accent' : 'text-muted-foreground'}
              />
            )}
          </motion.div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{languageFlags[language]}</span>
              <span className="font-semibold text-foreground">
                {isClonedVoice && profileName ? profileName : languageLabels[language]}
              </span>
              {isMistralTTS && (
                <Badge className="bg-gradient-to-r from-accent to-primary text-white text-xs">
                  {t.voiceIndicator.mistralTts}
                </Badge>
              )}
              {isClonedVoice && !isMistralTTS && (
                <Badge className="bg-accent text-xs">
                  {t.voiceIndicator.clonedVoice}
                </Badge>
              )}
            </div>
            {voiceName && !isClonedVoice && !isMistralTTS && (
              <p className="text-xs text-muted-foreground font-mono">
                {voiceName}
              </p>
            )}
            {isMistralTTS && (
              <p className="text-xs text-muted-foreground">
                {t.voiceIndicator.aiSpeechSynthesis}
              </p>
            )}
            {isClonedVoice && !isMistralTTS && (
              <p className="text-xs text-muted-foreground">
                {t.voiceIndicator.personalizedVoice}
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
