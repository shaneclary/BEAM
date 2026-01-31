import { NextRequest, NextResponse } from 'next/server'
import { saveContactSubmission } from '@/lib/supabase'
import { sendContactNotification, sendContactConfirmation } from '@/lib/resend'

// Validation schema
interface ContactFormData {
  name: string
  email: string
  company?: string
  phone?: string
  service: string
  message: string
  currentSite?: string
}

function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

function validateFormData(data: unknown): ContactFormData {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid form data')
  }

  const formData = data as Record<string, unknown>

  // Required fields
  if (!formData.name || typeof formData.name !== 'string' || formData.name.trim().length < 2) {
    throw new Error('Name is required and must be at least 2 characters')
  }

  if (!formData.email || typeof formData.email !== 'string' || !validateEmail(formData.email)) {
    throw new Error('A valid email address is required')
  }

  if (!formData.service || typeof formData.service !== 'string') {
    throw new Error('Please select a service')
  }

  if (!formData.message || typeof formData.message !== 'string' || formData.message.trim().length < 10) {
    throw new Error('Message must be at least 10 characters')
  }

  // Sanitize and return
  return {
    name: formData.name.trim(),
    email: formData.email.trim().toLowerCase(),
    company: formData.company && typeof formData.company === 'string' ? formData.company.trim() : undefined,
    phone: formData.phone && typeof formData.phone === 'string' ? formData.phone.trim() : undefined,
    service: formData.service.trim(),
    message: formData.message.trim(),
    currentSite: formData.currentSite && typeof formData.currentSite === 'string' ? formData.currentSite.trim() : undefined,
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()

    // Validate form data
    const validatedData = validateFormData(body)

    // Save to Supabase
    await saveContactSubmission({
      name: validatedData.name,
      email: validatedData.email,
      company: validatedData.company,
      phone: validatedData.phone,
      service: validatedData.service,
      message: validatedData.message,
      current_site: validatedData.currentSite,
    })

    // Send emails (in parallel)
    await Promise.all([
      // Notification to BEAM team
      sendContactNotification(validatedData),
      // Confirmation to the user
      sendContactConfirmation(validatedData),
    ])

    return NextResponse.json(
      { success: true, message: 'Contact form submitted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact form error:', error)

    const message = error instanceof Error ? error.message : 'Something went wrong'
    const status = message.includes('required') || message.includes('valid') ? 400 : 500

    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: '/api/contact' })
}
