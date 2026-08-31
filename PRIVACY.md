# Política de privacidad — Locked In Planner

**Última actualización: 31 de agosto de 2026**

Locked In Planner es una aplicación de escritorio de código abierto y de uso
personal. Se ejecuta **por completo en el ordenador de quien la usa**. No hay
servidor, ni backend, ni cuenta de servicio: no existe ningún sistema
intermedio al que se puedan enviar datos.

## Qué datos se manejan

Si conectas una cuenta de Google, la app solicita permiso para leer:

- **Google Calendar** (lectura y escritura): mostrar tus próximos eventos y
  crear eventos a partir de las tareas, exámenes y eventos que añadas en la app.
- **Google Drive** (solo lectura): mostrar una lista de archivos recientes o de
  una carpeta que tú elijas.
- **Gmail** (solo lectura): mostrar el número de correos sin leer y el asunto y
  remitente de los más recientes.

## Dónde se guardan

Todo —incluidos los tokens de acceso de Google— se guarda en un único fichero
de base de datos SQLite en el propio ordenador:

```
%APPDATA%\app.lockedinplanner.desktop\dev.db
```

Ese fichero nunca sale del equipo. Los datos de Google se piden directamente a
las APIs de Google desde la aplicación y se muestran en pantalla.

## Qué NO se hace

- **No se envían datos a terceros.** No hay analítica, ni telemetría, ni
  servicios externos de ningún tipo.
- **No se comparten ni se venden datos.** No hay a quién: no existe servidor.
- **No se usan los datos para entrenar modelos** ni para publicidad.
- **No se guarda el contenido de los correos.** Solo se leen para mostrarlos en
  el momento; no se copian a la base de datos.

## Cómo revocar el acceso

Puedes desconectar cualquier cuenta desde **Ajustes** dentro de la app, lo que
borra sus tokens del equipo. También puedes revocar el permiso directamente en
[myaccount.google.com/permissions](https://myaccount.google.com/permissions).

Para borrar todos los datos, basta con desinstalar la aplicación y eliminar la
carpeta `%APPDATA%\app.lockedinplanner.desktop`.

## Código fuente

El código completo es público y auditable en
[github.com/josedag31/PlannerUI-local](https://github.com/josedag31/PlannerUI-local).

## Contacto

Para cualquier duda sobre esta política: josedag31@gmail.com
