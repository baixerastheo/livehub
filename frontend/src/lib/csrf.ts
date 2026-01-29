const CSRF_COOKIE_NAME = "csrf_token";

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie ? document.cookie.split("; ") : [];

  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split("=");
    if (key === name) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return null;
}

export function getCsrfToken(): string | null {
  return getCookieValue(CSRF_COOKIE_NAME);
}

