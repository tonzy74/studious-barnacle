import Cookies from 'js-cookie';

const TOKEN_KEY = 'access_token';

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_KEY);
}

export function setToken(token: string, expiresInHours: number = 24): void {
  Cookies.set(TOKEN_KEY, token, {
    expires: expiresInHours / 24,
    sameSite: 'lax',
    secure: window.location.protocol === 'https:',
  });
}

export function removeToken(): void {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove('csrf_token');
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;

  const payload = parseJWT(token);
  if (!payload) return false;

  if (payload.exp) {
    const expiryDate = new Date(payload.exp * 1000);
    if (expiryDate <= new Date()) {
      removeToken();
      return false;
    }
  }

  return true;
}

export function parseJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}
