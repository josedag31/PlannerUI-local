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

## Para saber qué hay dentro

Preguntar al servidor en marcha, no leer el fichero:

```bash
curl -s http://localhost:3000/ajustes   # estado de las cuentas
curl -s http://localhost:3000/          # widgets con datos reales
```

En este equipo, leer ese `dev.db` directamente desde las herramientas devuelve
un estado desincronizado con el que ve la app — ya provocó un diagnóstico
entero persiguiendo un bug inexistente.
