import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import WelcomeOverlay from "@/components/WelcomeOverlay";
import { getSettings } from "@/lib/settings";

/** Decide si toca el saludo ANTES de que se pinte nada del body: sin esto, el
 * planner se ve durante un instante por debajo mientras React arranca y
 * decide mostrar el overlay. Marca <html> (leído por el CSS de
 * `.welcome-overlay` y por WelcomeOverlay) y consume el "primera vez en la
 * sesión" para que no se repita en la próxima navegación. */
const SCRIPT_DECISION_SALUDO = `(function(){try{if(sessionStorage.getItem('welcome-shown')!=='1'){sessionStorage.setItem('welcome-shown','1');document.documentElement.setAttribute('data-welcome-pending','1');}}catch(e){}})();`;

// La app entera lee de una BBDD SQLite local mutable (tareas, ajustes,
// cuentas de Google...) sin ningún beneficio de cachear/pre-renderizar
// nada: no hay CDN ni usuarios concurrentes, solo un lector local. Sin
// esto, `next build` marca páginas como esta (o el dashboard) como
// estáticas y las "congela" con los datos que hubiera en el momento de
// compilar — el `.exe` empaquetado serviría para siempre esa foto fija en
// vez de leer la BBDD real en cada visita.
export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: settings.appName,
    description: settings.tagline,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // El script de decisión del saludo (más abajo) marca este elemento con
      // data-welcome-pending antes de que React hidrate, a propósito: sin
      // este atributo se vería el planner un instante antes que el saludo.
      // React lo detecta como desajuste de hidratación; es intencional, no
      // hay nada que "arreglar".
      suppressHydrationWarning
    >
      <body className="min-h-full flex bg-background text-foreground" suppressHydrationWarning>
        <Script id="decision-saludo" strategy="beforeInteractive">
          {SCRIPT_DECISION_SALUDO}
        </Script>
        <WelcomeOverlay userName={settings.userName}>
          <Sidebar appName={settings.appName} tagline={settings.tagline} sections={settings.sections} />
          <main className="flex-1 min-w-0 px-8 py-8 max-w-[1400px]">{children}</main>
        </WelcomeOverlay>
      </body>
    </html>
  );
}
