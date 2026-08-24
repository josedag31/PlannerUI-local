"use client";

import { useState } from "react";
import { updateAppSettings, updateSectionConfig, updateGoogleOAuthConfig, updateMicrosoftOAuthConfig } from "@/lib/actions";

export function AppSettingsForm({ appName, tagline }: { appName: string; tagline: string }) {
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
