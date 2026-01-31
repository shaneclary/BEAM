'use client'

import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'Owner, Mitchell\'s Bakery',
    image: '/testimonials/sarah.jpg',
    content: 'BEAM transformed our outdated Wix site into something we\'re truly proud of. Our online orders have doubled since the launch. The team was patient, professional, and truly cared about our success.',
    rating: 5,
  },
  {
    name: 'Marcus Johnson',
    role: 'Founder, Johnson Landscaping',
    image: '/testimonials/marcus.jpg',
    content: 'As someone who isn\'t tech-savvy, I was nervous about redesigning our website. BEAM made it painless. They explained everything in plain English and delivered exactly what they promised.',
    rating: 5,
  },
  {
    name: 'Emily Chen',
    role: 'Director, Chen Family Dentistry',
    image: '/testimonials/emily.jpg',
    content: 'We needed a website that looked professional and helped patients book appointments easily. BEAM delivered beyond our expectations. New patient bookings are up 60%!',
    rating: 5,
  },
]

const stats = [
  { value: '100+', label: 'Happy Clients' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '4.9', label: 'Average Rating' },
  { value: '24hr', label: 'Support Response' },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="section bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-beam-100 text-beam-700 rounded-full text-sm font-medium mb-4">
            Testimonials
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Loved by businesses{' '}
            <span className="gradient-text">just like yours</span>
          </h2>
          <p className="text-lg text-gray-600">
            Don't just take our word for it. Here's what our clients have to say about working with BEAM.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="relative bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:border-beam-100 transition-all duration-300"
            >
              {/* Quote icon */}
              <div className="absolute -top-4 left-8">
                <div className="w-8 h-8 bg-beam-500 rounded-lg flex items-center justify-center">
                  <Quote className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4 pt-2">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-beam-400 to-accent-400 flex items-center justify-center text-white font-semibold">
                  {testimonial.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="bg-gradient-to-r from-beam-600 to-beam-700 rounded-2xl p-8 md:p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-beam-200 text-sm md:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
