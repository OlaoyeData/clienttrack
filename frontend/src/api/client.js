const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const TOKEN_KEY = "clienttrack_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  if (res.status === 401 && auth) {
    onUnauthorized();
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    const detail =
      (data && (typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail))) ||
      "Something went wrong. Please try again.";
    const error = new Error(detail);
    error.status = res.status;
    throw error;
  }

  return data;
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload, auth: false }),

  listProjects: () => request("/projects"),
  getProject: (id) => request(`/projects/${id}`),
  createProject: (payload) => request("/projects", { method: "POST", body: payload }),
  updateProjectStatus: (id, status) =>
    request(`/projects/${id}/status`, { method: "PATCH", body: { status } }),
  updateTaskStatus: (projectId, taskId, status) =>
    request(`/projects/${projectId}/tasks/${taskId}`, { method: "PATCH", body: { status } }),
  addTask: (projectId, payload) =>
    request(`/projects/${projectId}/tasks`, { method: "POST", body: payload }),
  rotateShareLink: (id) => request(`/projects/${id}/rotate-share-link`, { method: "POST" }),
  toggleShare: (id, enabled) =>
    request(`/projects/${id}/share-enabled?enabled=${enabled}`, { method: "PATCH" }),
  deleteProject: (id) => request(`/projects/${id}`, { method: "DELETE" }),
  getMe: () => request("/auth/me"),
  updateTaskStatus: (projectId, taskId, status, evidenceUrl) =>
    request(`/projects/${projectId}/tasks/${taskId}`, {
      method: "PATCH",
      body: { status, evidence_url: evidenceUrl },
    }),

  getPublicProject: (shareToken) =>
    request(`/track/${shareToken}`, { auth: false }),
};
