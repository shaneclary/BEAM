'use client'

import Link from 'next/link'
import { Sparkles, Twitter, Linkedin, Facebook, Instagram, Youtube, Mail } from 'lucide-react'

const footerLinks = {
  getHelp: [
    { label: 'Find a Mentor', href: '/mentoring' },
    { label: 'Workshops & Events', href: '/workshops' },
    { label: 'Online Courses', href: '/courses' },
    { label: 'Resource Library', href: '/resources' },
    { label: 'Business Plan Help', href: '/business-planning' },
  ],
  about: [
    { label: 'Our Mission', href: '/about' },
    { label: 'Success Stories', href: '/success-stories' },
    { label: 'Our Impact', href: '/impact' },
    { label: 'Leadership Team', href: '/team' },
    { label: 'Partners & Sponsors', href: '/partners' },
  ],
  getInvolved: [
    { label: 'Become a Mentor', href: '/volunteer' },
    { label: 'Donate', href: '/donate' },
    { label: 'Corporate Partnerships', href: '/partnerships' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact Us', href: '/contact' },
  ],
}

const socialLinks = [
  { icon: Facebook, href: 'https://facebook.com/beam', label: 'Facebook' },
  { icon: Twitter, href: 'https://twitter.com/beam', label: 'Twitter' },
  { icon: Linkedin, href: 'https://linkedin.com/company/beam', label: 'LinkedIn' },
  { icon: Instagram, href: 'https://instagram.com/beam', label: 'Instagram' },
  { icon: Youtube, href: 'https://youtube.com/beam', label: 'YouTube' },
]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Newsletter Section */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Stay in the loop</h3>
              <p className="text-gray-400">Get tips, resources, and workshop announcements delivered to your inbox.</p>
            </div>
            <form className="flex gap-3 w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-64 px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-beam-500 focus:border-transparent"
              />
              <button type="submit" className="btn-primary btn-md whitespace-nowrap">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-2xl font-bold text-white mb-4"
            >
              <Sparkles className="w-7 h-7 text-beam-400" />
              <span>BEAM</span>
            </Link>
            <p className="text-gray-400 mb-2">
              A 501(c)(3) nonprofit organization
            </p>
            <p className="text-gray-400 mb-6 max-w-sm">
              Empowering entrepreneurs with free mentoring, education, and resources to build successful small businesses.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-beam-600 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Get Help */}
          <div>
            <h4 className="text-white font-semibold mb-4">Get Help</h4>
            <ul className="space-y-3">
              {footerLinks.getHelp.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-white font-semibold mb-4">About BEAM</h4>
            <ul className="space-y-3">
              {footerLinks.about.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Get Involved */}
          <div>
            <h4 className="text-white font-semibold mb-4">Get Involved</h4>
            <ul className="space-y-3">
              {footerLinks.getInvolved.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              &copy; {currentYear} BEAM. All rights reserved. EIN: XX-XXXXXXX
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link href="/privacy" className="text-gray-500 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-500 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/accessibility" className="text-gray-500 hover:text-white transition-colors">
                Accessibility
              </Link>
              <Link href="/sitemap" className="text-gray-500 hover:text-white transition-colors">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
