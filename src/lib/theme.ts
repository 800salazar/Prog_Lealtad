import type { CSSProperties } from "react";

/**
 * Expone el color de marca del negocio como variable CSS (--brand) en un
 * contenedor. Los hijos usan clases Tailwind arbitrarias como
 * `bg-[var(--brand)]` para heredarlo. Así el encabezado y el botón de
 * registro cambian de color según lo configurado en `businesses.primary_color`.
 */
export function brandStyle(primaryColor: string): CSSProperties {
  return { "--brand": primaryColor } as CSSProperties;
}
