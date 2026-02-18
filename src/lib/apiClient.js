const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 204) {
    return null;
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.error || `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export const apiClient = {
  auth: {
    getSession: () => request('/auth/session'),
    signInAnonymously: (appId) => request('/auth/anonymous', {
      method: 'POST',
      body: JSON.stringify({ appId }),
    }),
    logout: () => request('/auth/logout', { method: 'POST' }),
  },
  getBootstrap: () => request('/api/bootstrap'),
  upsertUserProfile: (name) => request('/api/user-profile', {
    method: 'PUT',
    body: JSON.stringify({ name }),
  }),
  createRecord: (tableName, payload) => request(`/api/${tableName}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateRecord: (tableName, id, updates) => request(`/api/${tableName}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ updates }),
  }),
  deleteRecord: (tableName, id) => request(`/api/${tableName}/${id}`, {
    method: 'DELETE',
  }),
  sendShiftNotification: (payload) => request('/api/notifications/shift-approved', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
};
