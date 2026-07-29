import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    // 1. Verify this is a POST request from your VMS
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // 2. Parse the incoming visitor data
    const payload = await req.json();
    const visitor = payload.record;

    // 3. Stop if the checkout box isn't checked or phone is missing
    if (!visitor || !visitor.checkout || !visitor.phone) {
      return new Response(JSON.stringify({ message: 'Not a checkout event.' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Format the phone number (Automate API requires a clean number with a + sign)
    const formattedPhone = visitor.phone.replace(/\D/g, '');
    const apiPhone = `+${formattedPhone}`;

    // 5. Setup your API Variables
    const supabaseUrl = Deno.env.get('APP_PUBLIC_URL');
    
    // We are pulling your new API key from Supabase Secrets
    const theAutomateApiKey = Deno.env.get('THEAUTOMATE_API_KEY'); 
    const baseUrl = "https://userapi.theautomate.ai/api";

    if (!supabaseUrl || !theAutomateApiKey) {
      throw new Error("Missing required environment variables (APP_PUBLIC_URL or THEAUTOMATE_API_KEY).");
    }

    // Generate the custom QR checkout URL for the security gate
    const checkoutUrl = `${supabaseUrl}/checkout/${visitor.id}`;

    // Standard headers for the new API
    const apiHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${theAutomateApiKey}`
    };

    // ==========================================
    // API SEQUENCE STEP 1: CREATE CONTACT
    // ==========================================
    const contactResponse = await fetch(`${baseUrl}/contacts`, {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify({ 
        first_name: visitor.name || "Visitor", 
        phone: apiPhone 
      })
    });
    
    const contactData = await contactResponse.json();
    if (!contactData || !contactData.id) {
       throw new Error(`Step 1 Failed - Could not create contact: ${JSON.stringify(contactData)}`);
    }
    const contactId = contactData.id;

    // ==========================================
    // API SEQUENCE STEP 2: START CHAT
    // ==========================================
    const chatResponse = await fetch(`${baseUrl}/chats/start`, {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify({ contactId: contactId })
    });
    
    const chatData = await chatResponse.json();
    if (!chatData || !chatData.uuid) {
       throw new Error(`Step 2 Failed - Could not start chat: ${JSON.stringify(chatData)}`);
    }
    const chatUuid = chatData.uuid;

    // ==========================================
    // API SEQUENCE STEP 3: SEND TEMPLATE
    // ==========================================
    const templateResponse = await fetch(`${baseUrl}/chats/${chatUuid}/template`, {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify({
        // IMPORTANT: Replace the number below with your actual Approved Template ID
        templateId: 123456, 
        variables: {
          "1": visitor.employee_to_meet,
          "2": checkoutUrl
        }
      })
    });

    const finalResult = await templateResponse.json();

    // 6. Return Success
    return new Response(JSON.stringify({ success: true, api_response: finalResult }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // Return Error if any of the 3 steps fail
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
})