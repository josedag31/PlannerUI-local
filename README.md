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
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI`: para la
  Fase 2 (Google Calendar / Drive / Gmail). Ver más abajo cómo obtenerlas.

Nunca subas tu `.env` a git — solo `.env.example` (con las claves vacías) va
al repositorio.

## Fase 2: conectar Google Calendar, Drive y Gmail

La integración es solo lectura (calendario, archivos recientes y correos sin
leer) y queda guardada localmente en tu propia base de datos SQLite — nunca en
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

### 4. Rellenar tu `.env`

```bash
GOOGLE_CLIENT_ID="tu-id-de-cliente.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="tu-secreto-de-cliente"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/google/callback"
```

Reinicia `npm run dev` después de editar el `.env`.

### 5. Conectar desde la app

Ve a `/ajustes` → tarjeta "Conexión con Google" → **Conectar Google**. Te
llevará al consentimiento de Google y, al aceptar, volverás al planner con
Calendar, Drive y Gmail ya visibles en el dashboard. Puedes desconectar la
cuenta en cualquier momento desde la misma tarjeta (borra el token guardado
localmente, no revoca el acceso en tu cuenta de Google — para eso, revócalo
desde [myaccount.google.com/permissions](https://myaccount.google.com/permissions)).

## Adaptar a tu propio caso

El proyecto no asume ninguna ruta ni cuenta personal: las tres secciones
(Estudios / ARUS / Personal) son un punto de partida pensado para un
estudiante de ingeniería en un equipo de Formula Student, pero los nombres,
colores y campos se pueden renombrar libremente en `prisma/schema.prisma` y
`src/app/*` sin romper nada.

## Roadmap

- [x] Fase 1: planner completo con BBDD real (tareas, hábitos, objetivos,
      asignaturas/exámenes, eventos, notas)
- [x] Fase 2: integración con Google Calendar, Drive y Gmail (OAuth, solo lectura)
- [ ] Fase 3: indexador de carpetas locales (`WATCHED_FOLDERS`)
