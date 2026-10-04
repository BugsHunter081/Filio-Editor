const TOKEN_KEY = "folio_token";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(apiUrl(path), { ...options, headers });
  if (!res.ok) {
    let detail = "Request failed";
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {
      detail = await res.text();
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  if (res.status === 204) return null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res;
}

export const api = {
  health: () => request("/api/health"),
  tools: () => request("/api/tools"),
  register: (body) => request("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => request("/api/auth/me"),
  updateMe: (body) => request("/api/auth/me", { method: "PATCH", body: JSON.stringify(body) }),
  upload: async (files) => {
    const fd = new FormData();
    [...files].forEach((f) => fd.append("files", f));
    return request("/api/files/upload", { method: "POST", body: fd });
  },
  preview: (id) => request(`/api/files/${id}/preview`),
  createJob: (body) => request("/api/jobs", { method: "POST", body: JSON.stringify(body) }),
  job: (id) => request(`/api/jobs/${id}`),
  jobs: () => request("/api/jobs"),
  usage: () => request("/api/jobs/stats/usage"),
  guides: () => request("/api/guides"),
  guide: (id) => request(`/api/guides/${id}`),
  admin: () => request("/api/admin/overview"),
  adminUsers: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) q.set(k, v);
    });
    const suffix = q.toString() ? `?${q}` : "";
    return request(`/api/admin/users${suffix}`);
  },
  adminCreateUser: (body) => request("/api/admin/users", { method: "POST", body: JSON.stringify(body) }),
  adminUpdateUser: (id, body) => request(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  adminResetPassword: (id, password) =>
    request(`/api/admin/users/${id}/reset-password`, { method: "POST", body: JSON.stringify({ password }) }),
  adminSetSubscription: (id, body) =>
    request(`/api/admin/users/${id}/subscription`, { method: "POST", body: JSON.stringify(body) }),
  adminPlans: () => request("/api/admin/plans"),
};

export function downloadUrl(fileId) {
  return apiUrl(`/api/files/${fileId}/download`);
}

export function previewPageUrl(fileId, name) {
  return apiUrl(`/api/files/${fileId}/preview/${name}`);
}
