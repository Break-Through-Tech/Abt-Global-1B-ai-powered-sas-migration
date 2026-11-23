import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, type AboutInfo, type RunSummary } from "./api";

interface RunState {
  about: AboutInfo | null;
  run: RunSummary | null;
  error: string | null;
  setRun: (run: RunSummary) => void;
  reload: () => void;
}

const RunContext = createContext<RunState | null>(null);

export function RunProvider({ children }: { children: ReactNode }) {
  const [run, setRun] = useState<RunSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [about, setAbout] = useState<AboutInfo | null>(null);

  useEffect(() => {
    api.about().then(setAbout).catch(() => setAbout(null));
  }, []);

  const reload = useCallback(() => {
    setError(null);
    api.latest().then(setRun).catch((e: Error) => setError(e.message));
  }, []);

  useEffect(reload, [reload]);

  return <RunContext.Provider value={{ about, run, error, setRun, reload }}>{children}</RunContext.Provider>;
}

export function useRun() {
  const ctx = useContext(RunContext);
  if (!ctx) throw new Error("useRun must be used inside RunProvider");
  return ctx;
}

/** Minimal hash router: "#/hospitals/010001" -> ["hospitals", "010001"]. */
export function useRoute(): string[] {
  const read = () => window.location.hash.replace(/^#\/?/, "").split(/[?#]/)[0].split("/").filter(Boolean);
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => {
      setRoute(read());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

/** Query string of the hash route: "#/hospitals?state=AL" -> URLSearchParams("state=AL"). */
export const hashQuery = () => new URLSearchParams(window.location.hash.split("?")[1] ?? "");

export const navigate = (path: string) => {
  window.location.hash = path;
};
