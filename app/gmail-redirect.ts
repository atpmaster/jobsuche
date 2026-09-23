export function getGmailRedirectUri(request: Request, configuredRedirectUri?: string) {
  const requestUrl = new URL(request.url);
  const fallback = new URL("/api/gmail/callback", requestUrl.origin).toString();
  const configured = configuredRedirectUri?.trim();
  if (!configured) return fallback;

  try {
    const configuredUrl = new URL(configured);
    const isCurrentCallback =
      configuredUrl.origin === requestUrl.origin &&
      configuredUrl.pathname === "/api/gmail/callback" &&
      !configuredUrl.search &&
      !configuredUrl.hash;
    return isCurrentCallback ? configuredUrl.toString() : fallback;
  } catch {
    return fallback;
  }
}
