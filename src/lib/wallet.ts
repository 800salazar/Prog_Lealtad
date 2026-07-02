import { PKPass } from "passkit-generator";
import fs from "node:fs/promises";
import path from "node:path";
import { solidPng } from "./png";
import type { CustomerStats } from "@/types/database";

/**
 * Decodifica un certificado en base64 desde las variables de entorno.
 */
function fromBase64(value: string | undefined): Buffer | null {
  if (!value) return null;
  return Buffer.from(value, "base64");
}

/**
 * Indica si la app tiene configurados los certificados de Apple Wallet.
 * El botón "Agregar a Apple Wallet" solo se muestra cuando esto es true.
 */
export function isWalletConfigured(): boolean {
  return Boolean(
    process.env.APPLE_PASS_TYPE_IDENTIFIER &&
      process.env.APPLE_TEAM_IDENTIFIER &&
      process.env.APPLE_WWDR_BASE64 &&
      process.env.APPLE_SIGNER_CERT_BASE64 &&
      process.env.APPLE_SIGNER_KEY_BASE64,
  );
}

/**
 * Carga una imagen desde public/wallet/ si existe; si no, genera un
 * placeholder de color sólido. Así el .pkpass siempre tiene íconos válidos.
 */
async function loadImage(
  fileName: string,
  fallbackSize: number,
  rgb: [number, number, number],
): Promise<Buffer> {
  try {
    const filePath = path.join(process.cwd(), "public", "wallet", fileName);
    return await fs.readFile(filePath);
  } catch {
    return solidPng(fallbackSize, fallbackSize, rgb);
  }
}

type BuildPassArgs = {
  stats: CustomerStats;
  /** Lo que codifica el QR del pase (normalmente la URL /card/[id]). */
  qrMessage: string;
};

/**
 * Construye y firma un pase .pkpass para un cliente.
 * Devuelve el Buffer listo para enviar como respuesta HTTP.
 */
export async function buildPkPass({
  stats,
  qrMessage,
}: BuildPassArgs): Promise<Buffer> {
  const wwdr = fromBase64(process.env.APPLE_WWDR_BASE64);
  const signerCert = fromBase64(process.env.APPLE_SIGNER_CERT_BASE64);
  const signerKey = fromBase64(process.env.APPLE_SIGNER_KEY_BASE64);

  if (!wwdr || !signerCert || !signerKey) {
    throw new Error(
      "Apple Wallet no está configurado: faltan certificados (APPLE_*_BASE64).",
    );
  }

  const brand: [number, number, number] = [15, 23, 42]; // slate-900
  const [icon, icon2x, logo, logo2x] = await Promise.all([
    loadImage("icon.png", 29, brand),
    loadImage("icon@2x.png", 58, brand),
    loadImage("logo.png", 160, brand),
    loadImage("logo@2x.png", 320, brand),
  ]);

  const pass = new PKPass(
    {
      "icon.png": icon,
      "icon@2x.png": icon2x,
      "logo.png": logo,
      "logo@2x.png": logo2x,
    },
    {
      wwdr,
      signerCert,
      signerKey,
      signerKeyPassphrase: process.env.APPLE_SIGNER_KEY_PASSPHRASE || undefined,
    },
    {
      serialNumber: stats.id,
      description: "Tarjeta de Lealtad",
      organizationName: process.env.APPLE_PASS_ORG_NAME || "Programa de Lealtad",
      passTypeIdentifier: process.env.APPLE_PASS_TYPE_IDENTIFIER!,
      teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER!,
      logoText: process.env.APPLE_PASS_ORG_NAME || "Lealtad",
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: "rgb(15, 23, 42)",
      labelColor: "rgb(148, 163, 184)",
    },
  );

  // Estilo de tarjeta de fidelización.
  pass.type = "storeCard";

  pass.headerFields.push({
    key: "member",
    label: "MIEMBRO",
    value: `#${stats.member_no}`,
  });

  pass.primaryFields.push({
    key: "name",
    label: "CLIENTE",
    value: `${stats.first_name} ${stats.last_name}`,
  });

  pass.secondaryFields.push({
    key: "visits",
    label: "VISITAS",
    value: String(stats.total_visits),
  });

  pass.secondaryFields.push({
    key: "rewards",
    label: stats.reward_label.toUpperCase(),
    value: String(stats.available_rewards),
  });

  pass.auxiliaryFields.push({
    key: "progress",
    label: "PROGRESO",
    value: `${stats.visits_in_cycle}/${stats.visits_required}`,
  });

  pass.backFields.push({
    key: "info",
    label: "Cómo funciona",
    value: `Acumula ${stats.visits_required} visitas y obtén una ${stats.reward_label.toLowerCase()}.`,
  });

  pass.setBarcodes({
    message: qrMessage,
    format: "PKBarcodeFormatQR",
    messageEncoding: "iso-8859-1",
    altText: `#${stats.member_no}`,
  });

  return pass.getAsBuffer();
}
