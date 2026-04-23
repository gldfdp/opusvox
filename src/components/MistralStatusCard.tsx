import { useState, useEffect } from 'react'
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

export function MistralStatusCard({ apiKey }: MistralStatusCardProps) {
  const { t, language } = useLanguage()
  const [status, setStatus] = useState<MistralStatus>({
    isConnected: false,
    isChecking: false
  })

  useEffect(() => {
    if (apiKey) {
      checkMistralStatus()
    } else {
      setStatus({
        isConnected: false,
        isChecking: false
      })
    }
  }, [apiKey])

  const checkMistralStatus = async () => {
    if (!apiKey) return

    setStatus(prev => ({ ...prev, isChecking: true, error: undefined }))

    try {
      const response = await fetch('https://api.mistral.ai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
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
      } else {
        const errorData = await response.json().catch(() => ({}))
        setStatus({
          isConnected: false,
          isChecking: false,
          error: errorData.message || `API Error: ${response.status}`
        })
      }
    } catch (error) {
      setStatus({
        isConnected: false,
        isChecking: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      })
    }
  }

  const getStatusIcon = () => {
    if (status.isChecking) {
      return <ArrowClockwise size={20} className="animate-spin text-muted-foreground" />
    }
    if (!apiKey) {
      return <WarningCircle size={20} weight="fill" className="text-muted-foreground" />
    }
    if (status.error) {
      return <XCircle size={20} weight="fill" className="text-destructive" />
    }
    if (status.isConnected) {
      return <CheckCircle size={20} weight="fill" className="text-accent" />
    }
    return <WarningCircle size={20} weight="fill" className="text-muted-foreground" />
  }

  const getStatusText = () => {
    if (status.isChecking) {
      return language === 'fr' ? 'Vérification...' : 'Checking...'
    }
    if (!apiKey) {
      return language === 'fr' ? 'Non configurée' : 'Not configured'
    }
    if (status.error) {
      return language === 'fr' ? 'Erreur de connexion' : 'Connection error'
    }
    if (status.isConnected) {
      return language === 'fr' ? 'Connectée' : 'Connected'
    }
    return language === 'fr' ? 'Inconnue' : 'Unknown'
  }

  const getStatusBadgeVariant = (): 'default' | 'secondary' | 'destructive' => {
    if (!apiKey) return 'secondary'
    if (status.error) return 'destructive'
    if (status.isConnected) return 'default'
    return 'secondary'
  }

  const formatResetTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    
    if (diff < 0) return language === 'fr' ? 'Maintenant' : 'Now'
    
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) {
      return language === 'fr' ? `${minutes} min` : `${minutes} min`
    }
    
    const hours = Math.floor(minutes / 60)
    return language === 'fr' ? `${hours}h` : `${hours}h`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <span>{language === 'fr' ? 'Statut Mistral API' : 'Mistral API Status'}</span>
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
            {language === 'fr' ? 'Connexion' : 'Connection'}
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
              {language === 'fr' 
                ? 'Configurez votre clé API Mistral pour activer la transcription et la synthèse vocale avancées.'
                : 'Configure your Mistral API key to enable advanced transcription and speech synthesis.'}
            </p>
          </div>
        )}

        {status.isConnected && status.rateLimit && (
          <div className="space-y-3 pt-2 border-t">
            <h4 className="text-sm font-semibold">
              {language === 'fr' ? 'Limites d\'utilisation' : 'Usage Limits'}
            </h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {language === 'fr' ? 'Requêtes restantes' : 'Remaining requests'}
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
                    {language === 'fr' ? 'Réinitialisation dans' : 'Resets in'}
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
              {language === 'fr' 
                ? 'API connectée avec succès. Les informations de limite d\'utilisation ne sont pas disponibles.'
                : 'API connected successfully. Usage limit information not available.'}
            </p>
          </div>
        )}

        <div className="pt-2 border-t">
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>{language === 'fr' ? 'Transcription (STT)' : 'Transcription (STT)'}</span>
              <Badge variant="outline" className="text-xs">
                {apiKey ? (language === 'fr' ? 'Actif' : 'Active') : (language === 'fr' ? 'Simulé' : 'Simulated')}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>{language === 'fr' ? 'Synthèse vocale (TTS)' : 'Speech Synthesis (TTS)'}</span>
              <Badge variant="outline" className="text-xs">
                {apiKey ? (language === 'fr' ? 'Actif' : 'Active') : 'Browser'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>{language === 'fr' ? 'Génération de réponses' : 'Response Generation'}</span>
              <Badge variant="outline" className="text-xs">
                {apiKey ? (language === 'fr' ? 'Actif' : 'Active') : (language === 'fr' ? 'Hors-ligne' : 'Offline')}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
