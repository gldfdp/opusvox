import { ConversationTurn } from '@/lib/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'

interface ConversationHistoryProps {
  history: ConversationTurn[]
}

export function ConversationHistory({ history }: ConversationHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center">
        <p className="text-muted-foreground text-lg">
          No conversation history yet. Start recording to begin.
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-6">
        {history.map((turn, index) => (
          <div key={turn.id} className="space-y-3">
            {index > 0 && <Separator className="my-6" />}
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Visitor
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(turn.timestamp, 'MMM d, h:mm a')}
                </span>
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
                  You
                </span>
                {turn.isCustomResponse && (
                  <span className="text-xs text-muted-foreground italic">
                    Custom
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
