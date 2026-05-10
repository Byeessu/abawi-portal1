import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { amount, description, orderId, returnUrl, buyerEmail, buyerPhone } = await req.json()

    const masterKey = Deno.env.get("PAYDUNYA_MASTER_KEY")
    const accountKey = Deno.env.get("PAYDUNYA_ACCOUNT_KEY")
    const token = Deno.env.get("PAYDUNYA_TOKEN")
    const mode = Deno.env.get("PAYDUNYA_MODE") || "test"

    if (!masterKey || !accountKey || !token) {
      return new Response(
        JSON.stringify({ error: "Configuration PayDunya manquante" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const baseUrl = mode === "live"
      ? "https://app.paydunya.com"
      : "https://app.paydunya.com/sandbox"

    const payload = {
      account_key: accountKey,
      token: token,
      invoice: {
        total_amount: amount,
        description: description || "Billet SenTicket",
        items: [{
          name: description || "Billet",
          quantity: 1,
          unit_price: amount,
          total_price: amount,
        }],
      },
      store: {
        name: "SenTicket by ABAWI",
        tagline: "Billetterie événementielle",
        phone: "+221775185050",
        logo_url: "https://abawi-portal.netlify.app/logo.png",
      },
      custom_data: {
        order_id: orderId,
        buyer_email: buyerEmail,
        buyer_phone: buyerPhone,
      },
      actions: {
        cancel_url: returnUrl,
        return_url: returnUrl,
        callback_url: `${returnUrl}/api/webhook`,
      },
    }

    const response = await fetch(`${baseUrl}/api/v1/checkout-invoice/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "P-Authorization": masterKey,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (data.response_code !== "00") {
      return new Response(
        JSON.stringify({ error: data.response_text || "Erreur PayDunya" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl: data.response_text,
        token: data.token,
        invoiceToken: data.invoice_token,
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
