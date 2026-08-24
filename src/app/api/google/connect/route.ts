import { NextResponse } from "next/server";
import { getOAuthClient, GOOGLE_SCOPES, isGoogleConfigured } from "@/lib/google";

export async function GET() {
  if (!(await isGoogleConfigured())) {
    return NextResponse.json(
      { error: "Faltan las credenciales de Google. Configúralas en /ajustes." },
      { status: 400 }
    );
  }

  const client = await getOAuthClient();
  if (!client) {
    return NextResponse.json({ error: "No se pudo crear el cliente de Google." }, { status: 400 });
  }

  const url = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SCOPES,
  });

  return NextResponse.redirect(url);
}
