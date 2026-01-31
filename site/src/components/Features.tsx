'use client'

import { Heart, Users, Award, Globe, Clock, DollarSign } from 'lucide-react'

const features = [
  {
    icon: DollarSign,
    title: '100% Free',
    description: 'All our services are completely free. No hidden fees, no premium tiers. Just free support for your business.',
    stat: '$0',
    statLabel: 'Always',
  },
  {
    icon: Users,
    title: 'Expert Mentors',
    description: 'Our mentors are experienced business owners, executives, and industry experts who volunteer their time.',
    stat: '10K+',
    statLabel: 'Active mentors',
  },
  {
    icon: Heart,
    title: 'Personalized Support',
    description: 'Get matched with mentors who understand your industry, challenges, and goals. No one-size-fits-all advice.',
    stat: '1:1',
    statLabel: 'Dedicated mentor',
  },
  {
    icon: Clock,
    title: 'Flexible & Convenient',
    description: 'Meet with your mentor online or in-person, on your schedule. Most mentors respond within 48 hours.',
    stat: '48hr',
    statLabel: 'Avg. response',
  },
  {
    icon: Globe,
    title: 'Nationwide Network',
    description: 'Access mentors and resources from anywhere in the country. Virtual options make help accessible to all.',
    stat: '50',
    statLabel: 'States covered',
  },
  {
    icon: Award,
    title: 'Proven Results',
    description: 'Businesses that work with BEAM mentors are more likely to succeed and grow. Our track record speaks for itself.',
    stat: '87%',
    statLabel: 'Success rate',
  },
]

export function Features() {
  return (
    <section id="features" className="section bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-100 text-accent-700 rounded-full text-sm font-medium mb-4">
            Why Choose BEAM
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Real help from people who{' '}
            <span className="gradient-text">get it</span>
          </h2>
          <p className="text-lg text-gray-600">
            BEAM is a network of experienced business professionals who volunteer their time to help entrepreneurs like you succeed. No sales pitches, no upsells — just genuine guidance.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="relative group"
            >
              {/* Background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-beam-50 to-accent-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative p-6 lg:p-8">
                {/* Top row: icon and stat */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-beam-500 to-beam-600 flex items-center justify-center text-white shadow-lg shadow-beam-500/25">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-beam-600">{feature.stat}</div>
                    <div className="text-xs text-gray-500">{feature.statLabel}</div>
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-4 p-6 bg-gradient-to-r from-beam-50 to-accent-50 rounded-2xl">
            <div className="text-left">
              <div className="font-semibold text-gray-900">Ready to meet your mentor?</div>
              <div className="text-sm text-gray-600">Sign up in 2 minutes and get matched for free.</div>
            </div>
            <a href="/signup" className="btn-primary btn-md whitespace-nowrap">
              Get Started Free
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
