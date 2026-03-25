import Cookies from 'js-cookie';

export function removeToken(): void {
  Cookies.remove('csrf_token');
}

export function isAuthenticated(): boolean {
  // Authentication is managed via httponly cookie set by the server.
  // We check for the csrf_token cookie as a proxy for an active session,
  // since the access_token cookie is httponly and not readable by JS.
  const csrfToken = Cookies.get('csrf_token');
  return !!csrfToken;
}
