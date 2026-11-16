import seed from "../data/seedProfiles.json";
import { API_URL } from "../config";
import { matchesQuery } from "../utils/helpers";

/**
 * REST client for the Express + MongoDB API  (resource: /profiles)
 *
 *   Create → POST   /profiles
 *   Read   → GET    /profiles
 *   Search → GET    /profiles/search/:name
 *   Update → PUT    /profiles/:id
 *   Delete → DELETE /profiles/:id
 */
const ENDPOINT = `${API_URL}/profiles`;

async function request(url, options) {
  let response;
  try {
    response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    // fetch() only rejects when the server cannot be reached at all
    throw new Error(`Cannot reach the API at ${API_URL}. Start it with "npm run server".`);
  }

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    // The Express API answers errors as { message: "..." }
    throw new Error(body?.message ?? `Request failed (${response.status} ${response.statusText})`);
  }
  return body;
}

/* ------------------------------------------------------------------
   Offline preview build only (VITE_STORAGE=local): same API shape,
   but records live in the browser's localStorage.
------------------------------------------------------------------- */
const LS_KEY = "dinemate-profiles";
const readLocal = () => {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    /* storage blocked – fall through to the seed */
  }
  return structuredClone(seed);
};
const writeLocal = (rows) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(rows));
  } catch {
    /* ignore */
  }
  return rows;
};
const newestFirst = (rows) => rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

const localApi = {
  getAll: async () => newestFirst(readLocal()),
  search: async (name) => newestFirst(readLocal().filter((p) => matchesQuery(p, name))),
  create: async (data) => {
    const rows = readLocal();
    const now = new Date().toISOString();
    const created = { ...data, id: Math.max(0, ...rows.map((r) => r.id)) + 1, createdAt: now, updatedAt: now };
    writeLocal([...rows, created]);
    return created;
  },
  update: async (id, data) => {
    const rows = readLocal();
    const updated = { ...rows.find((r) => r.id === id), ...data, id, updatedAt: new Date().toISOString() };
    writeLocal(rows.map((r) => (r.id === id ? updated : r)));
    return updated;
  },
  remove: async (id) => {
    writeLocal(readLocal().filter((r) => r.id !== id));
  },
};

const restApi = {
  /** READ – newest first */
  getAll: () => request(ENDPOINT),

  /** SEARCH – handled by MongoDB on the server (case-insensitive) */
  search: (name) => request(`${ENDPOINT}/search/${encodeURIComponent(name)}`),

  /** CREATE */
  create: (data) => request(ENDPOINT, { method: "POST", body: JSON.stringify(data) }),

  /** UPDATE */
  update: (id, data) => request(`${ENDPOINT}/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  /** DELETE */
  remove: (id) => request(`${ENDPOINT}/${id}`, { method: "DELETE" }),
};

export const IS_LOCAL_PREVIEW = import.meta.env.VITE_STORAGE === "local";
export const profileApi = IS_LOCAL_PREVIEW ? localApi : restApi;
