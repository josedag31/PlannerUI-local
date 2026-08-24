import { prisma } from "@/lib/prisma";

export const MICROSOFT_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "Mail.Read",
  "User.Read",
  "Calendars.ReadWrite",
];
export const DEFAULT_MICROSOFT_REDIRECT_URI = "http://localhost:3000/api/microsoft/callback";
export const DEFAULT_MICROSOFT_TENANT = "common";

type MicrosoftOAuthConfigRow = {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  redirectUri: string;
};

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
};

export async function getMicrosoftOAuthConfig() {
  return prisma.microsoftOAuthConfig.findUnique({ where: { id: 1 } });
}

export async function isMicrosoftConfigured() {
  const config = await getMicrosoftOAuthConfig();
  return Boolean(config?.clientId && config?.clientSecret);
}

export async function isMicrosoftConnected() {
  const account = await prisma.microsoftAccount.findUnique({ where: { id: 1 } });
  return Boolean(account);
}

export async function disconnectMicrosoft() {
  await prisma.microsoftAccount.deleteMany({});
}

export function buildAuthorizeUrl(config: MicrosoftOAuthConfigRow) {
  const url = new URL(`https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize`);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_mode", "query");
  url.searchParams.set("scope", MICROSOFT_SCOPES.join(" "));
  url.searchParams.set("prompt", "consent");
  return url.toString();
}

export async function exchangeCodeForTokens(config: MicrosoftOAuthConfigRow, code: string): Promise<TokenResponse> {
  const res = await fetch(`https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Microsoft token exchange failed: ${await res.text()}`);
  return res.json();
}

async function refreshTokens(config: MicrosoftOAuthConfigRow, refreshToken: string): Promise<TokenResponse> {
  const res = await fetch(`https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      scope: MICROSOFT_SCOPES.join(" "),
    }),
  });
  if (!res.ok) throw new Error(`Microsoft token refresh failed: ${await res.text()}`);
  return res.json();
}

/** Returns a valid Graph API access token, refreshing it if it's near expiry. Null if not connected. */
export async function getMicrosoftAccessToken(): Promise<string | null> {
  const account = await prisma.microsoftAccount.findUnique({ where: { id: 1 } });
  if (!account) return null;

  if (Number(account.expiryDate) > Date.now() + 60_000) {
    return account.accessToken;
  }

  const config = await getMicrosoftOAuthConfig();
  if (!config) return null;

  try {
    const tokens = await refreshTokens(config, account.refreshToken);
    await prisma.microsoftAccount.update({
      where: { id: 1 },
      data: {
        accessToken: tokens.access_token,
        expiryDate: BigInt(Date.now() + tokens.expires_in * 1000),
        ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
      },
    });
    return tokens.access_token;
  } catch (err) {
    console.error("[microsoft] token refresh failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
