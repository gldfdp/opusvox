import { ConversationTurn } from '@/lib/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Trash } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { useLanguage } from '@/hooks/use-language'

interface ConversationHistoryProps {
  history: ConversationTurn[]
  onDelete?: (id: string) => void
}

export function ConversationHistory({ history, onDelete }: ConversationHistoryProps) {
  const { t } = useLanguage()
  
  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center">
        <p className="text-muted-foreground text-lg">
          {t.history.empty}
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-6 px-4">
        {history.map((turn, index) => (
          <div key={turn.id} className="space-y-3">
            {index > 0 && <Separator className="my-6" />}
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t.history.visitor}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(turn.timestamp, 'MMM d, h:mm a')}
                  </span>
                </div>
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(turn.id)}
                    className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash size={16} />
                  </Button>
                )}
              </div>
              <div className="bg-secondary rounded-lg p-4">
                <p className="conversation-text text-base leading-relaxed text-foreground">
                  {turn.visitorInput}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-primary uppercase tracking-wide">
                  {t.history.you}
                </span>
                {turn.isCustomResponse && (
                  <span className="text-xs text-muted-foreground italic">
                    {t.history.custom}
                  </span>
                )}
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <p className="conversation-text text-base leading-relaxed text-foreground">
                  {turn.userResponse}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
