// Auth utilities for Discord OAuth and JWT management

const AUTH_TOKEN_KEY = 'alles_standard_auth_token';
const AUTH_USER_KEY = 'alles_standard_user';

export interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function removeAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem(AUTH_USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function setUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

export function getDiscordOAuthUrl(): string {
  const clientId = import.meta.env.PUBLIC_DISCORD_CLIENT_ID;
  const redirectUri = `${import.meta.env.PUBLIC_SITE_URL}/members/callback/`;
  const scopes = ['identify'].join(' ');
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
  });

  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

export function logout(): void {
  removeAuthToken();
  window.location.href = '/';
}
