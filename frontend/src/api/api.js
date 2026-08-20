const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const apiRequest = async (endpoint, options = {}) => {
  let token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let body = options.body;
  if (body && typeof body === "object" && !(body instanceof FormData)) {
    body = JSON.stringify(body);
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    body,
    credentials: "include", // ✅ For cookies
  });

  if (response.status === 401) {
    const refreshSuccess = await refreshAccessToken();
    if (refreshSuccess) {
      token = localStorage.getItem("token");
      headers.Authorization = `Bearer ${token}`;
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        body,
        credentials: "include",
      });
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
      throw new Error("Session expired. Please log in again.");
    }
  }

  let data;
  try { data = await response.json(); } catch { data = null; }
  if (!response.ok) throw new Error(data?.message || `Request failed with status ${response.status}`);
  return data;
};

async function refreshAccessToken() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) return false;
    const data = await response.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
      return true;
    }
    return false;
  } catch { return false; }
}

export default API_BASE_URL;
