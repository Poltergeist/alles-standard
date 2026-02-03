// API client for backend requests

import { getAuthToken } from './auth';

const API_BASE_URL = import.meta.env.PUBLIC_API_URL;

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Request failed' };
    }

    return { data };
  } catch (error) {
    console.error('API request error:', error);
    return { error: 'Network error' };
  }
}

// Auth endpoints
export async function exchangeOAuthCode(code: string): Promise<ApiResponse<{ token: string; user: any }>> {
  return request(`/auth/callback?code=${code}`);
}

// Decklists endpoints
export async function getDecklists(params?: { eventId?: string; userId?: string; limit?: number }) {
  const query = new URLSearchParams(params as any).toString();
  return request(`/decklists${query ? `?${query}` : ''}`);
}

export async function getDecklist(id: string) {
  return request(`/decklists/${id}`);
}

export async function createDecklist(data: {
  moxfieldUrl: string;
  eventId?: string;
  rank?: number;
  winLoss?: string;
}) {
  return request('/decklists', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateDecklist(id: string, data: {
  moxfieldUrl?: string;
  eventId?: string;
  rank?: number;
  winLoss?: string;
}) {
  return request(`/decklists/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteDecklist(id: string) {
  return request(`/decklists/${id}`, {
    method: 'DELETE',
  });
}

// Events endpoints
export async function getEvents(params?: { date?: string; limit?: number }) {
  const query = new URLSearchParams(params as any).toString();
  return request(`/events${query ? `?${query}` : ''}`);
}

export async function getEvent(id: string) {
  return request(`/events/${id}`);
}

export async function createEvent(data: {
  name: string;
  date: string;
  location?: string;
  format?: string;
  organizer?: string;
  description?: string;
}) {
  return request('/events', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEvent(id: string, data: {
  name?: string;
  date?: string;
  location?: string;
  format?: string;
  organizer?: string;
  description?: string;
}) {
  return request(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteEvent(id: string) {
  return request(`/events/${id}`, {
    method: 'DELETE',
  });
}
