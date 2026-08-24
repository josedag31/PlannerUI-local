import Card from "@/components/Card";
import { getSettings, SECTION_KEYS } from "@/lib/settings";
import { AppSettingsForm, SectionConfigForm, GoogleOAuthConfigForm } from "@/components/widgets/SettingsForms";
import { isGoogleConfigured, isGoogleConnected, getGoogleOAuthConfig, DEFAULT_REDIRECT_URI } from "@/lib/google";
import { prisma } from "@/lib/prisma";

export default async function AjustesPage({
  searchParams,
}: {
  searchParams: Promise<{ google_connected?: string; google_disconnected?: string; google_error?: string }>;
}) {
  const settings = await getSettings();
  const params = await searchParams;
  const configured = await isGoogleConfigured();
  const connected = await isGoogleConnected();
  const account = connected ? await prisma.googleAccount.findUnique({ where: { id: 1 } }) : null;
  const oauthConfig = await getGoogleOAuthConfig();

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

          {connected ? (
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="text-sm">
                <span className="text-accent">●</span> Conectado{account?.email ? ` como ${account.email}` : ""}.
                <div className="text-xs text-muted mt-1">
                  Calendario, Drive y Gmail disponibles en el dashboard. Las tareas, exámenes y eventos que crees
                  con fecha se añaden también a tu Google Calendar.
                </div>
              </div>
              <form action="/api/google/disconnect" method="POST">
                <button
                  type="submit"
                  className="text-xs font-semibold text-danger hover:brightness-110 border border-border rounded-lg px-3 py-2"
                >
                  Desconectar
                </button>
              </form>
            </div>
          ) : configured ? (
            <div className="flex items-center justify-between gap-4 mb-6">
              <p className="text-sm text-muted">
                Credenciales guardadas. Conecta tu cuenta de Google para ver tu Calendario, Drive y Gmail en el
                dashboard.
              </p>
              <a
                href="/api/google/connect"
                className="bg-accent text-background text-sm font-semibold rounded-lg px-4 py-2 hover:brightness-110 shrink-0"
              >
                Conectar Google
              </a>
            </div>
          ) : (
            <p className="text-sm text-muted mb-6">
              Introduce las credenciales de tu proyecto de Google Cloud para poder conectar tu cuenta. Consulta el
              README (sección &quot;Fase 2&quot;) para los pasos exactos.
            </p>
          )}

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
      </div>
    </div>
  );
}
