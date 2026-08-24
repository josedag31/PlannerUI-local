import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import type { GoogleAccountLabel } from "@/generated/prisma/client";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

export const DEFAULT_REDIRECT_URI = "http://localhost:3000/api/google/callback";

export const GOOGLE_ACCOUNT_LABELS: { value: GoogleAccountLabel; name: string }[] = [
  { value: "PERSONAL", name: "Personal" },
  { value: "ARUS", name: "ARUS" },
];

export async function getGoogleOAuthConfig() {
  return prisma.googleOAuthConfig.findUnique({ where: { id: 1 } });
}

export async function isGoogleConfigured() {
  const config = await getGoogleOAuthConfig();
  return Boolean(config?.clientId && config?.clientSecret);
}

export async function getOAuthClient() {
  const config = await getGoogleOAuthConfig();
  if (!config) return null;
  return new google.auth.OAuth2(config.clientId, config.clientSecret, config.redirectUri);
}

export async function isGoogleConnected(label: GoogleAccountLabel = "PERSONAL") {
  const account = await prisma.googleAccount.findUnique({ where: { label } });
  return Boolean(account);
}

export async function getConnectedGoogleAccounts() {
  return prisma.googleAccount.findMany();
}

export async function disconnectGoogle(label: GoogleAccountLabel) {
  await prisma.googleAccount.deleteMany({ where: { label } });
}

/** Returns an OAuth2 client authenticated with the given account slot, refreshing the access token if needed. */
export async function getAuthenticatedClient(label: GoogleAccountLabel = "PERSONAL") {
  const account = await prisma.googleAccount.findUnique({ where: { label } });
  if (!account) return null;

  const client = await getOAuthClient();
  if (!client) return null;

  client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    expiry_date: Number(account.expiryDate),
    scope: account.scope,
  });

  client.on("tokens", async (tokens) => {
    await prisma.googleAccount.update({
      where: { label },
      data: {
        accessToken: tokens.access_token ?? account.accessToken,
        expiryDate: BigInt(tokens.expiry_date ?? Number(account.expiryDate)),
        ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
      },
    });
  });

  if (Number(account.expiryDate) < Date.now() + 60_000) {
    try {
      await client.refreshAccessToken();
    } catch (err) {
      console.error(
        `[google] token refresh failed for ${label} — reconnect from /ajustes:`,
        err instanceof Error ? err.message : err
      );
      return null;
    }
  }

  return client;
}
