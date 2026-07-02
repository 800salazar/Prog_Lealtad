// Botón "Agregar a Apple Wallet".
// Es un simple enlace al endpoint que devuelve el .pkpass; el navegador/iOS
// se encarga de abrir Wallet. Funciona como Server Component.

export default function AddToWalletButton({ customerId }: { customerId: string }) {
  return (
    <a
      href={`/api/wallet/${customerId}`}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 font-semibold text-white transition hover:bg-slate-800"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M16.365 1.43c0 1.14-.42 2.2-1.12 2.99-.78.88-2.05 1.56-3.1 1.48-.13-1.09.43-2.25 1.07-2.97.74-.84 2.05-1.46 3.15-1.5zM20.5 17.4c-.55 1.27-.82 1.83-1.53 2.95-.99 1.56-2.39 3.5-4.12 3.51-1.54.02-1.94-1.01-4.03-1-2.09.01-2.53 1.02-4.07 1-1.73-.02-3.06-1.77-4.05-3.33C-.06 17.27-.4 12.1 1.27 9.34c.83-1.39 2.32-2.27 3.93-2.29 1.56-.03 3.03 1.05 4.03 1.05.99 0 2.79-1.3 4.7-1.11.8.03 3.05.32 4.49 2.44-3.83 2.1-3.2 7.4.08 7.97z" />
      </svg>
      Agregar a Apple Wallet
    </a>
  );
}
