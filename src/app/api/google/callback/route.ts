import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getOAuthClient } from "@/lib/google";
import { prisma } from "@/lib/prisma";
import type { GoogleAccountLabel } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  const label: GoogleAccountLabel = request.nextUrl.searchParams.get("state") === "ARUS" ? "ARUS" : "PERSONAL";

  if (error) {
    console.error(`[google] callback (${label}): Google devolvió error:`, error);
    return NextResponse.redirect(new URL(`/ajustes?google_error=${error}`, request.url));
  }
  if (!code) {
    console.error(`[google] callback (${label}): sin código de autorización en la query`);
    return NextResponse.redirect(new URL("/ajustes?google_error=sin_codigo", request.url));
  }

  const client = await getOAuthClient();
  if (!client) {
    console.error(`[google] callback (${label}): sin credenciales de Google configuradas`);
    return NextResponse.redirect(new URL("/ajustes?google_error=sin_credenciales", request.url));
  }

  try {
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    if (!tokens.access_token || !tokens.expiry_date) {
      console.error(`[google] callback (${label}): respuesta de Google sin access_token/expiry_date`, tokens);
      return NextResponse.redirect(new URL("/ajustes?google_error=tokens_incompletos", request.url));
    }

    // Google solo devuelve refresh_token la primera vez que se concede acceso
    // para esta combinación de cliente+cuenta+scopes — en una reconexión
    // puede omitirlo aunque access_type=offline y prompt=consent estén
    // puestos. Si no viene uno nuevo, reutilizamos el que ya teníamos en vez
    // de tratarlo como un fallo (eso era lo que dejaba la cuenta sin
    // reconectar de verdad).
    const existing = await prisma.googleAccount.findUnique({ where: { label } });
    const refreshToken = tokens.refresh_token ?? existing?.refreshToken;
    if (!refreshToken) {
      console.error(`[google] callback (${label}): sin refresh_token, ni nuevo ni guardado previamente`);
      return NextResponse.redirect(new URL("/ajustes?google_error=sin_refresh_token", request.url));
    }

    const oauth2 = google.oauth2({ auth: client, version: "v2" });
    const { data: userInfo } = await oauth2.userinfo.get();

    await prisma.googleAccount.upsert({
      where: { label },
      update: {
        email: userInfo.email ?? null,
        accessToken: tokens.access_token,
        refreshToken,
        expiryDate: BigInt(tokens.expiry_date),
        scope: tokens.scope ?? "",
      },
      create: {
        label,
        email: userInfo.email ?? null,
        accessToken: tokens.access_token,
        refreshToken,
        expiryDate: BigInt(tokens.expiry_date),
        scope: tokens.scope ?? "",
      },
    });

    return NextResponse.redirect(new URL(`/ajustes?google_connected=${label}`, request.url));
  } catch (err) {
    console.error(`[google] callback (${label}): fallo intercambiando el código por tokens:`, err);
    const message = err instanceof Error ? err.message : "desconocido";
    return NextResponse.redirect(
      new URL(`/ajustes?google_error=${encodeURIComponent(message)}`, request.url)
    );
  }
}
