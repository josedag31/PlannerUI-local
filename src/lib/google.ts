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
  return Boolean(account) && !account!.needsReconnect;
}

export async function getConnectedGoogleAccounts() {
  return prisma.googleAccount.findMany();
}

/**
 * Cuentas conectadas cuyo token ya no sirve (caducado, revocado, o emitido por
 * otro proyecto de Google Cloud). El dashboard las usa para avisar en vez de
 * dejar los widgets vacíos sin explicación.
 */
export async function getAccountsNeedingReconnect() {
  const accounts = await prisma.googleAccount.findMany({ where: { needsReconnect: true } });
  return accounts.map((a) => ({
    label: a.label,
    email: a.email,
    name: GOOGLE_ACCOUNT_LABELS.find((l) => l.value === a.label)?.name ?? a.label,
  }));
}

async function markNeedsReconnect(label: GoogleAccountLabel) {
  await prisma.googleAccount.update({ where: { label }, data: { needsReconnect: true } });
}

export async function disconnectGoogle(label: GoogleAccountLabel) {
  await prisma.googleAccount.deleteMany({ where: { label } });
}

/** Returns an OAuth2 client authenticated with the given account slot, refreshing the access token if needed. */
export async function getAuthenticatedClient(label: GoogleAccountLabel = "PERSONAL") {
  const account = await prisma.googleAccount.findUnique({ where: { label } });
  if (!account) return null;
  if (account.needsReconnect) return null;

  const config = await getGoogleOAuthConfig();
  if (!config) return null;

  // Un token solo se puede refrescar con el mismo Client ID que lo emitió. Si
  // las credenciales guardadas son de otro proyecto, Google responde
  // `unauthorized_client` sin más contexto — detectarlo aquí evita esa
  // confusión y pide reconectar, que es lo único que lo arregla.
  if (account.clientId && account.clientId !== config.clientId) {
    console.error(
      `[google] ${label}: el token lo emitió el Client ID ${account.clientId.slice(0, 20)}… ` +
        `pero ahora hay configurado ${config.clientId.slice(0, 20)}… — hay que reconectar la cuenta.`
    );
    await markNeedsReconnect(label);
    return null;
  }

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
      const message = err instanceof Error ? err.message : String(err);
      // `invalid_grant` = token caducado o revocado (típico del modo Prueba de
      // Google, que los caduca a los 7 días). `unauthorized_client` = las
      // credenciales no casan con las que lo emitieron. En ambos casos lo
      // único que lo arregla es reconectar, así que se marca para avisar.
      console.error(`[google] fallo al refrescar el token de ${label} (${message}) — hay que reconectar`);
      await markNeedsReconnect(label);
      return null;
    }
  }

  return client;
}
