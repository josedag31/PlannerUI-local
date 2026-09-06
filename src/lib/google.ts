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

/**
 * Hay cuenta vinculada. No comprueba si su token sirve: eso lo decide
 * `getAuthenticatedClient` al usarlo, y es a propósito. Si aquí se excluyeran
 * las cuentas marcadas como caducadas, sus widgets no se dibujarían, nunca se
 * intentaría refrescar el token y una marca puesta por error se quedaría
 * clavada para siempre. Para avisar en la interfaz está
 * `getAccountsNeedingReconnect`.
 */
export async function isGoogleConnected(label: GoogleAccountLabel = "PERSONAL") {
  const account = await prisma.googleAccount.findUnique({ where: { label } });
  return Boolean(account);
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

async function setNeedsReconnect(label: GoogleAccountLabel, value: boolean) {
  await prisma.googleAccount.update({ where: { label }, data: { needsReconnect: value } });
}

/**
 * Distingue "este token está muerto" de "ahora mismo no se puede hablar con
 * Google". Solo lo primero justifica pedirle al usuario que reconecte: marcar
 * la cuenta por un corte de red la dejaría inservible hasta que la reconectase
 * a mano, que es justo la molestia que se quiere evitar.
 */
function isTokenPermanentlyDead(message: string) {
  return ["invalid_grant", "unauthorized_client", "invalid_client", "invalid_request"].some((code) =>
    message.includes(code)
  );
}

export async function disconnectGoogle(label: GoogleAccountLabel) {
  await prisma.googleAccount.deleteMany({ where: { label } });
}

/** Returns an OAuth2 client authenticated with the given account slot, refreshing the access token if needed. */
export async function getAuthenticatedClient(label: GoogleAccountLabel = "PERSONAL") {
  const account = await prisma.googleAccount.findUnique({ where: { label } });
  if (!account) return null;

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
    if (!account.needsReconnect) await setNeedsReconnect(label, true);
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

  // Si la cuenta viene marcada como caducada se fuerza un refresco aunque el
  // access token parezca vigente: es la única forma de comprobar si la marca
  // sigue siendo cierta y poder quitarla sola. Sin esto, una marca puesta por
  // un fallo pasajero se quedaba para siempre y obligaba a reconectar a mano
  // una cuenta que en realidad funcionaba.
  const tokenExpired = Number(account.expiryDate) < Date.now() + 60_000;

  if (tokenExpired || account.needsReconnect) {
    try {
      await client.refreshAccessToken();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      if (isTokenPermanentlyDead(message)) {
        // `invalid_grant` = token caducado o revocado. `unauthorized_client` =
        // las credenciales no casan con las que lo emitieron. Solo reconectar
        // lo arregla, así que se marca para avisar en la interfaz.
        console.error(`[google] el token de ${label} ya no vale (${message}) — hay que reconectar`);
        if (!account.needsReconnect) await setNeedsReconnect(label, true);
      } else {
        // Corte de red, DNS, Google caído... El token puede seguir siendo
        // bueno: se deja como está y ya funcionará en la siguiente carga.
        console.error(`[google] no se pudo contactar con Google para ${label} (${message}) — se reintentará`);
      }
      return null;
    }

    // El refresco ha ido bien: si la cuenta estaba marcada, la marca era vieja.
    if (account.needsReconnect) {
      console.log(`[google] ${label} vuelve a funcionar — se quita el aviso de reconexión`);
      await setNeedsReconnect(label, false);
    }
  }

  return client;
}
