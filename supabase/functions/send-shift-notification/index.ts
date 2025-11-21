import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// Folosim Resend pentru a trimite emailuri simplu și rapid
import { Resend } from "npm:resend"

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { shiftTitle, approvedBy, date, recipientEmail } = await req.json()

    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Sau domeniul tău propriu
      to: recipientEmail, // Adresa admin-ului sau a clientului
      subject: `✅ Raport Aprobat: ${shiftTitle}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #059669;">Raport Finalizat</h2>
          <p>Raportul pentru lucrarea <strong>${shiftTitle}</strong> a fost aprobat și închis.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;" />
          <p><strong>Data lucrării:</strong> ${date}</p>
          <p><strong>Semnat de:</strong> ${approvedBy}</p>
          <br />
          <a href="https://workforcehub-app.com" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Vezi detalii în aplicație</a>
        </div>
      `
    })

    if (error) throw error

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})