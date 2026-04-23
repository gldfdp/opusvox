import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, WarningCircle, XCircle, ArrowClockwise } from '@phosphor-icons/react'
import { useLanguage } from '@/hooks/use-language'

interface MistralStatus {
  isConnected: boolean
  isChecking: boolean
  error?: string
  usage?: {
    totalRequests: number
    totalTokens: number
    lastRequestTime?: number
  }
  rateLimit?: {
    limit: number
    remaining: number
    reset: number
  }
}

interface MistralStatusCardProps {
  apiKey?: string
}

export function MistralStatusCard({ apiKey }: MistralStatusCardProps) 
{
  const { t } = useLanguage()
  const [status, setStatus] = useState<MistralStatus>({
    isConnected: false,
    isChecking: false
  })

  const checkMistralStatus = useCallback(async () => 
  {
    if (!apiKey) 
    {
      return
    }

    setStatus(prev => ({ ...prev, isChecking: true, error: undefined }))

    try 
    {
      const response = await fetch('https://api.mistral.ai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) 
      {
        const rateLimit = {
          limit: parseInt(response.headers.get('x-ratelimit-limit') || '0'),
          remaining: parseInt(response.headers.get('x-ratelimit-remaining') || '0'),
          reset: parseInt(response.headers.get('x-ratelimit-reset') || '0')
        }

        setStatus({
          isConnected: true,
          isChecking: false,
          rateLimit: rateLimit.limit > 0 ? rateLimit : undefined
        })
      }
      else 
      {
        const errorData = await response.json().catch(() => ({}))
        setStatus({
          isConnected: false,
          isChecking: false,
          error: errorData.message || `API Error: ${response.status}`
        })
      }
    }
    catch (error) 
    {
      setStatus({
        isConnected: false,
        isChecking: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      })
    }
  }, [apiKey])

  useEffect(() => 
  {
    if (apiKey) 
    {
      checkMistralStatus()
    }
    else 
    {
      setStatus({
        isConnected: false,
        isChecking: false
      })
    }
  }, [apiKey, checkMistralStatus])

  const getStatusIcon = () => 
  {
    if (status.isChecking) 
    {
      return <ArrowClockwise size={20} className="animate-spin text-muted-foreground" />
    }
    if (!apiKey) 
    {
      return <WarningCircle size={20} weight="fill" className="text-muted-foreground" />
    }
    if (status.error) 
    {
      return <XCircle size={20} weight="fill" className="text-destructive" />
    }
    if (status.isConnected) 
    {
      return <CheckCircle size={20} weight="fill" className="text-accent" />
    }
    return <WarningCircle size={20} weight="fill" className="text-muted-foreground" />
  }

  const getStatusText = () => 
  {
    if (status.isChecking) 
    {
      return t.mistralStatus.checking
    }
    if (!apiKey) 
    {
      return t.mistralStatus.notConfigured
    }
    if (status.error) 
    {
      return t.mistralStatus.connectionError
    }
    if (status.isConnected) 
    {
      return t.mistralStatus.connected
    }
    return t.mistralStatus.unknown
  }

  const getStatusBadgeVariant = (): 'default' | 'secondary' | 'destructive' => 
  {
    if (!apiKey) 
    {
      return 'secondary'
    }
    if (status.error) 
    {
      return 'destructive'
    }
    if (status.isConnected) 
    {
      return 'default'
    }
    return 'secondary'
  }

  const formatResetTime = (timestamp: number) => 
  {
    const date = new Date(timestamp * 1000)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    
    if (diff < 0) 
    {
      return t.mistralStatus.now
    }
    
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) 
    {
      return `${minutes} min`
    }
    
    const hours = Math.floor(minutes / 60)
    return `${hours}h`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <span>{t.mistralStatus.title}</span>
          <div className="flex items-center gap-2">
            {apiKey && (
              <Button
                variant="ghost"
                size="sm"
                onClick={checkMistralStatus}
                disabled={status.isChecking}
                className="h-8 w-8 p-0"
              >
                <ArrowClockwise 
                  size={16} 
                  className={status.isChecking ? 'animate-spin' : ''} 
                />
              </Button>
            )}
            {getStatusIcon()}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t.mistralStatus.connection}
          </span>
          <Badge variant={getStatusBadgeVariant()}>
            {getStatusText()}
          </Badge>
        </div>

        {status.error && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-xs text-destructive font-medium">
              {status.error}
            </p>
          </div>
        )}

        {!apiKey && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              {t.mistralStatus.configureApiKey}
            </p>
          </div>
        )}

        {status.isConnected && status.rateLimit && (
          <div className="space-y-3 pt-2 border-t">
            <h4 className="text-sm font-semibold">
              {t.mistralStatus.usageLimits}
            </h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t.mistralStatus.remainingRequests}
                </span>
                <span className="font-medium">
                  {status.rateLimit.remaining} / {status.rateLimit.limit}
                </span>
              </div>

              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-accent h-full transition-all duration-300"
                  style={{ 
                    width: `${(status.rateLimit.remaining / status.rateLimit.limit) * 100}%` 
                  }}
                />
              </div>

              {status.rateLimit.reset > 0 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {t.mistralStatus.resetsIn}
                  </span>
                  <span>{formatResetTime(status.rateLimit.reset)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {status.isConnected && !status.rateLimit && (
          <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg">
            <p className="text-xs text-accent-foreground">
              {t.mistralStatus.connectedNoLimits}
            </p>
          </div>
        )}

        <div className="pt-2 border-t">
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>{t.mistralStatus.transcriptionStt}</span>
              <Badge variant="outline" className="text-xs">
                {apiKey ? t.mistralStatus.active : t.mistralStatus.simulated}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>{t.mistralStatus.speechSynthesisTts}</span>
              <Badge variant="outline" className="text-xs">
                {apiKey ? t.mistralStatus.active : 'Browser'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>{t.mistralStatus.responseGeneration}</span>
              <Badge variant="outline" className="text-xs">
                {apiKey ? t.mistralStatus.active : t.mistralStatus.offline}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
