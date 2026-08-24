import { NextResponse } from "next/server";
import { buildAuthorizeUrl, getMicrosoftOAuthConfig, isMicrosoftConfigured } from "@/lib/microsoft";

export async function GET() {
  if (!(await isMicrosoftConfigured())) {
    return NextResponse.json(
      { error: "Faltan las credenciales de Microsoft. Configúralas en /ajustes." },
      { status: 400 }
    );
  }

  const config = await getMicrosoftOAuthConfig();
  if (!config) {
    return NextResponse.json({ error: "No se pudo cargar la configuración de Microsoft." }, { status: 400 });
  }

  return NextResponse.redirect(buildAuthorizeUrl(config));
}
