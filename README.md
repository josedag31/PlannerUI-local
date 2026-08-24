# Planner

Planner personal open-source con estética oscura, pensado para llevar estudios,
proyectos (tipo Formula Student) y vida personal en un solo sitio, con base de
datos real (no una plantilla estática). El nombre visible de la app y el de
cada sección se personalizan desde `/ajustes`, sin tocar código.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- SQLite vía Prisma 7 (adaptador `@prisma/adapter-better-sqlite3`)
- Todo corre en local, sin servidor externo

## Puesta en marcha

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Estructura

- **Dashboard** (`/`): vista semanal, tareas pendientes, hábitos con rachas,
  objetivos del año y próximos eventos/exámenes, todo a la vez.
- **Estudios** (`/estudios`): asignaturas, exámenes, tareas y notas.
- **ARUS** (`/arus`): tareas de equipo, reuniones/eventos, objetivos técnicos y notas.
- **Personal** (`/personal`): tareas, hábitos, objetivos y notas de vida personal.

Cada sección tiene su propia base de datos relacional (Prisma, ver
`prisma/schema.prisma`): tareas, hábitos + registros diarios, objetivos con
progreso, asignaturas + exámenes, eventos/countdowns y notas.

## Configuración

Copia `.env.example` a `.env` y ajusta:

- `DATABASE_URL`: ruta del fichero SQLite local (por defecto `./dev.db`).
- `WATCHED_FOLDERS`: rutas absolutas separadas por coma a carpetas locales que
  quieras enlazar desde el planner (apuntes, repos, proyectos). Vacío por defecto.

Las credenciales de Google (Fase 2) **no van en `.env`**: se introducen desde
la propia app en `/ajustes` y se guardan en tu base de datos SQLite local, para
que la configuración completa viva en un solo sitio (pensado también para el
día que esto se empaquete como app de escritorio, sin ficheros de entorno que
editar a mano).

Nunca subas tu `.env` a git — solo `.env.example` (con las claves vacías) va
al repositorio.

## Sincronización de calendario por sección

Cada sección sincroniza con un calendario distinto, pensado para gente que
reparte su identidad entre varias cuentas (personal, equipo, universidad):

| Sección  | Calendario destino                          |
| -------- | -------------------------------------------- |
| Estudios | Outlook (Microsoft) — ver más abajo           |
| ARUS     | Google, cuenta **ARUS**                       |
| Personal | Google, cuenta **Personal**                   |

Al crear una tarea, examen o evento con fecha en cualquier sección, se crea
también un evento en el calendario que le corresponda (si esa cuenta está
conectada). Cada página de sección, además, muestra de vuelta lo que ya
tengas en ese calendario (deduplicado con lo que el propio planner creó ahí).
Al completar o borrar una tarea sincronizada, su evento se borra también del
calendario. Es best-effort en ambas direcciones: si la cuenta no está
conectada o la llamada falla, el guardado local nunca se ve afectado.

## Fase 2: conectar Google Calendar, Drive y Gmail

Calendario (lectura y escritura), Drive (lectura) y Gmail (lectura).
Todo queda guardado localmente en tu propia base de datos SQLite — nunca en
el repositorio ni en ningún servidor de terceros.

### 1. Crear un proyecto en Google Cloud

1. Ve a [console.cloud.google.com](https://console.cloud.google.com/) y crea
   un proyecto nuevo (o usa uno existente).
2. En **APIs y servicios → Biblioteca**, activa estas tres APIs:
   - Google Calendar API
   - Google Drive API
   - Gmail API

### 2. Configurar la pantalla de consentimiento OAuth

1. **APIs y servicios → Pantalla de consentimiento de OAuth**.
2. Tipo de usuario: **Externo** (si no tienes Google Workspace) y completa los
   campos obligatorios (nombre de la app, email de soporte).
3. En **Público objetivo / Usuarios de prueba**, añade tu propia cuenta de
   Gmail — mientras la app esté en modo "Prueba" (no publicada), solo las
   cuentas que añadas aquí podrán autenticarse. Es justo lo que quieres para
   uso personal: no hace falta publicarla ni pasar la revisión de Google.

### 3. Crear las credenciales OAuth

1. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de
   OAuth**.
2. Tipo de aplicación: **Aplicación web**.
3. En **URI de redirección autorizados**, añade exactamente:
   ```
   http://localhost:3000/api/google/callback
   ```
4. Guarda y copia el **ID de cliente** y el **secreto de cliente** que te
   muestra Google.

### 4. Guardar las credenciales en la app

Ve a `/ajustes` → tarjeta "Conexión con Google" → abre "Credenciales de
Google" y pega el **Client ID** y el **Client secret**. La Redirect URI ya
viene rellena con `http://localhost:3000/api/google/callback` — déjala igual
que la que registraste en el paso anterior. Guarda.

No hace falta reiniciar nada: se guarda directamente en la base de datos y el
botón "Conectar Google" aparece al momento.

### 5. Conectar tu cuenta

En `/ajustes` verás dos filas, **Personal** y **ARUS**: pulsa **Conectar** en
la que quieras. Te llevará al consentimiento de Google y, al aceptar,
volverás al planner con esa cuenta conectada. La cuenta **Personal**
alimenta el dashboard (Calendar, Drive, Gmail) y es a donde se sincronizan
tus tareas/exámenes/eventos; la cuenta **ARUS** solo alimenta el widget de
Drive en la página ARUS (útil si usas una cuenta de Google distinta para el
equipo). Las dos comparten las mismas credenciales — si quieres conectar
ARUS con una cuenta distinta a la Personal, añádela también como usuario de
prueba en el paso 2. Puedes desconectar cada una por separado (borra el
token guardado localmente, no revoca el acceso en tu cuenta de Google — para
eso, revócalo desde
[myaccount.google.com/permissions](https://myaccount.google.com/permissions)).

### Problema conocido: `unable to verify the first certificate`

Si al conectar te sale este error en la consola del servidor, tu antivirus
(Avast, Bitdefender, Kaspersky...) está interceptando el tráfico HTTPS para
inspeccionarlo y lo firma con su propio certificado, que Node.js no reconoce
por defecto. Ya está arreglado en los scripts `dev`/`start` (`NODE_OPTIONS=--use-system-ca`,
para que Node confíe en el almacén de certificados de Windows en vez de solo
en el suyo propio) — si aun así te pasa, revisa que tu antivirus no tenga una
excepción específica que lo bloquee igualmente.

## Outlook: conectar tu correo de Microsoft (universidad, trabajo...)

El widget "Outlook" del dashboard lee tu bandeja de entrada (correos sin leer)
de una cuenta de Microsoft — pensado para correos institucionales tipo
`@alumnos.tuuniversidad.es` que usan Microsoft 365, pero funciona con
cualquier cuenta Microsoft (personal u organizativa).

### 1. Registrar la app en Azure

1. Ve a [portal.azure.com](https://portal.azure.com/) → busca **Microsoft
   Entra ID** → **Registros de aplicaciones** → **Nuevo registro**.
2. Nombre: el que quieras (ej. "Planner").
3. **Tipos de cuenta admitidos**: elige *"Cuentas en cualquier directorio
   organizativo y cuentas personales Microsoft"* — así funciona tanto con tu
   cuenta personal como con la de la universidad, sin depender de un tenant
   concreto.
4. **URI de redirección**: tipo **Web**, valor exacto:
   ```
   http://localhost:3000/api/microsoft/callback
   ```
5. Registrar. Copia el **Application (client) ID** que aparece en la página
   de resumen.

### 2. Crear el secreto de cliente

1. En el menú de la app registrada: **Certificados y secretos → Client
   secrets → New client secret**.
2. Ponle una descripción y una caducidad (24 meses es razonable).
3. Copia el **Value** (el valor, no el "Secret ID") en cuanto se genere —
   Azure solo lo muestra una vez.

### 3. Dar permisos de lectura de correo

1. **API permissions → Add a permission → Microsoft Graph → Delegated
   permissions**.
2. Añade `Mail.Read`, `User.Read` y `offline_access` (los dos primeros
   suelen estar ya por defecto).
3. No hace falta "Grant admin consent" para uso personal — el propio Google
   (perdón, Microsoft) te pedirá el consentimiento la primera vez que
   conectes, como usuario normal.

### 4. Guardar las credenciales y conectar

En `/ajustes` → tarjeta "Conexión con Microsoft (Outlook)" → abre
"Credenciales de Microsoft" → pega el Application (client) ID y el Client
secret (Value). Deja el Tenant ID en `common` salvo que sepas que tu
universidad exige uno específico. Guarda, y pulsa **Conectar**.

## Adaptar a tu propio caso

El proyecto no asume ninguna ruta ni cuenta personal: las tres secciones
(Estudios / ARUS / Personal) son un punto de partida pensado para un
estudiante de ingeniería en un equipo de Formula Student, pero los nombres,
colores y campos se pueden renombrar libremente en `prisma/schema.prisma` y
`src/app/*` sin romper nada.

## Roadmap

- [x] Fase 1: planner completo con BBDD real (tareas, hábitos, objetivos,
      asignaturas/exámenes, eventos, notas)
- [x] Fase 2: integración con Google Calendar (lectura + creación), Drive y
      Gmail (lectura); credenciales gestionadas desde `/ajustes`;
      soporta 2 cuentas de Google (Personal + ARUS)
- [x] Fase 2.5: Outlook (correo, vía Microsoft Graph)
- [ ] Fase 3: indexador de carpetas locales (`WATCHED_FOLDERS`)
- [ ] Fase 4: empaquetar como app de escritorio (`.exe`), ver más abajo

## Fase 4 (futuro): empaquetar como app de escritorio

La idea es dejar de tener que abrir una terminal y `localhost:3000` a mano
cada vez, y tener un icono que se abre como cualquier otro programa. Dos
caminos posibles, ninguno implementado todavía:

- **Tauri** (recomendado): empaqueta esta misma app Next.js dentro de una
  ventana nativa ligera (usa el motor de renderizado de Windows en vez de
  cargar un Chromium entero, así que el `.exe` pesa mucho menos que con
  Electron — decenas de MB en vez de cientos).
- **Electron**: alternativa más conocida y con más documentación, pero cada
  `.exe` pesa bastante más porque empaqueta su propio Chromium completo.

En ambos casos el trabajo real es: arrancar el servidor Next.js internamente
al abrir el programa (el usuario nunca ve una terminal ni un puerto), y que
la base de datos SQLite se guarde en una carpeta de datos de usuario normal
de Windows en vez de dentro de la carpeta del proyecto. El motivo de haber
sacado las credenciales de Google del `.env` a la base de datos (Fase 2) es
precisamente para que este paso no tenga que inventarse nada nuevo: la
configuración entera ya vive en un único fichero (`dev.db`) fácil de mover.
