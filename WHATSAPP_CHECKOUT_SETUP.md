# WhatsApp smart checkout setup

The WhatsApp API key stays in a Supabase Edge Function, never in the React app. The function re-checks that the selected visitor's meeting is complete before sending their registered number a checkout link.

## 1. Configure the fixed company QR

Your printed/displayed company QR must contain the registration URL, for example:

```text
https://your-company-domain.example/#/register
```

The checkout scanner accepts this exact QR value. For a different fixed QR value, create a local `.env.local` file with:

```text
VITE_COMPANY_QR_VALUE=https://your-fixed-qr-value
```

`VITE_COMPANY_QR_VALUE` is not a secret and must exactly match the data in the company QR.

## 2. Configure and deploy the sender

The Automate AI developer page provided did not expose a public send-message endpoint schema. Copy its documented send URL and authentication format into these server-only secrets:

```powershell
supabase secrets set APP_PUBLIC_URL="https://your-company-domain.example" VMS_SUPABASE_SERVICE_ROLE_KEY="<your Supabase secret key>" THEAUTOMATE_API_KEY="<your API key>" THEAUTOMATE_SEND_URL="<provider send-message URL>"
```

The function sends this JSON body: `recipient`, `message`, and `actionUrl`. By default it sends the key as `Authorization: Bearer <key>`. If the provider documentation specifies another header or no prefix, set these additional secrets:

```powershell
supabase secrets set THEAUTOMATE_API_KEY_HEADER="X-API-Key" THEAUTOMATE_API_KEY_PREFIX=""
```

Then deploy:

```powershell
supabase functions deploy send-checkout-whatsapp
```

## 3. Verify the flow

Register from the fixed company QR, approve and check in the visitor, have the host mark the meeting complete, open the WhatsApp link, and scan that same fixed company QR at the exit gate. No visitor QR pass is generated.
