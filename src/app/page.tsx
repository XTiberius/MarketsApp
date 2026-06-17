import { ContentScrollBackground } from '@/components/ContentScrollBackground'
import { GlassAura } from '@/components/landing/GlassAura'
import { GlassPointer } from '@/components/landing/GlassPointer'
import { HeroPingPong } from '@/components/landing/HeroPingPong'
import { WhySection } from '@/components/landing/WhySection'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { NetworkSection } from '@/components/landing/NetworkSection'
import { ClosingCta } from '@/components/landing/ClosingCta'
import { ScrollOutro } from '@/components/landing/ScrollOutro'

export default function HomePage() {
  return (
    <>
      <ContentScrollBackground />
      <GlassAura />
      <GlassPointer />
      <HeroPingPong />
      <WhySection />
      <HowItWorks />
      <NetworkSection />
      <ClosingCta />
      <ScrollOutro />
    </>
  )
}
