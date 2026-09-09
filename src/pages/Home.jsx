import Hero from "../components/home/Hero"
import ClientsMarquee from "../components/home/ClientsMarquee"
import WhyUs from "../components/home/WhyUs"
import RampRule from "../components/home/RampRule"
import ChallengesSection from "../components/home/ChallengesSection"
import StatBand from "../components/home/StatBand"
import RecordSection from "../components/home/RecordSection"
import EnterpriseSection from "../components/home/EnterpriseSection"
import ProofSection from "../components/home/ProofSection"
import ClosingBand from "../components/home/ClosingBand"

export default function Home() {
  return (
    <main id="top">
      <Hero />
      <ClientsMarquee />
      <WhyUs />
      <RampRule />
      <ChallengesSection />
      <StatBand />
      <RecordSection />
      <RampRule reverse />
      <EnterpriseSection />
      <ProofSection />
      <ClosingBand />
    </main>
  )
}
