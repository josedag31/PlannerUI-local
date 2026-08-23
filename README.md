# Locked In — Planner

Planner personal open-source con estética oscura, pensado para llevar estudios,
proyectos (tipo Formula Student) y vida personal en un solo sitio, con base de
datos real (no una plantilla estática).

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
  Fase 2 (integración con Google Calendar / Drive / Gmail), todavía no
  implementada. Instrucciones de configuración cuando llegue esa fase.

Nunca subas tu `.env` a git — solo `.env.example` (con las claves vacías) va
al repositorio.

## Adaptar a tu propio caso

El proyecto no asume ninguna ruta ni cuenta personal: las tres secciones
(Estudios / ARUS / Personal) son un punto de partida pensado para un
estudiante de ingeniería en un equipo de Formula Student, pero los nombres,
colores y campos se pueden renombrar libremente en `prisma/schema.prisma` y
`src/app/*` sin romper nada.

## Roadmap

- [x] Fase 1: planner completo con BBDD real (tareas, hábitos, objetivos,
      asignaturas/exámenes, eventos, notas)
- [ ] Fase 2: integración con Google Calendar, Drive y Gmail (OAuth)
- [ ] Fase 3: indexador de carpetas locales (`WATCHED_FOLDERS`)
