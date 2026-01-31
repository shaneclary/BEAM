'use client'

import { ArrowUpRight, Users, BookOpen, FileText, Calendar, Video, Briefcase } from 'lucide-react'
import Link from 'next/link'

const services = [
  {
    icon: Users,
    title: '1-on-1 Mentoring',
    description: 'Get matched with an experienced business mentor who understands your industry. Free, confidential guidance tailored to your needs.',
    features: ['Personalized matching', 'Flexible scheduling', 'Ongoing support'],
    color: 'beam',
    href: '/mentoring',
  },
  {
    icon: Calendar,
    title: 'Workshops & Webinars',
    description: 'Join live sessions on business planning, marketing, finance, and more. Learn from experts and connect with fellow entrepreneurs.',
    features: ['Live & on-demand', 'Expert instructors', 'Q&A sessions'],
    color: 'accent',
    href: '/workshops',
  },
  {
    icon: BookOpen,
    title: 'Online Courses',
    description: 'Self-paced learning paths covering everything from startup basics to scaling strategies. Earn certificates as you progress.',
    features: ['Self-paced learning', 'Certificates included', '50+ courses'],
    color: 'beam',
    href: '/courses',
  },
  {
    icon: FileText,
    title: 'Resource Library',
    description: 'Access hundreds of free templates, guides, and tools. Business plans, financial templates, marketing checklists, and more.',
    features: ['500+ templates', 'Downloadable tools', 'Updated regularly'],
    color: 'accent',
    href: '/resources',
  },
  {
    icon: Video,
    title: 'Virtual Office Hours',
    description: 'Drop in for quick questions and advice. Our mentors host regular open sessions where you can get answers fast.',
    features: ['No appointment needed', 'Multiple time slots', 'Topic-specific'],
    color: 'beam',
    href: '/office-hours',
  },
  {
    icon: Briefcase,
    title: 'Business Planning',
    description: 'Work with a mentor to create or refine your business plan. Get the roadmap you need to secure funding and grow.',
    features: ['Plan templates', 'Financial projections', 'Pitch deck help'],
    color: 'accent',
    href: '/business-planning',
  },
]

export function Services() {
  return (
    <section id="services" className="section bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-beam-100 text-beam-700 rounded-full text-sm font-medium mb-4">
            How We Help
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Everything you need to{' '}
            <span className="gradient-text">succeed</span>
          </h2>
          <p className="text-lg text-gray-600">
            From one-on-one mentoring to self-paced courses, we offer multiple ways to get the guidance and resources your business needs — all completely free.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {services.map((service, index) => (
            <div
              key={service.title}
              className="group card-hover p-6 lg:p-8"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110 ${
                service.color === 'beam'
                  ? 'bg-beam-100 text-beam-600'
                  : 'bg-accent-100 text-accent-600'
              }`}>
                <service.icon className="w-6 h-6" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-beam-600 transition-colors">
                {service.title}
              </h3>
              <p className="text-gray-600 mb-5">
                {service.description}
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-6">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-gray-500">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      service.color === 'beam' ? 'bg-beam-500' : 'bg-accent-500'
                    }`} />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Link */}
              <Link
                href={service.href}
                className="inline-flex items-center gap-1 text-sm font-medium text-beam-600 hover:text-beam-700 group/link"
              >
                Learn more
                <ArrowUpRight className="w-4 h-4 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 bg-gradient-to-r from-beam-50 to-accent-50 rounded-2xl">
            <div className="text-center sm:text-left">
              <div className="font-semibold text-gray-900">Not sure where to start?</div>
              <div className="text-sm text-gray-600">Take our 2-minute quiz to get personalized recommendations.</div>
            </div>
            <Link href="/quiz" className="btn-primary btn-md whitespace-nowrap">
              Find Your Path
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
