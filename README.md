# Prog_Lealtad — Programa de Lealtad (MVP)

Tarjeta de fidelización digital con QR y soporte para **Apple Wallet**.
Stack: **Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (PostgreSQL) · Vercel**.

> **Estado actual**: MVP funcional **single-tenant** (un solo negocio). La visión del producto es evolucionarlo a un **SaaS multi-tenant** donde cada negocio personaliza su propia tarjeta de lealtad — ver [Roadmap SaaS](#7-roadmap--saas-multi-tenant).

## ¿Qué hace hoy?

- **Registro de clientes** (`/`): nombre, apellido, teléfono y cumpleaños → crea el cliente, genera un `id` único (UUID) y un número de miembro secuencial (desde 1001).
- **Tarjeta digital** (`/card/[id]`): nombre, número de miembro, visitas acumuladas, recompensa disponible, progreso visual y **código QR**. Botón _Agregar a Apple Wallet_ (si hay certificados configurados).
- **Panel del equipo** (`/admin`): protegido con contraseña (`ADMIN_PASSWORD` + cookie con hash SHA-256, middleware en `/admin/*`). Buscar cliente por teléfono, registrar visitas (+1 punto por visita), ver historial y canjear recompensas.
- **Recompensas**: cada **10 visitas = 1 bebida gratis**, otorgada automáticamente por un **trigger en PostgreSQL** (`grant_reward_on_tenth_visit`).
- **Apple Wallet**: endpoint `/api/wallet/[id]` genera y firma un `.pkpass` en el servidor con `passkit-generator` (certificados propios de Apple Developer, sin depender de servicios como PassKit.com).

### Base de datos (Supabase / PostgreSQL) — ya implementada

| Objeto | Propósito |
|---|---|
| `customers` | Clientes: UUID, `member_no` secuencial, teléfono único normalizado |
| `visits` | Visitas (1 fila = 1 punto), con sucursal opcional |
| `rewards` | Recompensas: `available` / `redeemed` |
| `locations` | Sucursales (seed: "Sucursal Principal") |
| Trigger `trg_grant_reward` | Otorga 1 recompensa cada 10 visitas automáticamente |
| Vista `customer_stats` | Fuente de verdad para la UI: total, ciclo actual, faltantes, disponibles |
| RLS | Habilitado sin políticas públicas: todo el acceso pasa por el servidor con la *service role key* |

> Nota: la regla "10 visitas" vive en dos lugares — la constante `VISITS_PER_REWARD` en `src/lib/rewards.ts` (UI) y hardcodeada en el trigger de `schema.sql`. Al migrar a SaaS esta regla pasará a ser configurable por negocio.

---

## Estructura del proyecto

```
qr proyect/
├── supabase/
│   └── schema.sql              # Esquema completo: tablas, trigger, vista, RLS
├── src/
│   ├── app/
│   │   ├── page.tsx            # Landing + registro
│   │   ├── actions.ts          # Server action: registrar cliente
│   │   ├── card/[id]/page.tsx  # Tarjeta del cliente (QR + Wallet)
│   │   ├── admin/
│   │   │   ├── page.tsx        # Panel: buscar, registrar visita, historial
│   │   │   ├── actions.ts      # Server actions del panel
│   │   │   └── login/page.tsx  # Login del panel
│   │   └── api/wallet/[id]/route.ts  # Genera y firma el .pkpass
│   ├── components/             # RegisterForm, ProgressBar, AddToWalletButton
│   ├── lib/
│   │   ├── supabase/admin.ts   # Cliente con service role (solo servidor)
│   │   ├── rewards.ts          # Reglas de lealtad (10 visitas = 1 premio)
│   │   ├── qr.ts               # Generación de QR
│   │   ├── wallet.ts           # Construcción del .pkpass
│   │   ├── png.ts              # Íconos placeholder del pase (sin binarios)
│   │   └── auth.ts             # Sesión del panel /admin
│   └── types/database.ts
├── middleware.ts               # Protege /admin
└── .env.local.example
```

---

## 1. Instalación

```bash
cd "qr proyect"
npm install          # o pnpm install
cp .env.local.example .env.local
```

Luego completa `.env.local` (ver sección 2) y arranca:

```bash
npm run dev
# http://localhost:3000
```

---

## 2. Variables de entorno

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio. **Solo servidor.** |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app (sin slash final) |
| `ADMIN_PASSWORD` | Contraseña del panel `/admin` |
| `APPLE_*` | Configuración de Apple Wallet (opcional, ver sección 5) |

---

## 3. Configuración de Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. **Settings → API**: copia `Project URL`, `anon public` y `service_role` a tu `.env.local`.
3. **SQL Editor → New query**: pega el contenido de [`supabase/schema.sql`](supabase/schema.sql) y ejecútalo (**Run**).
   - Crea las tablas `customers`, `visits`, `rewards`, `locations`.
   - Crea el trigger que otorga 1 recompensa cada 10 visitas.
   - Crea la vista `customer_stats` que consume la app.
   - Habilita RLS (la app accede con la _service role key_ desde el servidor).

> La app **no** usa la `anon key` para leer/escribir datos directamente: todo pasa por server actions/route handlers con la _service role key_, por eso RLS queda bloqueado para el público. Cuando quieras que cada cliente lea su propia tarjeta con Supabase Auth, añade políticas RLS por usuario.

---

## 4. Uso

1. Ve a `/` y registra un cliente → te redirige a su tarjeta `/card/[id]`.
2. Entra a `/admin` (te pedirá `ADMIN_PASSWORD`), busca por teléfono y pulsa **Registrar visita**.
3. Al llegar a 10 visitas aparece una **bebida gratis** que puedes **Canjear** desde el panel.

---

## 5. Configuración de Apple Wallet

> Opcional. Sin esto, la app funciona igual; solo se oculta el botón _Agregar a Apple Wallet_.

Requiere una cuenta de **Apple Developer** ($99/año).

### a) Crear el Pass Type ID
1. [developer.apple.com](https://developer.apple.com/account) → **Certificates, IDs & Profiles → Identifiers → +** → **Pass Type IDs**.
2. Crea uno, p. ej. `pass.com.tudominio.loyalty` → cópialo a `APPLE_PASS_TYPE_IDENTIFIER`.
3. Tu **Team ID** está arriba a la derecha (Membership) → `APPLE_TEAM_IDENTIFIER`.

### b) Generar el certificado de firma
1. En el Pass Type ID → **Create Certificate** → sube un CSR (creado con _Keychain Access → Certificate Assistant → Request a Certificate from a CA_).
2. Descarga el `.cer`, ábrelo en **Keychain**, expórtalo como `.p12` (con contraseña).
3. Convierte a PEM:

```bash
# Certificado de firma (signerCert)
openssl pkcs12 -in Certificates.p12 -clcerts -nokeys -out signerCert.pem -legacy
# Llave privada (signerKey) — define una passphrase
openssl pkcs12 -in Certificates.p12 -nocerts -out signerKey.pem -legacy
```

### c) Certificado WWDR de Apple
Descarga **Apple WWDR G4** desde [Apple PKI](https://www.apple.com/certificateauthority/) y conviértelo a PEM:

```bash
openssl x509 -inform der -in AppleWWDRCAG4.cer -out wwdr.pem
```

### d) Pasar los certificados como base64
Vercel no guarda archivos: codifica cada PEM en base64 y ponlo en las variables de entorno.

```bash
base64 -i wwdr.pem        | tr -d '\n'   # → APPLE_WWDR_BASE64
base64 -i signerCert.pem  | tr -d '\n'   # → APPLE_SIGNER_CERT_BASE64
base64 -i signerKey.pem   | tr -d '\n'   # → APPLE_SIGNER_KEY_BASE64
# APPLE_SIGNER_KEY_PASSPHRASE = la passphrase del paso (b)
```

### e) (Opcional) Personalizar imágenes
Coloca tus PNG en `public/wallet/` (`icon.png`, `icon@2x.png`, `logo.png`, `logo@2x.png`).
Si no existen, se generan placeholders de color sólido automáticamente.

---

## 6. Deploy en Vercel

1. Sube el proyecto a GitHub.
2. En [vercel.com](https://vercel.com) → **Add New → Project** → importa el repo.
3. En **Settings → Environment Variables** agrega **todas** las variables de `.env.local`
   (incluye `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD` y, si usas Wallet, las `APPLE_*`).
4. Pon `NEXT_PUBLIC_APP_URL` con tu dominio de producción (p. ej. `https://lealtad.tudominio.com`).
5. **Deploy**.

---

## 7. Roadmap → SaaS multi-tenant

Visión del producto: plataforma donde **cada negocio** entra, personaliza su propia tarjeta de lealtad y sus clientes acumulan puntos (**+1 punto por visita**). Cada negocio define **1 premio por X puntos**. Modelo de cobro vía **Stripe**: suscripción mensual por acceso a la plataforma **+ cobro por consumo según tarjetas emitidas** (con una cantidad inicial gratis).

### Qué falta para llegar ahí (sobre la base actual)

| Área | Estado hoy | Cambio necesario |
|---|---|---|
| **Multi-tenancy** | Single-tenant (un negocio) | Tabla `businesses` + columna `business_id` en `customers`, `visits`, `rewards`, `locations`. RLS por tenant |
| **Auth de negocios** | Contraseña única (`ADMIN_PASSWORD`) | Supabase Auth: registro/login de negocios, roles (dueño/staff) |
| **Regla de premio** | Fija: 10 visitas = 1 bebida (trigger hardcodeado) | Configurable por negocio: `points_required` y `reward_label` en `businesses`; trigger lee la config del tenant |
| **Personalización de tarjeta** | Diseño único (colores slate, placeholders) | Editor por negocio: logo, colores, nombre del premio → aplica a `/card/[id]` y al `.pkpass` |
| **Facturación Stripe** | No existe | Stripe Billing: suscripción mensual (acceso) + *metered billing* por tarjeta emitida (N gratis incluidas). Webhooks para alta/baja/impago |
| **Límites de emisión** | Sin límite | Contador de tarjetas emitidas por negocio + tope según plan; bloqueo/aviso al exceder cuota |
| **Onboarding negocio** | Manual (SQL Editor) | Flujo self-service: registro → personalizar tarjeta → invitar staff → compartir link/QR de registro |
| **Dominio por negocio** | URL única | Rutas por slug (`/b/[slug]/card/[id]`) o subdominios |

### Extensiones posteriores

- **WhatsApp (Cloud API de Meta)**: notificaciones tras `addVisit`/`redeemReward`, onboarding con el enlace `/card/[id]`, recordatorios de cumpleaños (Vercel Cron + `customers.birthday`). El campo `phone` ya está normalizado y único.
- **Google Wallet**: complemento natural del `.pkpass` de Apple.
- **Analytics por negocio**: visitas, canjes, clientes activos, retención.

> Referencia de mercado: [PassKit.com](https://passkit.com/pricing/) cobra *platform fee* (~$39.50/mes por usuario) + *pass volume fee* escalonado por tarjeta emitida (~$0.045 → $0.0005 por pase multi-uso según volumen). Este proyecto genera los pases con certificados propios, por lo que el costo marginal por tarjeta es ~$0 y el modelo mensualidad + consumo queda con margen completo.
```
