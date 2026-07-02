/**
 * Integración con Google Wallet (Loyalty Pass) — pendiente (módulo B12).
 * Requiere: cuenta de Issuer aprobada en Google Pay & Wallet Console +
 * Service Account de Google Cloud con la Wallet API habilitada.
 *
 * El botón "Agregar a Google Wallet" solo se muestra cuando
 * `isGoogleWalletConfigured()` es true, para no ofrecer un botón roto.
 */

export function isGoogleWalletConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_WALLET_ISSUER_ID &&
      process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON_BASE64,
  );
}
