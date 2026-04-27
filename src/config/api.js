const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN || "").replace(/\/$/, "");

export const API_BASE_URL = API_ORIGIN ? `${API_ORIGIN}/api` : "/api";
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";
