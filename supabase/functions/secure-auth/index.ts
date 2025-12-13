// Server-side middleware for HttpOnly cookie security
// This should be deployed as a Supabase Edge Function or server middleware

import './types.d.ts'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface Request {
  method: string;
  headers: {
    get: (name: string) => string | null;
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Security headers
    const securityHeaders = {
      ...corsHeaders,
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Set-Cookie': 'Secure; HttpOnly; SameSite=Strict'
    }

    // Rate limiting by IP
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitKey = `rate_limit:${clientIP}`
    
    // Implement rate limiting logic here
    // Redis or similar would be ideal for production
    
    return new Response(
      JSON.stringify({ secure: true }),
      { 
        headers: securityHeaders,
        status: 200 
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { 
        headers: corsHeaders,
        status: 500 
      }
    )
  }
})
