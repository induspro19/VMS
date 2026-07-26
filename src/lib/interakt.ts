/**
 * Interakt WhatsApp API Helper for Enterprise VMS
 * Interakt Docs: https://docs.interakt.ai/
 */

// Replace this with your secret API Key from Interakt Dashboard -> Settings -> Developer Settings
export const INTERAKT_API_KEY = 'YOUR_INTERAKT_SECRET_KEY_HERE';

interface SendWhatsAppTemplateParams {
  countryCode?: string; // Default '+91' for India
  phoneNumber: string;  // e.g. '9876543210' or '+919876543210'
  templateName: string; // Approved template name in Interakt
  languageCode?: string; // e.g. 'en'
  bodyValues?: string[]; // Dynamic variables in your template {{1}}, {{2}}, etc.
  headerValues?: string[]; // Dynamic header variable
  buttonValues?: Record<string, string[]>; // Quick reply / URL button dynamic values
}

/**
 * Clean phone number to separate country code and 10-digit mobile
 */
const parsePhoneNumber = (phone: string, defaultCountryCode: string = '+91') => {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('+')) {
    const ccMatch = cleaned.match(/^(\+\d{1,3})(\d{10})$/);
    if (ccMatch) {
      return { countryCode: ccMatch[1], phoneNumber: ccMatch[2] };
    }
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return { countryCode: '+91', phoneNumber: cleaned.substring(2) };
  } else if (cleaned.length === 10) {
    return { countryCode: defaultCountryCode, phoneNumber: cleaned };
  }
  return { countryCode: defaultCountryCode, phoneNumber: cleaned };
};

/**
 * Send Automated WhatsApp Template Message via Interakt REST API
 */
export const sendInteraktWhatsAppNotification = async ({
  countryCode = '+91',
  phoneNumber,
  templateName,
  languageCode = 'en',
  bodyValues = [],
  headerValues = [],
  buttonValues = {}
}: SendWhatsAppTemplateParams): Promise<boolean> => {
  if (!INTERAKT_API_KEY || INTERAKT_API_KEY === 'YOUR_INTERAKT_SECRET_KEY_HERE') {
    console.warn('Interakt API Key is not configured in src/lib/interakt.ts');
    return false;
  }

  const parsed = parsePhoneNumber(phoneNumber, countryCode);

  const payload = {
    countryCode: parsed.countryCode,
    phoneNumber: parsed.phoneNumber,
    type: 'Template',
    template: {
      name: templateName,
      languageCode: languageCode,
      headerValues: headerValues,
      bodyValues: bodyValues,
      buttonValues: buttonValues
    }
  };

  try {
    const response = await fetch('https://api.interakt.ai/v1/public/message/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${INTERAKT_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (response.ok && result.result) {
      console.log(`WhatsApp message sent successfully via Interakt to ${parsed.countryCode}${parsed.phoneNumber}`);
      return true;
    } else {
      console.error('Interakt WhatsApp API Error:', result);
      return false;
    }
  } catch (error) {
    console.error('Failed to connect to Interakt API:', error);
    return false;
  }
};
