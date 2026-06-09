import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, pattern = 'MMM d, yyyy') {
  return format(new Date(date), pattern)
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(text: string, length: number) {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

export function buildApiResponse<T>(data: T): { success: true; data: T }
export function buildApiResponse<T>(
  data: null,
  error: string
): { success: false; error: string }
export function buildApiResponse<T>(data: T | null, error?: string) {
  if (error !== undefined) {
    return { success: false, error }
  }
  return { success: true, data }
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const SERVICE_LABELS: Record<string, string> = {
  tech: 'Technology Solutions',
  'study-abroad': 'Study Abroad',
  visa: 'Visa Support',
  'ielts-pte': 'IELTS / PTE Training',
  travel: 'Travel Services',
  investment: 'Startup Investment',
  'export-import': 'Export & Import',
  general: 'General Inquiry',
}

export const PAYMENT_METHODS = {
  bkash: { label: 'bKash', number: process.env.NEXT_PUBLIC_BKASH_NUMBER ?? '' },
  nagad: { label: 'Nagad', number: process.env.NEXT_PUBLIC_NAGAD_NUMBER ?? '' },
  bank: {
    label: 'Bank Transfer',
    account: process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? '',
    bank: process.env.NEXT_PUBLIC_BANK_NAME ?? '',
    routing: process.env.NEXT_PUBLIC_BANK_ROUTING ?? '',
  },
}
