-- Tareas que el atajo del iPhone ha dejado y la app aún no ha recogido.
-- `payload` es el JSON tal cual llegó (title, section, priority, due).
CREATE TABLE IF NOT EXISTS pending (
  id          TEXT PRIMARY KEY,
  payload     TEXT NOT NULL,
  received_at TEXT NOT NULL
);
