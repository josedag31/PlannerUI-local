# Buzón del móvil (planner-inbox)

Un Cloudflare Worker con una base D1 donde el **atajo del iPhone** deja tareas
aunque el portátil esté apagado. El planner las recoge al abrirse (y cada minuto
mientras está abierto), las guarda en su SQLite local y las borra del buzón.

```
iPhone (Atajo) ──POST /tasks──▶  Buzón (Cloudflare)  ◀──GET /tasks + POST /tasks/ack── Planner
```

El buzón no guarda nada más que las tareas en espera: la BBDD de verdad es la
del portátil. El plan gratuito de Cloudflare sobra para este uso.

## API

Todas las rutas menos `/health` piden `Authorization: Bearer <token>`.

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/health` | Comprueba que el despliegue responde (sin token) |
| POST | `/tasks` | Deja una tarea. JSON: `title` (obligatorio), `section`, `priority`, `due` |
| GET | `/tasks` | Lista las pendientes (las usa el planner) |
| POST | `/tasks/ack` | `{ "ids": [...] }` — borra las ya guardadas en el planner |

Los campos los interpreta el planner, no el buzón:

- `section`: el nombre de la sección tal como está en Ajustes (o `STUDY`/`ARUS`/`PERSONAL`). Si no se reconoce → Personal.
- `priority`: `Alta`/`Media`/`Baja` (o `HIGH`/`MEDIUM`/`LOW`). Por defecto, Media.
- `due`: `Hoy`, `Mañana`, `Sin fecha`, `AAAA-MM-DD` o ISO 8601 con hora. Si no se entiende, la tarea entra sin fecha.

## Probar en local (sin cuenta de Cloudflare)

```bash
npm install
cp .dev.vars.example .dev.vars   # y pon un token cualquiera
npm run db:local
npm run dev                      # http://127.0.0.1:8787
```

En el planner (`npm run dev`, puerto 3100) → Ajustes → *Tareas desde el móvil*:
URL `http://127.0.0.1:8787` y el mismo token.

## Desplegarlo en Cloudflare

1. Crea una cuenta gratuita en <https://dash.cloudflare.com/sign-up>.
2. `npm run login`: abre el navegador para autorizar a wrangler.
3. `npm run db:create` y copia el `database_id` que imprime en `wrangler.jsonc`.
4. `npm run db:remote`: crea la tabla en la base de Cloudflare.
5. Genera un token largo y aleatorio y **guárdalo en tu gestor de contraseñas**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
   ```
6. `npm run secret`: pega el token cuando lo pida. Se queda cifrado en Cloudflare.
7. `npm run deploy`: imprime la URL, del tipo `https://planner-inbox.<tu-subdominio>.workers.dev`.
8. En el planner → Ajustes → *Tareas desde el móvil*: pega la URL y el token, y pulsa *Recoger ahora*.

Los scripts llevan `NODE_OPTIONS=--use-system-ca` para que funcionen con
antivirus que inspeccionan el HTTPS (Avast, etc.).

## El atajo del iPhone

App **Atajos** → **+** → nombre **Nueva tarea**. Acciones, en orden:

1. **Pedir entrada**: tipo *Texto*, pregunta *¿Qué hay que hacer?*
2. **Lista**: los nombres de tus secciones (los de Ajustes, p. ej. *Estudios*, *ARUS*, *Personal*).
   **Elegir de la lista**: pregunta *Sección*.
3. **Lista**: *Alta*, *Media*, *Baja*. **Elegir de la lista**: pregunta *Prioridad*.
4. **Lista**: *Sin fecha*, *Hoy*, *Mañana*, *Elegir fecha*. **Elegir de la lista**: pregunta *¿Para cuándo?*
5. **Si** el elemento elegido *es* *Elegir fecha*:
   - **Pedir entrada**: tipo *Fecha y hora*.
   - **Formatear fecha**: formato *ISO 8601* (con hora).
   - **Definir variable** `Fecha` con la fecha formateada.

   **De lo contrario**: **Definir variable** `Fecha` con el elemento elegido.
6. **Obtener contenido de URL**: `https://<tu-buzón>/tasks`
   - Método **POST**.
   - Cabecera `Authorization` → `Bearer <tu token>`.
   - Cuerpo **JSON**: `title` (entrada del paso 1), `section` (paso 2), `priority` (paso 3), `due` (variable `Fecha`).
7. **Obtener valor del diccionario**: clave `mensaje` → **Mostrar notificación**.

Después: **Centro de Control** → mantener pulsado → **Añadir un control** →
**Atajos** → *Nueva tarea*. También funciona con *"Oye Siri, nueva tarea"* y
con el botón de Acción.

> El token va dentro del atajo. **No compartas el atajo por enlace de iCloud
> con el token puesto**: quien lo tenga puede dejar tareas en tu buzón. Si se
> filtra, genera otro, `npm run secret` y cámbialo en Ajustes y en el atajo.
