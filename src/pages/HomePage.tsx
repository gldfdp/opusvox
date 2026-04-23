import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Microphone,
  Sparkle,
  Waveform,
  Globe,
  DeviceMobile,
  LockSimple,
  ArrowRight,
  CheckCircle,
  DownloadSimple,
} from '@phosphor-icons/react'
import { toast, Toaster } from 'sonner'
import { Button } from '@/components/ui/button'
import { AppLogo } from '@/components/AppLogo'
import { useLanguage } from '@/hooks/use-language'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { usePwaInstall } from '@/hooks/use-pwa-install'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
}

interface Feature
{
  icon: React.ReactNode
  title: string
  desc: string
}

interface Step
{
  number: string
  title: string
  desc: string
}

export function HomePage()
{
  const navigate = useNavigate()
  const { t } = useLanguage()
  const h = t.home
  const { isInstalled, install } = usePwaInstall()

  const handleInstall = async () =>
  {
    const result = await install()
    if (result === 'ios')
    {
      toast.info(h.installIosHint, { duration: 8000 })
    }
    else if (result === 'unsupported')
    {
      toast.info(h.installUnsupportedHint, { duration: 8000 })
    }
  }

  const features: Feature[] = [
    { icon: <Waveform size={28} weight="duotone" />, title: h.feature1Title, desc: h.feature1Desc },
    { icon: <Sparkle size={28} weight="duotone" />, title: h.feature2Title, desc: h.feature2Desc },
    { icon: <Microphone size={28} weight="duotone" />, title: h.feature3Title, desc: h.feature3Desc },
    { icon: <Globe size={28} weight="duotone" />, title: h.feature4Title, desc: h.feature4Desc },
    { icon: <DeviceMobile size={28} weight="duotone" />, title: h.feature5Title, desc: h.feature5Desc },
    { icon: <LockSimple size={28} weight="duotone" />, title: h.feature6Title, desc: h.feature6Desc },
  ]

  const steps: Step[] = [
    { number: '01', title: h.step1Title, desc: h.step1Desc },
    { number: '02', title: h.step2Title, desc: h.step2Desc },
    { number: '03', title: h.step3Title, desc: h.step3Desc },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="top-center" richColors />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 max-w-6xl flex items-center justify-between">
          <span className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <AppLogo size={28} />
              OpusVox
            </span>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {isInstalled
              ? <span className="text-sm text-muted-foreground">{h.alreadyInstalled}</span>
              : (
                <Button variant="outline" size="sm" onClick={handleInstall}>
                  <DownloadSimple size={16} className="mr-2" />
                  {h.installApp}
                </Button>
              )
            }
            <Button size="sm" onClick={() => navigate('/app')}>
              {h.openApp}
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute bottom-[0%] right-[10%] w-[400px] h-[400px] rounded-full bg-accent/10 blur-[100px]" />
        </div>

        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/60 px-4 py-1.5 text-sm text-muted-foreground mb-8">
              <CheckCircle size={15} weight="fill" className="text-primary" />
              {h.freeOpenSource}
              <span className="mx-1 opacity-40">·</span>
              <CheckCircle size={15} weight="fill" className="text-primary" />
              {h.installable}
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl sm:text-7xl font-bold tracking-tight leading-tight mb-6"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
          >
            {h.heroTitle}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
              {h.heroHighlight}
            </span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
          >
            {h.heroSubtitle}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
          >
            <Button
              size="lg"
              className="text-base px-8 py-6 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
              onClick={() => navigate('/app')}
            >
              {h.openApp}
              <ArrowRight size={20} className="ml-2" />
            </Button>
            {!isInstalled && (
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8 py-6 rounded-xl"
                onClick={handleInstall}
              >
                <DownloadSimple size={20} className="mr-2" />
                {h.installApp}
              </Button>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-secondary/20">
        <div className="container mx-auto max-w-6xl">
          <motion.h2
            className="text-3xl sm:text-4xl font-bold text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            {h.featuresTitle}
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                className="group rounded-2xl border border-border/50 bg-card p-6 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.5}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.h2
            className="text-3xl sm:text-4xl font-bold text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            {h.howTitle}
          </motion.h2>

          <div className="space-y-0">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                className="flex gap-8 items-start pb-12 last:pb-0"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.5}
              >
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">{step.number}</span>
                </div>
                <div className="pt-2">
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-secondary/20">
        <div className="container mx-auto max-w-2xl text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{h.ctaTitle}</h2>
            <p className="text-muted-foreground mb-8 text-lg">{h.ctaSubtitle}</p>
            <Button
              size="lg"
              className="text-base px-8 py-6 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
              onClick={() => navigate('/app')}
            >
              {h.ctaButton}
              <ArrowRight size={20} className="ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-6 text-center text-muted-foreground">
        <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-medium">OpusVox</span>
          <p className="text-sm">{h.footerTagline}</p>
          <button
            className="text-sm hover:text-foreground transition-colors underline-offset-4 hover:underline"
            onClick={() => navigate('/app/legal')}
          >
            {h.footerLegal}
          </button>
        </div>
      </footer>
    </div>
  )
}
