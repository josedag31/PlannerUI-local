import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { getSettings } from "@/lib/settings";

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
    >
      <body className="min-h-full flex bg-background text-foreground" suppressHydrationWarning>
        <Sidebar appName={settings.appName} tagline={settings.tagline} sections={settings.sections} />
        <main className="flex-1 min-w-0 px-8 py-8 max-w-[1400px]">{children}</main>
      </body>
    </html>
  );
}
