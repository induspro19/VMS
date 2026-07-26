/**
 * Twilio WhatsApp API Helper for Enterprise VMS
 * Free Trial Sandbox Integration
 */

export const TWILIO_ACCOUNT_SID: string = 'AC47ca887e718fb4f0af5a7b4583a3ae5f';
export const TWILIO_AUTH_TOKEN: string = '2a43bc2ada28f3decf4a5882474c1f45';
export const TWILIO_WHATSAPP_NUMBER: string = 'whatsapp:+14155238886'; // Default Twilio Sandbox number

interface SendTwilioWhatsAppParams {
  phoneNumber: string;
  message: string;
}

const formatWhatsAppPhone = (phone: string): string => {
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return `whatsapp:+${cleaned}`;
};

/**
 * Send automated WhatsApp message via Twilio REST API
 */
export const sendTwilioWhatsApp = async ({ phoneNumber, message }: SendTwilioWhatsAppParams): Promise<boolean> => {
  if (!TWILIO_ACCOUNT_SID || TWILIO_ACCOUNT_SID.includes('YOUR_TWILIO')) {
    console.warn('Twilio credentials not configured');
    return false;
  }

  const recipientWhatsApp = formatWhatsAppPhone(phoneNumber);
  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

  const bodyData = new URLSearchParams();
  bodyData.append('From', TWILIO_WHATSAPP_NUMBER);
  bodyData.append('To', recipientWhatsApp);
  bodyData.append('Body', message);

  const authHeader = 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader,
      },
      body: bodyData.toString(),
    });

    const data = await response.json();
    if (response.ok && data.sid) {
      console.log(`Twilio WhatsApp sent successfully (SID: ${data.sid}) to ${recipientWhatsApp}`);
      return true;
    } else {
      console.error('Twilio WhatsApp API Error:', data);
      return false;
    }
  } catch (error) {
    console.error('Failed to send Twilio WhatsApp message:', error);
    return false;
  }
};
