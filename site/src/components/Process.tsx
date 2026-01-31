'use client'

import { MessageSquare, Lightbulb, Hammer, Rocket } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: MessageSquare,
    title: 'Discovery Call',
    description: 'We start with a free consultation to understand your business, goals, and challenges. No sales pitch — just a genuine conversation.',
    duration: '30 min call',
  },
  {
    number: '02',
    icon: Lightbulb,
    title: 'Strategy & Design',
    description: 'We create a custom plan and design mockups for your approval. You\'ll see exactly what your site will look like before we build it.',
    duration: '1 week',
  },
  {
    number: '03',
    icon: Hammer,
    title: 'Development',
    description: 'Our team builds your site with clean code, fast performance, and SEO best practices baked in. Weekly updates keep you in the loop.',
    duration: '2-3 weeks',
  },
  {
    number: '04',
    icon: Rocket,
    title: 'Launch & Support',
    description: 'We handle the launch, monitor for issues, and provide ongoing support. Your success is our success — we\'re here for the long haul.',
    duration: 'Ongoing',
  },
]

export function Process() {
  return (
    <section id="process" className="section bg-gray-900 text-white relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M0%200h40v40H0V0zm1%201h38v38H1V1z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-beam-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-beam-300 rounded-full text-sm font-medium mb-4 backdrop-blur-sm">
            Our Process
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            From idea to launch in{' '}
            <span className="text-beam-400">four simple steps</span>
          </h2>
          <p className="text-lg text-gray-400">
            No complicated process. No endless meetings. Just a straightforward path to your new website.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection line - desktop */}
          <div className="hidden lg:block absolute top-24 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-beam-500/50 via-accent-500/50 to-beam-500/50" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative group"
              >
                {/* Step card */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-8 hover:bg-white/10 transition-all duration-300 h-full">
                  {/* Number badge */}
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-beam-500 to-accent-500 flex items-center justify-center text-2xl font-bold shadow-lg shadow-beam-500/25 group-hover:scale-110 transition-transform duration-300">
                      {step.number}
                    </div>
                    {/* Icon overlay */}
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-gray-900 border border-white/20 flex items-center justify-center">
                      <step.icon className="w-4 h-4 text-beam-400" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-gray-400 mb-4">{step.description}</p>

                  {/* Duration badge */}
                  <div className="inline-flex items-center px-3 py-1 bg-beam-500/20 text-beam-300 rounded-full text-sm">
                    {step.duration}
                  </div>
                </div>

                {/* Arrow connector - mobile/tablet */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center my-4">
                    <div className="w-0.5 h-8 bg-gradient-to-b from-beam-500/50 to-accent-500/50" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-400 mb-6">
            Ready to start your project? Let's talk about your goals.
          </p>
          <a href="#contact" className="btn bg-white text-gray-900 hover:bg-gray-100 btn-lg">
            Schedule Your Free Call
          </a>
        </div>
      </div>
    </section>
  )
}
