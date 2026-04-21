import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface CustomResponseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (text: string) => void
}

export function CustomResponseDialog({ open, onOpenChange, onSubmit }: CustomResponseDialogProps) {
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
          <DialogTitle className="text-2xl">Write your response</DialogTitle>
          <DialogDescription className="text-base">
            Type your custom message and press Send when ready.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <Textarea
            id="custom-response"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
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
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!text.trim()}
              size="lg"
            >
              Send Response
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Tip: Press Cmd+Enter (Mac) or Ctrl+Enter (Windows) to send
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
