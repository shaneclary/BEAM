'use client'

import { ArrowRight, Users, BookOpen, Lightbulb } from 'lucide-react'
import Link from 'next/link'

const highlights = [
  { icon: Users, text: '10,000+ mentors nationwide' },
  { icon: BookOpen, text: 'Free workshops & courses' },
  { icon: Lightbulb, text: '100% free resources' },
]

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-beam-50 via-white to-accent-50/30" />
      <div className="absolute inset-0 bg-hero-pattern" />

      {/* Gradient orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-beam-400/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-400/20 rounded-full blur-3xl animate-float animate-delay-300" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-beam-100 text-beam-700 rounded-full text-sm font-medium mb-6 animate-fade-in">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              A 501(c)(3) Nonprofit Organization
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6 animate-slide-up">
              Free mentoring to help your business{' '}
              <span className="gradient-text">thrive</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0 animate-slide-up animate-delay-100">
              Connect with experienced business mentors, attend free workshops, and access the resources you need to start, grow, or pivot your small business.
            </p>

            {/* Highlights */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-8 animate-slide-up animate-delay-200">
              {highlights.map((item) => (
                <div key={item.text} className="flex items-center gap-2 text-gray-600">
                  <item.icon className="w-5 h-5 text-beam-500" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up animate-delay-300">
              <Link href="/signup" className="btn-primary btn-lg group">
                Find a Mentor — It's Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="#services" className="btn-secondary btn-lg">
                Explore Resources
              </Link>
            </div>
          </div>

          {/* Visual - Impact Stats */}
          <div className="relative animate-fade-in animate-delay-400">
            <div className="bg-white rounded-3xl shadow-2xl shadow-beam-500/10 border border-gray-100 overflow-hidden p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Our Impact</h2>
                <p className="text-gray-500">Helping entrepreneurs succeed since 2024</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-beam-50 to-beam-100 rounded-2xl p-6 text-center">
                  <div className="text-4xl font-bold text-beam-600 mb-1">50K+</div>
                  <div className="text-sm text-gray-600">Entrepreneurs Helped</div>
                </div>
                <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-2xl p-6 text-center">
                  <div className="text-4xl font-bold text-accent-600 mb-1">10K+</div>
                  <div className="text-sm text-gray-600">Volunteer Mentors</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 text-center">
                  <div className="text-4xl font-bold text-green-600 mb-1">500+</div>
                  <div className="text-sm text-gray-600">Free Workshops/Year</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 text-center">
                  <div className="text-4xl font-bold text-orange-600 mb-1">$2B+</div>
                  <div className="text-sm text-gray-600">Revenue Generated</div>
                </div>
              </div>

              {/* Testimonial snippet */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-gray-600 text-sm italic mb-3">
                  "My BEAM mentor helped me turn a side hustle into a six-figure business. The guidance was invaluable."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-beam-400 to-accent-400 flex items-center justify-center text-white text-xs font-medium">
                    MR
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Maria Rodriguez</div>
                    <div className="text-xs text-gray-500">Founder, Bright Bakes Co.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating cards */}
            <div className="absolute -left-8 top-1/4 bg-white p-4 rounded-xl shadow-lg border border-gray-100 animate-float hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-medium">New Match!</div>
                  <div className="text-xs text-gray-500">Mentor assigned</div>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 bottom-1/3 bg-white p-4 rounded-xl shadow-lg border border-gray-100 animate-float animate-delay-500 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-beam-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-beam-600" />
                </div>
                <div>
                  <div className="text-sm font-medium">Free Workshop</div>
                  <div className="text-xs text-gray-500">Starting in 2 hours</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
        <div className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-gray-400 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  )
}
