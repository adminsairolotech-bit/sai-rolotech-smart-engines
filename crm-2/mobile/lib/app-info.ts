import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const SUPPORT_EMAIL = String(extra.supportEmail || 'sairolotech@gmail.com');
export const SUPPORT_PHONE = String(extra.supportPhone || '+919899925274');
export const SUPPORT_WHATSAPP = String(extra.supportWhatsApp || 'https://wa.me/919899925274');
export const PRIVACY_URL = String(extra.privacyUrl || 'https://www.sairolotech.com');
export const ACCOUNT_DELETE_URL = String(extra.accountDeleteUrl || 'https://www.sairolotech.com');
