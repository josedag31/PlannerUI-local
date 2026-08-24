import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getOAuthClient } from "@/lib/google";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/ajustes?google_error=${error}`, request.url));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/ajustes?google_error=sin_codigo", request.url));
  }

  const client = await getOAuthClient();
  if (!client) {
    return NextResponse.redirect(new URL("/ajustes?google_error=sin_credenciales", request.url));
  }

  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
    return NextResponse.redirect(new URL("/ajustes?google_error=tokens_incompletos", request.url));
  }

  const oauth2 = google.oauth2({ auth: client, version: "v2" });
  const { data: userInfo } = await oauth2.userinfo.get();

  await prisma.googleAccount.upsert({
    where: { id: 1 },
    update: {
      email: userInfo.email ?? null,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: BigInt(tokens.expiry_date),
      scope: tokens.scope ?? "",
    },
    create: {
      id: 1,
      email: userInfo.email ?? null,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: BigInt(tokens.expiry_date),
      scope: tokens.scope ?? "",
    },
  });

  return NextResponse.redirect(new URL("/ajustes?google_connected=1", request.url));
}
