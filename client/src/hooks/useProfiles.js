import { useCallback, useEffect, useMemo, useState } from "react";
import { profileApi } from "../services/profileApi";
import { matchesQuery } from "../utils/helpers";

/**
 * State + CRUD actions for the dining-profile records stored in MongoDB.
 * Every action calls the Express API, then updates local state so the UI
 * re-renders immediately.
 */
export function useProfiles() {
  const [profiles, setProfiles] = useState([]); // every record
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState(null); // server search result (null = no active search)
  const [searching, setSearching] = useState(false);

  /* READ */
  const load = useCallback(async () => {
    setStatus("loading");
    try {
      setProfiles(await profileApi.getAll());
      setError("");
      setStatus("ready");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* SEARCH – debounced request to GET /profiles/search/:name */
  useEffect(() => {
    const text = query.trim();
    if (!text) {
      setMatches(null);
      setSearching(false);
      return;
    }

    let cancelled = false; // ignore out-of-order responses
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const found = await profileApi.search(text);
        if (!cancelled) setMatches(found);
      } catch {
        // API hiccup: fall back to filtering the records we already have
        if (!cancelled) setMatches(profiles.filter((p) => matchesQuery(p, text)));
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // `profiles` is a dependency so results refresh after create / update / delete
  }, [query, profiles]);

  /** What the list should show right now */
  const visibleProfiles = useMemo(() => matches ?? profiles, [matches, profiles]);

  /* CREATE */
  const createProfile = async (data) => {
    const created = await profileApi.create(data);
    setProfiles((prev) => [created, ...prev]);
    return created;
  };

  /* UPDATE */
  const updateProfile = async (id, data) => {
    const updated = await profileApi.update(id, data);
    setProfiles((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  /* DELETE */
  const deleteProfile = async (id) => {
    await profileApi.remove(id);
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  return {
    profiles,
    visibleProfiles,
    query,
    setQuery,
    searching,
    status,
    error,
    reload: load,
    createProfile,
    updateProfile,
    deleteProfile,
  };
}
