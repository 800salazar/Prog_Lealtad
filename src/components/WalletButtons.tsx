import { isWalletConfigured } from "@/lib/wallet";
import { isGoogleWalletConfigured } from "@/lib/googleWallet";

/**
 * Botones "Agregar a Wallet". Cada uno solo se muestra si está configurado
 * en el servidor, para no ofrecer un botón roto. Apple ya es funcional
 * (genera el .pkpass); Google queda pendiente del módulo B12.
 */
export default function WalletButtons({ customerId }: { customerId: string }) {
  const showApple = isWalletConfigured();
  const showGoogle = isGoogleWalletConfigured();

  if (!showApple && !showGoogle) return null;

  return (
    <div className="space-y-2">
      {showApple && (
        <a
          href={`/api/wallet/${customerId}`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M16.365 1.43c0 1.14-.42 2.2-1.12 2.99-.78.88-2.05 1.56-3.1 1.48-.13-1.09.43-2.25 1.07-2.97.74-.84 2.05-1.46 3.15-1.5zM20.5 17.4c-.55 1.27-.82 1.83-1.53 2.95-.99 1.56-2.39 3.5-4.12 3.51-1.54.02-1.94-1.01-4.03-1-2.09.01-2.53 1.02-4.07 1-1.73-.02-3.06-1.77-4.05-3.33C-.06 17.27-.4 12.1 1.27 9.34c.83-1.39 2.32-2.27 3.93-2.29 1.56-.03 3.03 1.05 4.03 1.05.99 0 2.79-1.3 4.7-1.11.8.03 3.05.32 4.49 2.44-3.83 2.1-3.2 7.4.08 7.97z" />
          </svg>
          Agregar a Apple Wallet
        </a>
      )}

      {showGoogle && (
        <a
          href={`/api/wallet/google/${customerId}`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800 transition hover:bg-slate-50"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.12-1.43.34-2.09V7.06H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Agregar a Google Wallet
        </a>
      )}
    </div>
  );
}
