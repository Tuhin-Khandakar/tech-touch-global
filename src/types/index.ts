export type Locale = 'en' | 'bn'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    total: number
    page: number
    limit: number
  }
}

export interface Inquiry {
  id: string
  name: string
  email: string
  phone: string
  service: string
  message: string
  status: 'new' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
  updated_at: string
}

export interface BlogPost {
  id: string
  title: string
  title_bn: string
  slug: string
  excerpt: string
  excerpt_bn: string
  content: string
  content_bn: string
  cover_image: string
  category: string
  author: string
  published: boolean
  created_at: string
  updated_at: string
}

export interface GalleryItem {
  id: string
  title: string
  title_bn: string
  image_url: string
  category: string
  created_at: string
}

export interface PaymentSubmission {
  id: string
  inquiry_id: string | null
  service: string
  amount: string
  payment_method: 'bkash' | 'nagad' | 'bank'
  transaction_id: string
  sender_number: string
  status: 'pending' | 'confirmed' | 'rejected'
  note: string
  /** Public URL of an uploaded payment receipt screenshot (Supabase Storage). May be empty. */
  screenshot_url: string
  /** Payer's name as entered on the form. Falls back to empty string for legacy rows. */
  payer_name: string
  /** Payer's email — optional convenience field. */
  payer_email: string
  created_at: string
  updated_at: string
}

export interface Testimonial {
  id: string
  name: string
  name_bn: string
  role: string
  role_bn: string
  content: string
  content_bn: string
  avatar: string
  rating: number
  service: string
  published: boolean
}

export interface CareerOpening {
  id: string
  title: string
  title_bn: string
  department: string
  type: 'full-time' | 'part-time' | 'internship' | 'remote'
  location: string
  description: string
  description_bn: string
  requirements: string
  published: boolean
  created_at: string
}

export interface ChatSession {
  id: string
  visitor_name: string
  visitor_email: string
  status: 'open' | 'active' | 'closed'
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  session_id: string
  sender: 'visitor' | 'admin'
  content: string
  created_at: string
}

export interface SiteSettings {
  phone: string
  whatsapp: string
  email: string
  address: string
  address_bn: string
  facebook: string
  linkedin: string
  youtube: string
  bkash_number: string
  nagad_number: string
  bank_account: string
  bank_name: string
  bank_routing: string
}

export interface StudyCountry {
  id: string
  slug: string
  name: string
  name_bn: string
  flag_emoji: string
  image_url: string
  description: string
  description_bn: string
  tuition_range: string
  scholarship_info: string
  visa_process: string
  intake_dates: string
  job_opportunities: string
  top_universities: string[]
  display_order: number
  published: boolean
  created_at?: string
  updated_at?: string
}

export type ServiceCategory =
  | 'tech'
  | 'study-abroad'
  | 'visa'
  | 'ielts-pte'
  | 'travel'
  | 'investment'
  | 'export-import'

export interface NavItem {
  label: string
  href: string
  children?: NavItem[]
}

export interface AdminUser {
  id: string
  email: string
  role: 'super_admin' | 'admin' | 'editor'
}
