import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { token } = await req.json()

    const masterKey = Deno.env.get("PAYDUNYA_MASTER_KEY")
    const mode = Deno.env.get("PAYDUNYA_MODE") || "test"

    if (!masterKey) {
      return new Response(
        JSON.stringify({ error: "Configuration PayDunya manquante" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const baseUrl = mode === "live"
      ? "https://app.paydunya.com"
      : "https://app.paydunya.com/sandbox"

    const response = await fetch(`${baseUrl}/api/v1/checkout-invoice/confirm/${token}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "P-Authorization": masterKey,
      },
    })

    const data = await response.json()

    return new Response(
      JSON.stringify({
        success: data.response_code === "00",
        status: data.status || "unknown",
        data,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
