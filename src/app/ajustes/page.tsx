import Card from "@/components/Card";
import { getSettings, SECTION_KEYS } from "@/lib/settings";
import { AppSettingsForm, SectionConfigForm } from "@/components/widgets/SettingsForms";

export default async function AjustesPage() {
  const settings = await getSettings();

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
      </div>
    </div>
  );
}
