import Card from "@/components/Card";
import { getSettings, SECTION_KEYS } from "@/lib/settings";
import { AppSettingsForm, SectionConfigForm } from "@/components/widgets/SettingsForms";
import { isGoogleConfigured, isGoogleConnected } from "@/lib/google";
import { prisma } from "@/lib/prisma";

export default async function AjustesPage({
  searchParams,
}: {
  searchParams: Promise<{ google_connected?: string; google_disconnected?: string; google_error?: string }>;
}) {
  const settings = await getSettings();
  const params = await searchParams;
  const configured = isGoogleConfigured();
  const connected = await isGoogleConnected();
  const account = connected ? await prisma.googleAccount.findUnique({ where: { id: 1 } }) : null;

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

          {!configured ? (
            <div className="text-sm text-muted space-y-2">
              <p>
                Todavía no has configurado las credenciales de Google. Añade{" "}
                <code className="text-accent">GOOGLE_CLIENT_ID</code>,{" "}
                <code className="text-accent">GOOGLE_CLIENT_SECRET</code> y{" "}
                <code className="text-accent">GOOGLE_REDIRECT_URI</code> en tu <code>.env</code>.
              </p>
              <p>Consulta el README (sección &quot;Fase 2&quot;) para los pasos exactos en Google Cloud Console.</p>
            </div>
          ) : connected ? (
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm">
                <span className="text-accent">●</span> Conectado{account?.email ? ` como ${account.email}` : ""}.
                <div className="text-xs text-muted mt-1">
                  Calendario, Drive y Gmail (solo lectura) disponibles en el dashboard.
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
          ) : (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted">
                Conecta tu cuenta de Google para ver tu Calendario, Drive y Gmail en el dashboard.
              </p>
              <a
                href="/api/google/connect"
                className="bg-accent text-background text-sm font-semibold rounded-lg px-4 py-2 hover:brightness-110 shrink-0"
              >
                Conectar Google
              </a>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
