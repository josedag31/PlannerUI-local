import Card from "@/components/Card";
import { getSettings, SECTION_KEYS } from "@/lib/settings";
import {
  AppSettingsForm,
  SectionConfigForm,
  GoogleOAuthConfigForm,
  MicrosoftOAuthConfigForm,
} from "@/components/widgets/SettingsForms";
import {
  isGoogleConfigured,
  getGoogleOAuthConfig,
  getConnectedGoogleAccounts,
  DEFAULT_REDIRECT_URI,
  GOOGLE_ACCOUNT_LABELS,
} from "@/lib/google";
import {
  isMicrosoftConfigured,
  isMicrosoftConnected,
  getMicrosoftOAuthConfig,
  DEFAULT_MICROSOFT_REDIRECT_URI,
  DEFAULT_MICROSOFT_TENANT,
} from "@/lib/microsoft";
import { prisma } from "@/lib/prisma";
import type { GoogleAccountLabel } from "@/generated/prisma/client";

function GoogleAccountBlock({
  label,
  name,
  connected,
  email,
  configured,
}: {
  label: GoogleAccountLabel;
  name: string;
  connected: boolean;
  email: string | null;
  configured: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 bg-surface-2 border border-border rounded-lg p-3">
      <div className="text-sm">
        <span className="font-medium">{name}</span>
        {connected ? (
          <div className="text-xs text-accent mt-0.5">
            ● Conectado{email ? ` como ${email}` : ""}
          </div>
        ) : (
          <div className="text-xs text-muted mt-0.5">Sin conectar</div>
        )}
      </div>
      {connected ? (
        <form action="/api/google/disconnect" method="POST">
          <input type="hidden" name="label" value={label} />
          <button
            type="submit"
            className="text-xs font-semibold text-danger hover:brightness-110 border border-border rounded-lg px-3 py-2 shrink-0"
          >
            Desconectar
          </button>
        </form>
      ) : (
        <a
          href={`/api/google/connect?label=${label}`}
          aria-disabled={!configured}
          className={`text-xs font-semibold rounded-lg px-3 py-2 shrink-0 ${
            configured
              ? "bg-accent text-background hover:brightness-110"
              : "bg-surface text-muted pointer-events-none"
          }`}
        >
          Conectar
        </a>
      )}
    </div>
  );
}

export default async function AjustesPage({
  searchParams,
}: {
  searchParams: Promise<{
    google_connected?: string;
    google_disconnected?: string;
    google_error?: string;
    microsoft_connected?: string;
    microsoft_disconnected?: string;
    microsoft_error?: string;
  }>;
}) {
  const settings = await getSettings();
  const params = await searchParams;
  const configured = await isGoogleConfigured();
  const accounts = await getConnectedGoogleAccounts();
  const oauthConfig = await getGoogleOAuthConfig();

  const msConfigured = await isMicrosoftConfigured();
  const msConnected = await isMicrosoftConnected();
  const msAccount = msConnected ? await prisma.microsoftAccount.findUnique({ where: { id: 1 } }) : null;
  const msOauthConfig = await getMicrosoftOAuthConfig();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Ajustes</h1>
        <p className="text-sm text-muted mt-1">
          Personaliza el nombre de la app y las secciones. Los cambios se aplican en todo el dashboard al instante.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Identidad de la app">
          <AppSettingsForm appName={settings.appName} tagline={settings.tagline} />
        </Card>

        <Card title="Secciones">
          <div className="space-y-3">
            {SECTION_KEYS.map((key) => (
              <SectionConfigForm
                key={key}
                sectionKey={key}
                label={settings.sections[key].label}
                color={settings.sections[key].color}
                icon={settings.sections[key].icon}
              />
            ))}
          </div>
        </Card>

        <Card title="Conexión con Google" className="lg:col-span-2">
          {params.google_connected && (
            <p className="text-xs text-accent mb-3">Cuenta de Google conectada correctamente.</p>
          )}
          {params.google_disconnected && (
            <p className="text-xs text-muted mb-3">Cuenta de Google desconectada.</p>
          )}
          {params.google_error && (
            <p className="text-xs text-danger mb-3">Error al conectar con Google: {params.google_error}</p>
          )}

          {!configured && (
            <p className="text-sm text-muted mb-4">
              Introduce las credenciales de tu proyecto de Google Cloud para poder conectar cuentas. Consulta el
              README (sección &quot;Fase 2&quot;) para los pasos exactos.
            </p>
          )}

          <p className="text-xs text-muted mb-3">
            Puedes conectar dos cuentas de Google: <strong>Personal</strong> (Calendario, Drive y Gmail del
            dashboard, y a donde se sincronizan tus tareas/exámenes/eventos) y <strong>ARUS</strong> (Drive del
            equipo, se usa en la página ARUS). Las dos usan las mismas credenciales de abajo — solo tienes que
            añadir la segunda cuenta como usuario de prueba en tu proyecto de Google Cloud.
          </p>

          <div className="space-y-2 mb-6">
            {GOOGLE_ACCOUNT_LABELS.map(({ value, name }) => {
              const account = accounts.find((a) => a.label === value);
              return (
                <GoogleAccountBlock
                  key={value}
                  label={value}
                  name={name}
                  connected={Boolean(account)}
                  email={account?.email ?? null}
                  configured={configured}
                />
              );
            })}
          </div>

          <details className="text-sm" open={!configured}>
            <summary className="cursor-pointer text-muted hover:text-foreground select-none">
              {configured ? "Editar credenciales de Google" : "Credenciales de Google"}
            </summary>
            <div className="mt-3">
              <GoogleOAuthConfigForm
                clientId={oauthConfig?.clientId ?? ""}
                redirectUri={oauthConfig?.redirectUri ?? DEFAULT_REDIRECT_URI}
              />
            </div>
          </details>
        </Card>

        <Card title="Conexión con Microsoft (Outlook)" className="lg:col-span-2">
          {params.microsoft_connected && (
            <p className="text-xs text-accent mb-3">Cuenta de Microsoft conectada correctamente.</p>
          )}
          {params.microsoft_disconnected && (
            <p className="text-xs text-muted mb-3">Cuenta de Microsoft desconectada.</p>
          )}
          {params.microsoft_error && (
            <p className="text-xs text-danger mb-3">Error al conectar con Microsoft: {params.microsoft_error}</p>
          )}

          {!msConfigured && (
            <p className="text-sm text-muted mb-4">
              Introduce las credenciales de tu app de Azure para poder conectar tu cuenta de Outlook (por ejemplo,
              tu correo de la universidad). Consulta el README (sección &quot;Outlook&quot;) para los pasos exactos.
            </p>
          )}

          <div className="flex items-center justify-between gap-4 bg-surface-2 border border-border rounded-lg p-3 mb-6">
            <div className="text-sm">
              <span className="font-medium">Outlook</span>
              {msConnected ? (
                <div className="text-xs text-accent mt-0.5">
                  ● Conectado{msAccount?.email ? ` como ${msAccount.email}` : ""}
                </div>
              ) : (
                <div className="text-xs text-muted mt-0.5">Sin conectar</div>
              )}
            </div>
            {msConnected ? (
              <form action="/api/microsoft/disconnect" method="POST">
                <button
                  type="submit"
                  className="text-xs font-semibold text-danger hover:brightness-110 border border-border rounded-lg px-3 py-2 shrink-0"
                >
                  Desconectar
                </button>
              </form>
            ) : (
              <a
                href="/api/microsoft/connect"
                aria-disabled={!msConfigured}
                className={`text-xs font-semibold rounded-lg px-3 py-2 shrink-0 ${
                  msConfigured
                    ? "bg-accent text-background hover:brightness-110"
                    : "bg-surface text-muted pointer-events-none"
                }`}
              >
                Conectar
              </a>
            )}
          </div>

          <details className="text-sm" open={!msConfigured}>
            <summary className="cursor-pointer text-muted hover:text-foreground select-none">
              {msConfigured ? "Editar credenciales de Microsoft" : "Credenciales de Microsoft"}
            </summary>
            <div className="mt-3">
              <MicrosoftOAuthConfigForm
                clientId={msOauthConfig?.clientId ?? ""}
                tenantId={msOauthConfig?.tenantId ?? DEFAULT_MICROSOFT_TENANT}
                redirectUri={msOauthConfig?.redirectUri ?? DEFAULT_MICROSOFT_REDIRECT_URI}
              />
            </div>
          </details>
        </Card>
      </div>
    </div>
  );
}
