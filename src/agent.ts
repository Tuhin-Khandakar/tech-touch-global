import { agent, tool } from '@21st-sdk/agent'
import { z } from 'zod'

/**
 * Tech Touch Global Services — public-site assistant.
 *
 * Tone: warm, professional, bilingual-aware. Answers visitor questions
 * about our 7 services, pricing, the inquiry flow, and pushes the visitor
 * toward booking a free consultation. Does NOT make commitments on
 * pricing or eligibility — always defers to a human consultant.
 */
export default agent({
  model: 'claude-sonnet-4-6',
  systemPrompt: [
    'You are the AI concierge for Tech Touch Global Services, a Bangladesh-based',
    'multi-service consultancy. Services: technology solutions, study abroad',
    'consultancy, visa support, IELTS/PTE coaching, travel, investment, and',
    'export-import. Answer in the language the visitor uses (English or বাংলা).',
    '',
    'Guidelines:',
    '- Be concise. 1–3 short paragraphs maximum unless the user asks for detail.',
    '- Never quote a final price or guarantee an outcome — defer to a consultant.',
    '- Whenever a visitor shows real intent (asks about applying, signing up,',
    '  fees, timelines, country eligibility), invite them to submit a free',
    '  inquiry at /en/inquiry or call/WhatsApp the number on the contact page.',
    '- If a visitor asks about something outside our seven services, politely',
    '  redirect to what we DO cover and offer the consultation route.',
    '- You can use the `recommend_service` tool to suggest which service category',
    '  matches the visitor’s need.',
  ].join('\n'),
  tools: {
    recommend_service: tool({
      description:
        "Recommend which Tech Touch Global service category best matches a visitor's stated need.",
      inputSchema: z.object({
        need: z.string().describe('A short description of what the visitor wants help with.'),
      }),
      execute: async ({ need }) => {
        const text = need.toLowerCase()
        const rules: Array<[RegExp, string, string]> = [
          [/uk|usa|canada|australia|malaysia|china|university|study|admiss/i,
            'study-abroad',
            'Study Abroad consultancy — university selection, applications, SOPs, and visa documentation.'],
          [/ielts|pte|toefl|english test|band/i,
            'ielts-pte',
            'IELTS / PTE coaching — structured prep, full-length mocks, and 1-on-1 speaking sessions.'],
          [/visa|embassy|interview|sponsor/i,
            'visa',
            'Visa Services — student, tourist, business and family visas, end-to-end.'],
          [/flight|hotel|tour|hajj|umrah|holiday|travel/i,
            'travel',
            'Travel Services — flights, hotels, tour packages, Hajj & Umrah, group tours.'],
          [/website|app|software|mobile|tech|crm|erp|cloud|ai|cyber/i,
            'tech',
            'Technology Solutions — websites, mobile apps, custom software, cloud and security.'],
          [/invest|startup|funding|business plan|pitch/i,
            'investment',
            'Investment Support — startup advisory, investor connections, pitch decks and registration.'],
          [/export|import|trade|customs|supplier|buyer/i,
            'export-import',
            'Export & Import — trade docs, customs, supplier sourcing, and global buyer connections.'],
        ]
        for (const [pattern, slug, blurb] of rules) {
          if (pattern.test(text)) {
            return {
              content: [{
                type: 'text',
                text: `Recommended service: **${slug}**.\n${blurb}\nLearn more at /en/services/${slug} or submit a free inquiry at /en/inquiry.`,
              }],
            }
          }
        }
        return {
          content: [{
            type: 'text',
            text: 'I’m not sure which category fits — could you tell me a little more about what you’re trying to accomplish?',
          }],
        }
      },
    }),
  },
})
