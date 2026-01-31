import { Hero } from '@/components/Hero'
import { Services } from '@/components/Services'
import { Features } from '@/components/Features'
import { Process } from '@/components/Process'
import { Testimonials } from '@/components/Testimonials'
import { CTA } from '@/components/CTA'
import { Contact } from '@/components/Contact'

export default function Home() {
  return (
    <>
      <Hero />
      <Services />
      <Features />
      <Process />
      <Testimonials />
      <CTA />
      <Contact />
    </>
  )
}
