import { useState, KeyboardEvent } from 'react'
import { useLanguage } from '@/hooks/use-language'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PaperPlaneRight } from '@phosphor-icons/react'

interface TextInitiatorProps {
  onTextSubmit: (text: string) => void
  disabled?: boolean
}

export function TextInitiator({ onTextSubmit, disabled = false }: TextInitiatorProps) {
  const { t } = useLanguage()
  const [inputText, setInputText] = useState('')

  const handleSubmit = () => {
    if (inputText.trim() && !disabled) {
      onTextSubmit(inputText.trim())
      setInputText('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            {t.initiateConversation.title}
          </h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center cursor-help">
                  <span className="text-xs text-muted-foreground">?</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t.initiateConversation.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <Textarea
          id="text-initiator-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.initiateConversation.placeholder}
          disabled={disabled}
          className="min-h-[100px] resize-none"
        />
        
        <Button
          onClick={handleSubmit}
          disabled={disabled || !inputText.trim()}
          className="w-full"
          size="lg"
        >
          <PaperPlaneRight size={20} className="mr-2" />
          {t.initiateConversation.button}
        </Button>
      </div>
    </Card>
  )
}
