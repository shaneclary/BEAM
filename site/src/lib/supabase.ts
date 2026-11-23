import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

/** Created on first use, so the build does not need the Supabase keys. */
export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supabaseClient
}

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
  const { data: result, error } = await getSupabase()
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
  const { data, error } = await getSupabase()
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Supabase error:', error)
    throw new Error('Failed to fetch contact submissions')
  }

  return data
}
