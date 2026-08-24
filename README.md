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

| Sección  | Calendario destino                                            |
| -------- | -------------------------------------------------------------- |
| Estudios | Outlook si está conectado; si no, Google, cuenta **Personal**   |
| ARUS     | Google, cuenta **ARUS**                                         |
| Personal | Google, cuenta **Personal**                                     |

Outlook para Estudios es opcional y da igual el orden en que conectes las
cosas: en cuanto conectes Microsoft, Estudios empieza a usarlo sin tocar
nada más; mientras tanto, usa el Google Personal como el resto.

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
- [x] Fase 4: empaquetar como app de escritorio (`.exe`), ver más abajo

## Fase 4: app de escritorio (Windows)

Empaquetado con **Tauri**: una ventana nativa (WebView2, el motor de Edge) que
arranca el servidor Next.js internamente como proceso hijo oculto — nunca se
ve una terminal ni un puerto. La base de datos SQLite se guarda en
`%APPDATA%\app.lockedinplanner.desktop\dev.db`, fuera de la carpeta de
instalación. Al cerrar la ventana, el servidor interno se para con ella (no
quedan procesos huérfanos).

### Descargar

Última release en [GitHub Releases](https://github.com/josedag31/PlannerUI-local/releases):
descarga el `.exe` instalador (NSIS), ejecútalo y abre "Locked In Planner"
desde el menú inicio. El primer arranque crea una base de datos nueva y
vacía — conecta tus cuentas de Google/Microsoft desde `/ajustes` igual que en
local.

### Compilar tu propio `.exe`

```bash
npm run desktop:build
```

Esto: hace `next build` (con `output: "standalone"`), copia ese build más
`node.exe` (se descarga la primera vez) y una base de datos plantilla
(migraciones aplicadas, sin datos) a `src-tauri/resources/`, y llama a
`tauri build`. El instalador queda en
`src-tauri/target/release/bundle/nsis/`.

Requiere, además de Node: [Rust](https://rustup.rs/) y las
[Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
(workload "Desarrollo para el escritorio con C++") para compilar la parte
nativa de Tauri.

**Windows Smart App Control**: si está activado, bloquea sin excepciones la
ejecución de binarios nuevos sin firmar — tanto en build (los build scripts
de `cargo`) como al abrir el `.exe` final la primera vez. Si te lo
encuentras: Configuración → Privacidad y seguridad → Seguridad de Windows →
Control de aplicaciones y del explorador → Smart App Control → Desactivado.
En builds recientes de Windows 11 (24H2/25H2) se puede volver a activar
después sin reinstalar Windows.

### Notas técnicas

- `src-tauri/resources/` (build de Next, `node.exe`, DB plantilla) y
  `src-tauri/target/` (compilación Rust) están en `.gitignore` — se
  regeneran con `npm run desktop:build`, no se versionan.
- La redirect URI de OAuth sigue fija a `http://localhost:3000/...`, así que
  el servidor interno siempre escucha ahí — el `.exe` no es reubicable a
  otro puerto sin cambiarla también en Google Cloud Console / Azure.
- **Sin confirmar del todo**: el login de Google dentro de la ventana nativa
  no se ha probado de principio a fin (hace falta pulsar "Conectar" con una
  cuenta real, algo que solo puede hacer quien tenga el proyecto de Google
  Cloud). Sí está confirmado que `/api/google/connect` redirige
  correctamente a `accounts.google.com` desde el servidor interno. WebView2
  (el motor de Tauri en Windows) no está en la lista de user-agents
  embebidos que Google bloquea — a diferencia de Electron/CEF — así que es
  razonable esperar que funcione, pero pruébalo la primera vez que conectes
  una cuenta. Si Google lo bloqueara, no hay botón de "permitir de todas
  formas": la alternativa sería un lanzador que abra el navegador del
  sistema en vez de una ventana propia.
