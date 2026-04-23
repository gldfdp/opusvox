import { useLanguage } from '@/hooks/use-language'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Buildings, ShieldCheck, Globe, Info } from '@phosphor-icons/react'

interface MentionsLegalesProps {
  onClose: () => void
}

export function MentionsLegales({ onClose }: MentionsLegalesProps) 
{
  const { language } = useLanguage()

  const fr = language === 'fr'

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {fr ? 'Mentions légales' : 'Legal Notice'}
            </h1>
            <p className="text-muted-foreground mt-1">OpusVox</p>
          </div>
          <Button onClick={onClose} variant="outline">
            <ArrowLeft size={18} className="mr-2" />
            {fr ? 'Retour' : 'Back'}
          </Button>
        </div>

        {/* Éditeur */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Buildings size={22} weight="fill" className="text-primary" />
              {fr ? 'Éditeur de l\'application' : 'Application Publisher'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>OPUS DIGITALIS</strong></p>
            <p>{fr ? 'Société à responsabilité limitée (SARL)' : 'Private limited company (SARL)'}</p>
            <p>{fr ? 'Capital social : 500 €' : 'Share capital: €500'}</p>
            <Separator className="my-3" />
            <p><strong>SIREN :</strong> 100 059 856</p>
            <p><strong>SIRET :</strong> 100 059 856 00011</p>
            <p><strong>TVA intracommunautaire :</strong> FR82 100059856</p>
            <p><strong>Code APE :</strong> 6201Z — {fr ? 'Programmation informatique' : 'Computer programming'}</p>
            <p>
              {fr ? 'Immatriculée le' : 'Registered on'} 15/01/2026{' '}
              {fr ? 'au Registre du Commerce et des Sociétés' : 'at the French Trade and Companies Register'}
            </p>
            <Separator className="my-3" />
            <p>
              <strong>{fr ? 'Siège social :' : 'Registered office:'}</strong>{' '}
              Domaine du Petit Mesnil, 53170 Arquenay, France
            </p>
            <p>
              <strong>{fr ? 'Gérant :' : 'Manager:'}</strong>{' '}
              Grégoire Larreur de Farcy de Pontfarcy
            </p>
          </CardContent>
        </Card>

        {/* Hébergement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe size={22} weight="fill" className="text-primary" />
              {fr ? 'Hébergement' : 'Hosting'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              {fr
                ? 'L\'application OpusVox est une Progressive Web App (PWA) hébergée par :'
                : 'The OpusVox application is a Progressive Web App (PWA) hosted by:'}
            </p>
            <p><strong>OVH SAS</strong></p>
            <p>2, rue Kellermann — 59100 Roubaix, France</p>
            <p><strong>SIREN :</strong> 424 761 419</p>
            <p>
              <a href="https://www.ovhcloud.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                www.ovhcloud.com
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Données personnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck size={22} weight="fill" className="text-primary" />
              {fr ? 'Données personnelles & confidentialité' : 'Personal Data & Privacy'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-4">
            <p>
              {fr
                ? 'OpusVox a été conçu dans le respect de la vie privée de ses utilisateurs. Voici le détail précis du traitement de vos données :'
                : 'OpusVox has been designed with respect for its users\' privacy. Here is the precise detail of how your data is handled:'}
            </p>

            <div className="space-y-3">
              <div className="rounded-lg border p-4 bg-accent/5 space-y-1">
                <p className="font-semibold text-foreground">
                  {fr ? '📱 Données stockées localement sur votre appareil' : '📱 Data stored locally on your device'}
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>{fr ? 'Votre profil utilisateur (prénom, informations médicales, préférences)' : 'Your user profile (first name, medical information, preferences)'}</li>
                  <li>{fr ? 'Vos profils vocaux enregistrés' : 'Your recorded voice profiles'}</li>
                  <li>{fr ? 'L\'historique de vos conversations' : 'Your conversation history'}</li>
                  <li>{fr ? 'Vos paramètres et raccourcis clavier' : 'Your settings and keyboard shortcuts'}</li>
                  <li>{fr ? 'Votre clé API Mistral' : 'Your Mistral API key'}</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  {fr
                    ? 'Ces données ne quittent jamais votre appareil et ne sont transmises à aucun tiers.'
                    : 'This data never leaves your device and is not transmitted to any third party.'}
                </p>
              </div>

              <div className="rounded-lg border p-4 bg-primary/5 space-y-1">
                <p className="font-semibold text-foreground">
                  {fr ? '🤖 Données envoyées à Mistral AI' : '🤖 Data sent to Mistral AI'}
                </p>
                <p className="text-muted-foreground">
                  {fr
                    ? 'Lorsque vous utilisez les fonctionnalités d\'intelligence artificielle, les éléments suivants sont transmis aux serveurs de Mistral AI (mistral.ai), opérateur tiers :'
                    : 'When you use artificial intelligence features, the following elements are transmitted to Mistral AI (mistral.ai) servers, a third-party operator:'}
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>{fr ? 'Enregistrements audio (pour la transcription vocale et le clonage de voix)' : 'Audio recordings (for voice transcription and voice cloning)'}</li>
                  <li>{fr ? 'Textes des conversations (pour la génération de suggestions de réponses)' : 'Conversation texts (for generating response suggestions)'}</li>
                  <li>{fr ? 'Textes à synthétiser (pour la synthèse vocale)' : 'Texts to be synthesized (for text-to-speech)'}</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  {fr
                    ? 'Ces transmissions sont effectuées directement depuis votre navigateur vers l\'API Mistral, en utilisant votre propre clé API. Opus Digitalis ne reçoit, ne stocke ni ne traite ces données.'
                    : 'These transmissions are made directly from your browser to the Mistral API, using your own API key. Opus Digitalis does not receive, store, or process this data.'}
                </p>
                <p className="text-muted-foreground">
                  {fr
                    ? 'Le traitement de ces données par Mistral AI est régi par la politique de confidentialité de Mistral AI, consultable sur '
                    : 'The processing of this data by Mistral AI is governed by Mistral AI\'s privacy policy, available at '}
                  <a
                    href="https://mistral.ai/fr/terms#privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    mistral.ai
                  </a>.
                </p>
              </div>

              <div className="rounded-lg border p-4 bg-muted/30 space-y-1">
                <p className="font-semibold text-foreground">
                  {fr ? '🚫 Aucun autre service tiers' : '🚫 No other third-party service'}
                </p>
                <p className="text-muted-foreground">
                  {fr
                    ? 'OpusVox ne collecte aucune donnée analytique, ne dépose aucun cookie de suivi, et ne fait appel à aucun autre service tiers (publicité, réseaux sociaux, statistiques, etc.).'
                    : 'OpusVox does not collect any analytical data, does not set any tracking cookies, and does not use any other third-party service (advertising, social networks, statistics, etc.).'}
                </p>
              </div>
            </div>

            <p className="text-muted-foreground">
              {fr
                ? 'Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d\'un droit d\'accès, de rectification et de suppression de vos données. Ces droits s\'exercent directement dans l\'application (paramètres, suppression de l\'historique, suppression des profils vocaux).'
                : 'In accordance with the General Data Protection Regulation (GDPR), you have the right to access, rectify, and delete your data. These rights can be exercised directly within the application (settings, history deletion, voice profile deletion).'}
            </p>
          </CardContent>
        </Card>

        {/* Propriété intellectuelle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info size={22} weight="fill" className="text-primary" />
              {fr ? 'Propriété intellectuelle' : 'Intellectual Property'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              {fr
                ? 'L\'application OpusVox, son code source, son design et ses contenus sont la propriété exclusive d\'OPUS DIGITALIS. Toute reproduction, représentation ou diffusion, totale ou partielle, sans l\'autorisation écrite préalable d\'OPUS DIGITALIS est interdite.'
                : 'The OpusVox application, its source code, design and content are the exclusive property of OPUS DIGITALIS. Any reproduction, representation or distribution, in whole or in part, without the prior written consent of OPUS DIGITALIS is prohibited.'}
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground pb-4">
          {fr
            ? `Mentions légales mises à jour le ${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}`
            : `Legal notice last updated on ${new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}`}
        </p>

      </div>
    </div>
  )
}
