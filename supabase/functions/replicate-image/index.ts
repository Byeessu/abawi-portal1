// Supabase Edge Function - Proxy pour Replicate API
// Contourne les problèmes CORS du navigateur
// Gère l'authentification côté serveur

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const REPLICATE_API_TOKEN = Deno.env.get('REPLICATE_API_TOKEN') || ''
const REPLICATE_BASE_URL = 'https://api.replicate.com/v1'

// Debug logs
console.log('Edge Function starting...')
console.log('REPLICATE_API_TOKEN exists:', !!REPLICATE_API_TOKEN)
console.log('REPLICATE_API_TOKEN length:', REPLICATE_API_TOKEN.length)

serve(async (req) => {
  // CORS headers - autorise toutes les origines
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const path = url.pathname.replace('/replicate-image', '')
    console.log('Request path:', path)
    console.log('Request method:', req.method)

    // POST /predictions - créer une prédiction
    if (path === '/predictions' && req.method === 'POST') {
      const body = await req.json()
      console.log('Request body keys:', Object.keys(body))
      console.log('Model:', body.version)
      
      if (!REPLICATE_API_TOKEN) {
        console.error('REPLICATE_API_TOKEN not configured')
        return new Response(
          JSON.stringify({ 
            error: 'REPLICATE_API_TOKEN not configured in Supabase secrets. Add REPLICATE_API_TOKEN to Supabase dashboard > Settings > Edge Functions > Secrets' 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Forwarding to Replicate API...')
      
      // Forward to Replicate avec authentification côté serveur
      const replicateRes = await fetch(`${REPLICATE_BASE_URL}/predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Prefer': 'respond-async',
        },
        body: JSON.stringify(body),
      })

      console.log('Replicate response status:', replicateRes.status)
      
      const data = await replicateRes.json()
      console.log('Replicate response keys:', Object.keys(data))
      
      if (!replicateRes.ok) {
        console.error('Replicate API error:', data)
      }
      
      return new Response(
        JSON.stringify(data),
        { 
          status: replicateRes.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // GET /predictions/{id} - récupérer le statut
    if (path.startsWith('/predictions/') && req.method === 'GET') {
      const predictionId = path.replace('/predictions/', '')
      console.log('Getting prediction:', predictionId)
      
      if (!REPLICATE_API_TOKEN) {
        return new Response(
          JSON.stringify({ error: 'REPLICATE_API_TOKEN not configured in Supabase secrets' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const replicateRes = await fetch(`${REPLICATE_BASE_URL}/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        },
      })

      console.log('Get prediction status:', replicateRes.status)
      const data = await replicateRes.json()
      console.log('Get prediction keys:', Object.keys(data))
      
      return new Response(
        JSON.stringify(data),
        { 
          status: replicateRes.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Path not found:', path)
    return new Response(
      JSON.stringify({ error: 'Not found', path }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        stack: error.stack,
        hint: 'Check Supabase Edge Function logs and REPLICATE_API_TOKEN configuration'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
