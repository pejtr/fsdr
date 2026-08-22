const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, "");

/**
 * Resolve the origin that is registered with the OAuth application.
 *
 * Railway should set VITE_PUBLIC_APP_URL to the canonical public URL (for
 * example https://femsider.com). Manus preview hostnames rotate and are not
 * valid OAuth redirect domains, so preview links intentionally fall back to
 * the stable Manus deployment instead of sending an invalid redirect_uri.
 */
const getOAuthAppOrigin = () => {
  const configuredOrigin = String(import.meta.env.VITE_PUBLIC_APP_URL ?? "").trim();
  if (configuredOrigin) return trimTrailingSlashes(configuredOrigin);

  const { origin, hostname } = window.location;
  if (hostname.endsWith(".manus.computer")) {
    return "https://femsider.manus.space";
  }

  return trimTrailingSlashes(origin);
};

// Generate the login URL only when a login action needs it. The callback URL
// must match an OAuth allow-listed production origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = trimTrailingSlashes(
    String(import.meta.env.VITE_OAUTH_PORTAL_URL ?? "https://oauth.manus.im")
  );
  const appId = String(import.meta.env.VITE_APP_ID ?? "");
  const redirectUri = `${getOAuthAppOrigin()}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

export const startLogin = () => {
  window.location.assign(getLoginUrl());
};

export const getPublicAppOrigin = () => getOAuthAppOrigin();
