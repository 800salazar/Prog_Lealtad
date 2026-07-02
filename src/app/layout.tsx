import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Programa de Lealtad",
  description: "Acumula visitas y gana recompensas.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
