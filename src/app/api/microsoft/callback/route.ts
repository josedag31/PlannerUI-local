import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, getMicrosoftOAuthConfig } from "@/lib/microsoft";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/ajustes?microsoft_error=${error}`, request.url));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/ajustes?microsoft_error=sin_codigo", request.url));
  }

  const config = await getMicrosoftOAuthConfig();
  if (!config) {
    return NextResponse.redirect(new URL("/ajustes?microsoft_error=sin_credenciales", request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(config, code);

    const profileRes = await fetch("https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile: { mail?: string; userPrincipalName?: string } = profileRes.ok ? await profileRes.json() : {};

    await prisma.microsoftAccount.upsert({
      where: { id: 1 },
      update: {
        email: profile.mail ?? profile.userPrincipalName ?? null,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? "",
        expiryDate: BigInt(Date.now() + tokens.expires_in * 1000),
        scope: tokens.scope ?? "",
      },
      create: {
        id: 1,
        email: profile.mail ?? profile.userPrincipalName ?? null,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? "",
        expiryDate: BigInt(Date.now() + tokens.expires_in * 1000),
        scope: tokens.scope ?? "",
      },
    });

    return NextResponse.redirect(new URL("/ajustes?microsoft_connected=1", request.url));
  } catch (err) {
    console.error("[microsoft] callback failed:", err instanceof Error ? err.message : err);
    return NextResponse.redirect(new URL("/ajustes?microsoft_error=token_exchange", request.url));
  }
}
