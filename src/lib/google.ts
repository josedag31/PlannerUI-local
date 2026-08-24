import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

export function isGoogleConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI
  );
}

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export async function isGoogleConnected() {
  const account = await prisma.googleAccount.findUnique({ where: { id: 1 } });
  return Boolean(account);
}

export async function disconnectGoogle() {
  await prisma.googleAccount.deleteMany({});
}

/** Returns an OAuth2 client authenticated with the stored account, refreshing the access token if needed. */
export async function getAuthenticatedClient() {
  const account = await prisma.googleAccount.findUnique({ where: { id: 1 } });
  if (!account) return null;

  const client = getOAuthClient();
  client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    expiry_date: Number(account.expiryDate),
    scope: account.scope,
  });

  client.on("tokens", async (tokens) => {
    await prisma.googleAccount.update({
      where: { id: 1 },
      data: {
        accessToken: tokens.access_token ?? account.accessToken,
        expiryDate: BigInt(tokens.expiry_date ?? Number(account.expiryDate)),
        ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
      },
    });
  });

  if (Number(account.expiryDate) < Date.now() + 60_000) {
    await client.refreshAccessToken();
  }

  return client;
}
