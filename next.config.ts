import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // passkit-generator usa módulos nativos de Node (zip, crypto) que no deben
  // ser empaquetados por el bundler del servidor.
  serverExternalPackages: ["passkit-generator"],
};

export default nextConfig;
