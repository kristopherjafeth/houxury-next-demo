import { ZOHO_CONFIG } from "./config";

let cachedToken: { token: string; expiresAt: number } | null = null;

const getCredentials = () => {
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error(
      "Credenciales de Zoho no configuradas. Define ZOHO_REFRESH_TOKEN, ZOHO_CLIENT_ID y ZOHO_CLIENT_SECRET en el entorno."
    );
  }

  return { refreshToken, clientId, clientSecret };
};

export const fetchAccessToken = async (): Promise<string> => {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const { refreshToken, clientId, clientSecret } = getCredentials();
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });

  const response = await fetch(ZOHO_CONFIG.TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `No se pudo obtener el access token de Zoho: ${response.status} ${text}`
    );
  }

  const data: { access_token?: string; expires_in?: number } =
    await response.json();

  if (!data.access_token) {
    throw new Error("La respuesta de Zoho no incluye access_token");
  }

  const expiresIn = data.expires_in ? data.expires_in * 1000 : 55 * 60 * 1000;
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + expiresIn,
  };

  return data.access_token;
};
