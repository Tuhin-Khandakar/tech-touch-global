import { createTokenHandler } from '@21st-sdk/nextjs/server'

/**
 * Short-lived token issuer for the 21st-sdk chat widget.
 *
 * The browser never sees the API_KEY_21ST secret — it calls this route
 * which exchanges the secret server-side for a scoped, short-lived token
 * the SDK uses to talk to the 21st.dev runtime.
 */
export const POST = createTokenHandler({
  apiKey: process.env.API_KEY_21ST!,
})
