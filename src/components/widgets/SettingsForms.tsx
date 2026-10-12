"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateAppSettings,
  updateSectionConfig,
  updateGoogleOAuthConfig,
  updateMicrosoftOAuthConfig,
  updateDashboardAccounts,
  updateMobileInboxConfig,
  clearMobileInboxConfig,
} from "@/lib/actions";
import { syncInbox } from "@/lib/inboxActions";
import DriveFolderPicker from "@/components/widgets/DriveFolderPicker";

export function AppSettingsForm({
  appName,
  tagline,
  userName,
}: {
  appName: string;
  tagline: string;
  userName: string | null;
}) {
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={async (formData) => {
        await updateAppSettings(formData);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }}
      className="space-y-3"
    >
      <div>
        <label className="block text-xs text-muted mb-1">Nombre de la app</label>
        <input
          name="appName"
          defaultValue={appName}
          required
          maxLength={40}
          className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">Frase / subtítulo</label>
        <input
          name="tagline"
          defaultValue={tagline}
          maxLength={80}
          className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">Tu nombre (saludo de bienvenida)</label>
        <input
          name="userName"
          defaultValue={userName ?? ""}
          maxLength={30}
          placeholder="Déjalo vacío para saludar sin nombre"
          className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <button
        type="submit"
        className="bg-accent text-background text-sm font-semibold rounded-lg px-4 py-2 hover:brightness-110"
      >
        {saved ? "Guardado ✓" : "Guardar"}
      </button>
    </form>
  );
}

export function SectionConfigForm({
  sectionKey,
  label,
  color,
  icon,
}: {
  sectionKey: "STUDY" | "ARUS" | "PERSONAL";
  label: string;
  color: string;
  icon: string;
}) {
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={async (formData) => {
        await updateSectionConfig(formData);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }}
      className="flex flex-wrap items-end gap-3 bg-surface-2 border border-border rounded-lg p-4"
    >
      <input type="hidden" name="key" value={sectionKey} />
      <div className="flex-1 min-w-[140px]">
        <label className="block text-xs text-muted mb-1">Nombre de la sección</label>
        <input
          name="label"
          defaultValue={label}
          required
          maxLength={24}
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">Icono</label>
        <input
          name="icon"
          defaultValue={icon}
          required
          maxLength={2}
          className="w-16 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-center outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">Color</label>
        <input
          type="color"
          name="color"
          defaultValue={color}
          className="w-14 h-[38px] bg-surface border border-border rounded-lg cursor-pointer"
        />
      </div>
      <button
        type="submit"
        className="text-sm font-semibold text-accent hover:brightness-110 px-2 py-2"
      >
        {saved ? "Guardado ✓" : "Guardar"}
      </button>
    </form>
  );
}

export function GoogleOAuthConfigForm({
  clientId,
  redirectUri,
}: {
  clientId: string;
  redirectUri: string;
}) {
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={async (formData) => {
        if (
          clientId &&
          !window.confirm(
            "Ya tienes cuentas conectadas con las credenciales actuales. Si las cambias, esas conexiones dejarán de funcionar (tendrás que reconectarlas todas). ¿Seguro que quieres guardar unas nuevas?"
          )
        ) {
          return;
        }
        await updateGoogleOAuthConfig(formData);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }}
      className="space-y-3"
    >
      <div>
        <label className="block text-xs text-muted mb-1">Client ID</label>
        <input
          name="clientId"
          defaultValue={clientId}
          required
          placeholder="xxxxxxxxxx.apps.googleusercontent.com"
          className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent font-mono"
        />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">Client secret</label>
        <input
          name="clientSecret"
          type="password"
          required
          placeholder="GOCSPX-..."
          className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent font-mono"
        />
        <p className="text-[11px] text-muted mt-1">
          No se muestra por seguridad una vez guardado: si vuelves a guardar, tienes que pegarlo de nuevo.
        </p>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">Redirect URI (regístrala igual en Google Cloud)</label>
        <input
          name="redirectUri"
          defaultValue={redirectUri}
          required
          className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent font-mono"
        />
      </div>
      <button
        type="submit"
        className="bg-accent text-background text-sm font-semibold rounded-lg px-4 py-2 hover:brightness-110"
      >
        {saved ? "Guardado ✓" : "Guardar credenciales"}
      </button>
    </form>
  );
}

export function MicrosoftOAuthConfigForm({
  clientId,
  tenantId,
  redirectUri,
}: {
  clientId: string;
  tenantId: string;
  redirectUri: string;
}) {
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={async (formData) => {
        if (
          clientId &&
          !window.confirm(
            "Si cambias estas credenciales, tu cuenta de Outlook conectada dejará de funcionar (tendrás que reconectarla). ¿Seguro que quieres guardar unas nuevas?"
          )
        ) {
          return;
        }
        await updateMicrosoftOAuthConfig(formData);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }}
      className="space-y-3"
    >
      <div>
        <label className="block text-xs text-muted mb-1">Application (client) ID</label>
        <input
          name="clientId"
          defaultValue={clientId}
          required
          placeholder="00000000-0000-0000-0000-000000000000"
          className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent font-mono"
        />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">Client secret (Value, no el Secret ID)</label>
        <input
          name="clientSecret"
          type="password"
          required
          placeholder="valor del secreto"
          className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent font-mono"
        />
        <p className="text-[11px] text-muted mt-1">
          No se muestra por seguridad una vez guardado: si vuelves a guardar, tienes que pegarlo de nuevo.
        </p>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">Tenant ID (deja &quot;common&quot; salvo que sepas que necesitas otro)</label>
        <input
          name="tenantId"
          defaultValue={tenantId}
          required
          className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent font-mono"
        />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">Redirect URI (regístrala igual en Azure)</label>
        <input
          name="redirectUri"
          defaultValue={redirectUri}
          required
          className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent font-mono"
        />
      </div>
      <button
        type="submit"
        className="bg-accent text-background text-sm font-semibold rounded-lg px-4 py-2 hover:brightness-110"
      >
        {saved ? "Guardado ✓" : "Guardar credenciales"}
      </button>
    </form>
  );
}

export function DashboardAccountsForm({
  calendar,
  drive,
  gmail,
  driveFolderId,
  driveFolderName,
  driveConnected,
  accountOptions,
}: {
  calendar: "PERSONAL" | "ARUS";
  drive: "PERSONAL" | "ARUS";
  gmail: "PERSONAL" | "ARUS";
  driveFolderId: string | null;
  driveFolderName: string | null;
  driveConnected: boolean;
  accountOptions: { value: "PERSONAL" | "ARUS"; name: string; connected: boolean }[];
}) {
  const [saved, setSaved] = useState(false);
  const [folderId, setFolderId] = useState(driveFolderId);
  const [folderName, setFolderName] = useState(driveFolderName);
  const [picking, setPicking] = useState(false);

  return (
    <form
      action={async (formData) => {
        await updateDashboardAccounts(formData);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }}
      className="space-y-3"
    >
      {[
        { name: "calendar", label: "Google Calendar", value: calendar },
        { name: "drive", label: "Google Drive", value: drive },
        { name: "gmail", label: "Gmail", value: gmail },
      ].map((field) => (
        <div key={field.name} className="flex items-center justify-between gap-3">
          <label className="text-sm text-muted">{field.label}</label>
          <select
            name={field.name}
            defaultValue={field.value}
            className="bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-accent"
          >
            {accountOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.name}
                {!opt.connected ? " (sin conectar)" : ""}
              </option>
            ))}
          </select>
        </div>
      ))}

      <input type="hidden" name="driveFolderId" value={folderId ?? ""} />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm text-muted">Carpeta de Drive</label>
          <div className="flex items-center gap-2">
            <span className="text-sm truncate max-w-[180px]">{folderName ?? "Todo el Drive (más reciente)"}</span>
            <button
              type="button"
              disabled={!driveConnected}
              onClick={() => setPicking((v) => !v)}
              className="text-xs font-semibold text-accent hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {picking ? "Cerrar" : "Cambiar"}
            </button>
          </div>
        </div>
        {!driveConnected && (
          <p className="text-xs text-muted">Conecta y guarda la cuenta de Drive de arriba para poder elegir una carpeta.</p>
        )}
        {picking && (
          <DriveFolderPicker
            label={drive}
            onSelect={(folder) => {
              setFolderId(folder.id || null);
              setFolderName(folder.name || null);
              setPicking(false);
            }}
            onClose={() => setPicking(false)}
          />
        )}
      </div>

      <button
        type="submit"
        className="bg-accent text-background text-sm font-semibold rounded-lg px-4 py-2 hover:brightness-110"
      >
        {saved ? "Guardado ✓" : "Guardar"}
      </button>
    </form>
  );
}

export function MobileInboxForm({
  url,
  configured,
  lastSyncAt,
  lastError,
}: {
  url: string;
  configured: boolean;
  lastSyncAt: Date | null;
  lastError: string | null;
}) {
  const [saved, setSaved] = useState(false);
  const [prueba, setPrueba] = useState<string | null>(null);
  const [probando, setProbando] = useState(false);
  const router = useRouter();

  const recogerAhora = async () => {
    setProbando(true);
    setPrueba(null);
    try {
      const r = await syncInbox();
      setPrueba(
        r.status === "ok"
          ? r.imported === 0
            ? "✓ Conectado. No había nada pendiente."
            : `✓ Conectado. Recogido: ${[
                r.tasks > 0 && `${r.tasks} ${r.tasks === 1 ? "tarea" : "tareas"}`,
                r.events > 0 && `${r.events} ${r.events === 1 ? "evento" : "eventos"}`,
              ]
                .filter(Boolean)
                .join(" y ")}.`
          : r.status === "off"
            ? "Guarda primero la URL y el token."
            : `✕ ${r.error}`
      );
    } finally {
      setProbando(false);
      // Trae la línea de estado (última recogida / error) recién guardada.
      router.refresh();
    }
  };

  return (
    <div className="space-y-4">
      {configured && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-2 border border-border rounded-lg p-3">
          <div className="text-sm">
            <span className="font-medium">Buzón</span>
            {lastError ? (
              <div className="text-xs text-danger mt-0.5">▲ {lastError}</div>
            ) : lastSyncAt ? (
              <div className="text-xs text-accent mt-0.5">
                ● Última recogida:{" "}
                {new Date(lastSyncAt).toLocaleString("es-ES", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            ) : (
              <div className="text-xs text-muted mt-0.5">Aún no se ha recogido nada</div>
            )}
            {prueba && <div className="text-xs text-foreground/80 mt-1">{prueba}</div>}
          </div>
          <button
            type="button"
            onClick={recogerAhora}
            disabled={probando}
            className="text-xs font-semibold rounded-lg px-3 py-2 bg-accent text-background hover:brightness-110 disabled:opacity-60 shrink-0"
          >
            {probando ? "Recogiendo…" : "Recoger ahora"}
          </button>
        </div>
      )}

      <form
        action={async (formData) => {
          await updateMobileInboxConfig(formData);
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }}
        className="space-y-3"
      >
        <div>
          <label className="block text-xs text-muted mb-1">URL del buzón</label>
          <input
            name="url"
            type="url"
            defaultValue={url}
            required
            placeholder="https://planner-inbox.<tu-subdominio>.workers.dev"
            className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent font-mono"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Token</label>
          <input
            name="token"
            type="password"
            required={!configured}
            autoComplete="off"
            placeholder={configured ? "•••••••• (déjalo vacío para mantener el actual)" : "El mismo que guardaste en Cloudflare"}
            className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent font-mono"
          />
          <p className="text-[11px] text-muted mt-1">
            No se vuelve a mostrar una vez guardado. Es el mismo que lleva el atajo del iPhone.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="bg-accent text-background text-sm font-semibold rounded-lg px-4 py-2 hover:brightness-110"
          >
            {saved ? "Guardado ✓" : "Guardar"}
          </button>
          {configured && (
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm("¿Desconectar el buzón? Las tareas que queden en él se quedarán allí hasta que lo vuelvas a conectar.")) return;
                await clearMobileInboxConfig();
              }}
              className="text-xs font-semibold text-danger hover:brightness-110 border border-border rounded-lg px-3 py-2"
            >
              Desconectar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
