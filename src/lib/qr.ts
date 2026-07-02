import QRCode from "qrcode";

/**
 * Genera un QR como Data URL (PNG en base64) para incrustar en <img>.
 * Se ejecuta en el servidor.
 */
export async function generateQrDataUrl(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    width: 320,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#0f172a", light: "#ffffff" },
  });
}

/**
 * Genera un QR como Buffer PNG (para incrustar dentro del .pkpass).
 */
export async function generateQrPngBuffer(data: string): Promise<Buffer> {
  return QRCode.toBuffer(data, {
    width: 480,
    margin: 1,
    errorCorrectionLevel: "M",
  });
}
