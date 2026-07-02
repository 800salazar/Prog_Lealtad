# Prog_Lealtad — Programa de Lealtad (MVP)

Tarjeta de fidelización digital con QR y soporte para **Apple Wallet** (Google Wallet en progreso).
Stack: **Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (PostgreSQL) · Vercel**.

> **Estado actual**: MVP **multi-tenant**. Cada negocio tiene su propio link de registro (`tu-dominio.com/<slug-del-negocio>`), su propio color de marca y su propia regla de recompensa (3–20 visitas). Ver [Roadmap SaaS](#7-roadmap--saas-multi-tenant).

## ¿Qué hace hoy?

- **Página de registro por negocio** (`/[slug]`, ej. `/pinturas`, `/sillones`): el negocio se resuelve automáticamente por el slug de la URL — el cliente nunca tiene que buscarlo. Encabezado y botón de registro toman el **color de marca** (`businesses.primary_color`) del negocio.
- **Login del cliente** (`/[slug]/login`): sin contraseña — el cliente ingresa su teléfono y se le redirige a su tarjeta. Útil si perdió el link directo de su tarjeta.
- **Tarjeta digital** (`/[slug]/card/[id]`): nombre del negocio, nombre del cliente, número de miembro, visitas acumuladas, recompensa disponible, progreso visual (tipo tarjeta perforada) y **código QR**. Botones _Agregar a Apple Wallet_ y _Agregar a Google Wallet_ (cada uno se muestra solo si está configurado en el servidor).
- **Panel del equipo** (`/admin`): protegido con contraseña (`ADMIN_PASSWORD` + cookie con hash SHA-256, middleware en `/admin/*`). Buscar cliente por teléfono, registrar visitas (+1 punto por visita), ver historial y canjear recompensas. *(Hoy es un panel único; en el módulo B3 se reemplaza por login por negocio con Supabase Auth.)*
- **Recompensas configurables por negocio**: cada negocio define cuántas visitas requiere su premio (**3 a 20**) y el nombre del premio (`reward_label`). Se otorgan automáticamente por un **trigger en PostgreSQL** (`grant_reward_on_target_visit`).
- **Apple Wallet**: endpoint `/api/wallet/[id]` genera y firma un `.pkpass` en el servidor con `passkit-generator` (certificados propios de Apple Developer, sin depender de servicios como PassKit.com).
- **Google Wallet**: scaffold listo (`src/lib/googleWallet.ts`, botón condicional) — pendiente de credenciales de Google Cloud (módulo B12).

### Base de datos (Supabase / PostgreSQL) — ya implementada, multi-tenant

| Objeto | Propósito |
|---|---|
| `businesses` | Un registro por negocio: `slug` (único, valida formato y palabras reservadas), `primary_color`/`secondary_color`, `visits_required` (3–20), `reward_label`, plan/estado para Stripe |
| `business_users` | Vincula usuarios de Supabase Auth con un negocio y un rol (`owner`/`staff`) — se usará en el login del panel (módulo B3) |
| `customers` | Clientes de un negocio (`business_id`), `member_no` secuencial *por negocio*, teléfono único **por negocio** |
| `visits` | Visitas (1 fila = 1 punto), `business_id` denormalizado automáticamente |
| `rewards` | Recompensas: `available` / `redeemed` |
| `locations` | Sucursales por negocio (seed: negocio `demo`, sucursal "Sucursal Principal") |
| Trigger `trg_grant_reward` | Otorga 1 recompensa cada `visits_required` visitas, leyendo la config del negocio del cliente |
| Vista `customer_stats` | Fuente de verdad para la UI: incluye `business_slug`, `visits_required`, `reward_label`, colores de marca |
| RLS | Habilitado con función `my_business_ids()` — listo para cuando el panel use sesiones de Supabase Auth (módulo B3) |

---

## Estructura del proyecto

```
qr proyect/
├── supabase/
│   └── schema.sql                    # Esquema multi-tenant: tablas, triggers, vista, RLS
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Landing genérica (no ligada a un negocio)
│   │   ├── [slug]/
│   │   │   ├── page.tsx              # Registro del negocio (auto-detecta por slug)
│   │   │   ├── actions.ts            # Server actions: registerCustomer, loginCustomer
│   │   │   ├── login/page.tsx        # "Login" del cliente (solo teléfono)
│   │   │   └── card/[id]/page.tsx    # Tarjeta del cliente (QR + Wallet)
│   │   ├── admin/
│   │   │   ├── page.tsx              # Panel: buscar, registrar visita, historial
│   │   │   ├── actions.ts            # Server actions del panel
│   │   │   └── login/page.tsx        # Login del panel (contraseña única, MVP)
│   │   └── api/wallet/[id]/route.ts  # Genera y firma el .pkpass (Apple)
│   ├── components/                   # RegisterForm, CustomerLoginForm, ProgressBar, WalletButtons
│   ├── lib/
│   │   ├── supabase/admin.ts         # Cliente con service role (solo servidor)
│   │   ├── business.ts               # Resuelve negocio por slug + slugs reservados
│   │   ├── theme.ts                  # Color de marca como variable CSS (--brand)
│   │   ├── rewards.ts                # Cálculo de progreso (visits_required por negocio)
│   │   ├── qr.ts                     # Generación de QR
│   │   ├── wallet.ts                 # Construcción del .pkpass (Apple)
│   │   ├── googleWallet.ts           # Scaffold de Google Wallet (pendiente, B12)
│   │   ├── png.ts                    # Íconos placeholder del pase (sin binarios)
│   │   └── auth.ts                   # Sesión del panel /admin
│   └── types/database.ts
├── middleware.ts                      # Protege /admin
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
2. **Settings → API**: copia `Project URL`, `anon public`/`publishable` y `service_role`/`secret` a tu `.env.local`.
3. **SQL Editor → New query**: pega el contenido de [`supabase/schema.sql`](supabase/schema.sql) y ejecútalo (**Run**).
   - Crea las tablas `businesses`, `business_users`, `customers`, `visits`, `rewards`, `locations`.
   - Crea el trigger que otorga 1 recompensa cada `visits_required` visitas (configurable por negocio).
   - Crea la vista `customer_stats` que consume la app.
   - Habilita RLS por negocio (la app accede con la _service role key_ desde el servidor, que la ignora).
   - Crea un negocio de ejemplo con slug `demo` (visítalo en `/demo`).

> La app **no** usa la `anon key` para leer/escribir datos directamente: todo pasa por server actions/route handlers con la _service role key_. Cuando el panel use sesiones de Supabase Auth (módulo B3), las políticas RLS por negocio ya están listas (`my_business_ids()`).

### Crear un negocio nuevo (hasta que exista el onboarding self-service)

Por ahora se crea manualmente desde el SQL Editor:

```sql
insert into public.businesses (name, slug, primary_color, visits_required, reward_label)
values ('Pinturas El Sol', 'pinturas', '#dc2626', 10, 'Galón gratis');
```

El link de registro queda listo en `tu-dominio.com/pinturas`.

---

## 4. Uso

1. Comparte con tus clientes el link de tu negocio: `tu-dominio.com/<slug>` (ej. `/demo`). El formulario ya sabe a qué negocio pertenece — no hay que buscarlo.
2. Al registrarse, el cliente cae en su tarjeta `/<slug>/card/[id]`. Si pierde el link, puede volver a entrar por `/<slug>/login` con su teléfono.
3. Entra a `/admin` (te pedirá `ADMIN_PASSWORD`), busca por teléfono y pulsa **Registrar visita**.
4. Al completar las visitas requeridas por el negocio aparece la recompensa configurada, que puedes **Canjear** desde el panel.

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
