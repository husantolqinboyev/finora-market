// @ts-expect-error - Deno types not available in IDE
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-expect-error - Supabase import for Deno
import { createClient } from '@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExpireListingsResponse {
  success: boolean
  expiredCount?: number
  message?: string
  error?: string
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    // @ts-expect-error - Deno environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    // @ts-expect-error - Deno environment variables
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const now = new Date().toISOString()

    // Delete expired listings completely
    const { data, error } = await supabase
      .from('listings')
      .delete()
      .lt('expires_at', now)
      .eq('status', 'approved')
      .select()

    if (error) {
      console.error('Error expiring listings:', error)
      throw error
    }

    console.log(`Deleted ${data?.length || 0} expired listings`)

    const response: ExpireListingsResponse = {
      success: true, 
      expiredCount: data?.length || 0,
      message: `Successfully deleted ${data?.length || 0} expired listings`
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error: unknown) {
    console.error('Error in expire-listings function:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const response: ExpireListingsResponse = {
      success: false, 
      error: errorMessage
    }
    
    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
