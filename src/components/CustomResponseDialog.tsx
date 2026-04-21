import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/hooks/use-language'

interface CustomResponseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (text: string) => void
}

export function CustomResponseDialog({ open, onOpenChange, onSubmit }: CustomResponseDialogProps) {
  const { t } = useLanguage()
  const [text, setText] = useState('')

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim())
      setText('')
      onOpenChange(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t.customDialog.title}</DialogTitle>
          <DialogDescription className="text-base">
            {t.customDialog.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <Textarea
            id="custom-response"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.customDialog.placeholder}
            className="min-h-40 text-lg conversation-text resize-none"
            autoFocus
          />
          
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setText('')
                onOpenChange(false)
              }}
            >
              {t.customDialog.cancel}
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!text.trim()}
              size="lg"
            >
              {t.customDialog.send}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            {t.customDialog.tip}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
