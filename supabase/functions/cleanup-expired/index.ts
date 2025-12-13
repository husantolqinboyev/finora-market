// Deno runtime - types will be available at runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Deno environment variables - available at runtime
    // @ts-expect-error - Deno global is available at runtime
    const denoEnv = globalThis.Deno as { env: { get: (key: string) => string | undefined } }
    const supabaseUrl = denoEnv?.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = denoEnv?.env.get('SUPABASE_ANON_KEY') ?? ''
    
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseKey,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Clean up rejected listings that have expired
    const { error: deleteError } = await supabaseClient
      .rpc('delete_expired_rejected_listings')

    if (deleteError) {
      console.error('Error cleaning up expired listings:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to cleanup expired listings' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Also clean up regular expired listings
    const { error: regularDeleteError } = await supabaseClient
      .from('listings')
      .delete()
      .lt('expiry_date', new Date().toISOString())
      .neq('status', 'deleted')

    if (regularDeleteError) {
      console.error('Error cleaning up regular expired listings:', regularDeleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to cleanup regular expired listings' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ 
        message: 'Cleanup completed successfully',
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
