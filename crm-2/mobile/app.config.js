const baseConfig = require('./app.json');

const versionCode = process.env.VERSION_CODE
  ? parseInt(process.env.VERSION_CODE, 10)
  : baseConfig.expo.android.versionCode;

module.exports = {
  ...baseConfig,
  expo: {
    ...baseConfig.expo,
    android: {
      ...baseConfig.expo.android,
      versionCode,
    },
    extra: {
      ...baseConfig.expo.extra,
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || baseConfig.expo.extra.apiBaseUrl,
      supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL || baseConfig.expo.extra.supportEmail,
      supportPhone: process.env.EXPO_PUBLIC_SUPPORT_PHONE || baseConfig.expo.extra.supportPhone,
      supportWhatsApp: process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP || baseConfig.expo.extra.supportWhatsApp,
      privacyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL || baseConfig.expo.extra.privacyUrl,
      accountDeleteUrl: process.env.EXPO_PUBLIC_ACCOUNT_DELETE_URL || baseConfig.expo.extra.accountDeleteUrl,
    },
  },
};
