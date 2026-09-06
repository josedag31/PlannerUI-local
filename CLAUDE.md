@AGENTS.md

# La base de datos instalada no se toca

`%APPDATA%\app.lockedinplanner.desktop\dev.db` es la base de datos **real y en
uso**: tareas, hábitos, objetivos, asignaturas y las cuentas de Google
conectadas. Nunca se sobrescribe, ni se resiembra, ni se borra.

Es un fichero **independiente** del `dev.db` de la raíz del proyecto, que solo
sirve para `npm run dev`. No son copias el uno del otro y no hay que
sincronizarlos.

## Al publicar una versión nueva

- Ejecutar el instalador **encima** de la instalación existente. Nada de
  desinstalar primero: el desinstalador puede llevarse la carpeta de datos.
- Ni un solo `cp` sobre esa ruta. Si hiciera falta mover datos, lo decide y lo
  hace él.
- La única escritura legítima es `scripts/migrate-runtime.cjs`, que aplica
  migraciones pendientes al arrancar la app. Es aditivo y necesario tras un
  cambio de esquema, pero **avisar antes** de publicar una migración que borre
  o renombre columnas o tablas con datos dentro.

## Los cambios se prueban en `npm run dev`, no en el `.exe`

El `.exe` instalado es su herramienta de uso diario. **No se reconstruye ni se
instala nada hasta que él lo pida explícitamente** ("publicamos" / "haz la
release"). Reinstalar por cada cambio le cierra la app en mitad de su jornada.

Desarrollo y app instalada están completamente separados, y pueden correr a la
vez sin enterarse el uno del otro:

| | Desarrollo | App instalada |
|---|---|---|
| Puerto | 3100 (`npm run dev`) | 3000 |
| BBDD | `dev.db` del proyecto | `%APPDATA%\app.lockedinplanner.desktop\dev.db` |
| Callback de Google | `http://localhost:3100/api/google/callback` | `…:3000/api/google/callback` |

Las dos URIs están dadas de alta en el cliente OAuth de Google, y cada BBDD
guarda la suya en `GoogleOAuthConfig.redirectUri`. Por eso **nunca hay que
cerrarle la app para trabajar**, ni siquiera para probar cosas de Google.

No cambiar los scripts `dev`/`start` de vuelta al 3000: es lo que evita
robarle el puerto sin darse cuenta.

## No se puede diagnosticar su instalación desde aquí

Cuando la app la lanza el asistente, **usa una base de datos distinta de la
del usuario**: los procesos hijos corren con la carpeta de datos redirigida a
`AppData\Local\Packages\Claude_…\LocalCache\…`. Todo lo que se vea desde este
lado —el fichero *y* el HTTP contra esa instancia— es una copia paralela.

Comparar hashes de ambas rutas no lo detecta: desde aquí las dos resuelven a la
misma copia y salen idénticas.

Consecuencia: **nunca afirmar nada sobre sus datos**, y menos aún que haya
perdido algo. Si hace falta saber qué hay en su app, se le pregunta a él. Esto
ya generó un aviso de pérdida de datos que era falso.
