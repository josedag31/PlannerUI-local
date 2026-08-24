"use client";

import { useRef } from "react";
import { createNote, deleteNote } from "@/lib/actions";
import DeleteButton from "@/components/DeleteButton";

type NoteItem = {
  id: string;
  title: string;
  content: string;
  linkedFile: string | null;
  updatedAt: Date;
};

export default function NotesBoard({ notes, section }: { notes: NoteItem[]; section: "STUDY" | "ARUS" | "PERSONAL" }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-4">
      <form
        ref={formRef}
        action={async (formData) => {
          await createNote(formData);
          formRef.current?.reset();
        }}
        className="space-y-2"
      >
        <input type="hidden" name="section" value={section} />
        <input
          name="title"
          placeholder="Título de la nota"
          required
          className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <textarea
          name="content"
          placeholder="Contenido..."
          rows={3}
          className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent resize-none"
        />
        <div className="flex items-center gap-2">
          <input
            name="linkedFile"
            placeholder="Ruta de archivo enlazado (opcional)"
            className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-accent"
          />
          <button type="submit" className="text-xs font-semibold text-accent hover:brightness-110 shrink-0">
            + añadir nota
          </button>
        </div>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-muted">Sin notas todavía.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {notes.map((note) => (
            <div key={note.id} className="bg-surface-2 border border-border rounded-lg p-3 group relative">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="text-sm font-medium">{note.title}</div>
                <DeleteButton
                  id={note.id}
                  action={deleteNote}
                  confirmMessage={`¿Borrar la nota "${note.title}"?`}
                  className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger text-xs transition-opacity shrink-0"
                />
              </div>
              {note.content && <p className="text-xs text-muted whitespace-pre-wrap mb-2">{note.content}</p>}
              {note.linkedFile && (
                <div className="text-[11px] font-mono text-accent truncate" title={note.linkedFile}>
                  📎 {note.linkedFile}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
