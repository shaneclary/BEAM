import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface ContactSubmission {
  id?: string
  name: string
  email: string
  company?: string
  phone?: string
  service: string
  message: string
  current_site?: string
  created_at?: string
  status?: 'new' | 'contacted' | 'in_progress' | 'completed'
}

// Helper functions
export async function saveContactSubmission(data: Omit<ContactSubmission, 'id' | 'created_at' | 'status'>) {
  const { data: result, error } = await supabase
    .from('contact_submissions')
    .insert([
      {
        name: data.name,
        email: data.email,
        company: data.company || null,
        phone: data.phone || null,
        service: data.service,
        message: data.message,
        current_site: data.current_site || null,
        status: 'new',
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('Supabase error:', error)
    throw new Error('Failed to save contact submission')
  }

  return result
}

export async function getContactSubmissions() {
  const { data, error } = await supabase
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Supabase error:', error)
    throw new Error('Failed to fetch contact submissions')
  }

  return data
}
