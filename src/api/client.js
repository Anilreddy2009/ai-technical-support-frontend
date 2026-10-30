const BASE = import.meta.env.VITE_API_URL ?? '';

let token = localStorage.getItem('token');

export function setToken(value) {
  token = value;
  if (value) localStorage.setItem('token', value);
  else localStorage.removeItem('token');
}

/** Error carrying the backend's { code, message } so screens can react to specific conflicts. */
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: {
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Cannot reach the server. Check that the backend is running.');
  }

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON error body */
  }

  if (!res.ok) {
    if (res.status === 401 && path !== '/auth/login') {
      setToken(null);
      window.dispatchEvent(new Event('auth:expired'));
    }
    const message = Array.isArray(data?.message) ? data.message.join(' ') : data?.message;
    throw new ApiError(res.status, data?.code, message || res.statusText || 'Request failed');
  }
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body ?? {}),
  patch: (path, body) => request('PATCH', path, body ?? {}),
};
