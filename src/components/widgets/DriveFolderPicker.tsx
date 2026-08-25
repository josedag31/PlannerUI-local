"use client";

import { useEffect, useState } from "react";

type Folder = { id: string; name: string };
type Crumb = { id: string; name: string };

const ROOT: Crumb = { id: "root", name: "Mi unidad" };

export default function DriveFolderPicker({
  label,
  onSelect,
  onClose,
}: {
  label: "PERSONAL" | "ARUS";
  onSelect: (folder: Folder) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [path, setPath] = useState<Crumb[]>([ROOT]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const searching = query.trim().length > 0;

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      () => {
        setLoading(true);
        const url = searching
          ? `/api/google/drive-folders?label=${label}&q=${encodeURIComponent(query.trim())}`
          : `/api/google/drive-folders?label=${label}&parentId=${path[path.length - 1].id}`;
        fetch(url)
          .then((r) => r.json())
          .then((data) => {
            if (!cancelled) setFolders(data.folders ?? []);
          })
          .finally(() => {
            if (!cancelled) setLoading(false);
          });
      },
      searching ? 350 : 0
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [label, path, query, searching]);

  return (
    <div className="border border-border rounded-lg p-3 bg-surface-2 space-y-3">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar carpeta por nombre..."
        className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-accent"
        autoFocus
      />

      {!searching && (
        <div className="flex flex-wrap items-center gap-1 text-xs text-muted">
          {path.map((crumb, i) => (
            <span key={crumb.id} className="flex items-center gap-1">
              {i > 0 && <span>/</span>}
              <button
                type="button"
                onClick={() => setPath(path.slice(0, i + 1))}
                className={i === path.length - 1 ? "text-foreground font-medium" : "hover:text-accent"}
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="max-h-56 overflow-y-auto space-y-1">
        {loading && <p className="text-xs text-muted py-2">Cargando...</p>}
        {!loading && folders.length === 0 && (
          <p className="text-xs text-muted py-2">
            {searching ? "Sin resultados." : "Esta carpeta no tiene subcarpetas."}
          </p>
        )}
        {!loading &&
          folders.map((folder) => (
            <div
              key={folder.id}
              className="flex items-center justify-between gap-2 bg-background border border-border rounded-lg px-2.5 py-1.5"
            >
              <span className="text-sm truncate">{folder.name}</span>
              <div className="flex items-center gap-1 shrink-0">
                {!searching && (
                  <button
                    type="button"
                    onClick={() => setPath([...path, folder])}
                    className="text-xs text-muted hover:text-accent px-2 py-1"
                  >
                    Entrar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSelect(folder)}
                  className="text-xs font-semibold text-accent hover:brightness-110 px-2 py-1"
                >
                  Elegir
                </button>
              </div>
            </div>
          ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onSelect({ id: "", name: "" })}
          className="text-xs text-muted hover:text-foreground"
        >
          Usar todo el Drive (sin filtrar)
        </button>
        <button type="button" onClick={onClose} className="text-xs text-muted hover:text-foreground">
          Cancelar
        </button>
      </div>
    </div>
  );
}
