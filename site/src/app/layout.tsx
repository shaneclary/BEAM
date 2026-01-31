import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { IraChat } from '@/components/IraChat'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'BEAM | Free Small Business Mentoring & Resources',
  description: 'BEAM connects entrepreneurs with experienced mentors, free workshops, and business resources. A modern nonprofit empowering small business success.',
  keywords: ['small business mentoring', 'free business advice', 'entrepreneur resources', 'business workshops', 'nonprofit', 'SCORE alternative'],
  authors: [{ name: 'BEAM' }],
  openGraph: {
    title: 'BEAM | Free Small Business Mentoring & Resources',
    description: 'Connect with experienced mentors and access free resources to grow your business.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <IraChat />
      </body>
    </html>
  )
}
