export type GroupKey = "mortality" | "safety" | "readmission" | "patient_experience" | "process";

export interface Step {
  program: number;
  name: string;
  description: string;
  seconds: number;
  rows: number;
}

export interface TableCheck {
  table: string;
  program: number;
  rows_python: number;
  rows_sas: number;
  columns_compared: number;
  max_abs_diff: number;
  mismatched_cells: number;
  passed: boolean;
}

export type StarCounts = Record<"1" | "2" | "3" | "4" | "5", number>;

export interface RunSummary {
  id: string;
  createdAt: string;
  source: string;
  label: string;
  isReference: boolean;
  input: { rows: number; columns: number; sha256: string };
  steps: Step[];
  kpis: {
    hospitals: number;
    rated: number;
    notRated: number;
    measuresUsed: number;
    measuresExcluded: number;
    nationalSummaryScore: number;
  };
  excludedMeasures: { code: string; label: string }[];
  stars: { overall: StarCounts; byPeerGroup: Record<string, StarCounts> };
  states: StateStats[];
  national: {
    summary: number;
    peer: Record<string, number | null>;
    groups: { key: GroupKey; label: string; value: number }[];
  };
  validation: TableCheck[];
  manifest: { pipelineCommit: string; python: string; packages: Record<string, string> };
}

export interface StateStats {
  state: string;
  hospitals: number;
  rated: number;
  averageStar: number | null;
  shareHigh: number | null;
  counts: StarCounts;
}

export interface AboutInfo {
  version: string;
  pipelineCommit: string;
  environment: string | null;
  supportEmail: string | null;
}

export type ChangeStatus = "up" | "down" | "same" | "newly_rated" | "no_longer_rated" | "added" | "removed" | "unrated";
export type RatingKey = "1" | "2" | "3" | "4" | "5" | "none";

export interface Comparison {
  base: Pick<RunSummary, "id" | "label" | "source" | "createdAt" | "input" | "kpis" | "national">;
  target: Pick<RunSummary, "id" | "label" | "source" | "createdAt" | "input" | "kpis" | "national">;
  sameInput: boolean;
  counts: Record<ChangeStatus, number>;
  matrix: Record<RatingKey, Record<RatingKey, number>>;
  distribution: { base: StarCounts; target: StarCounts };
  changes: {
    id: string;
    state: string;
    status: ChangeStatus;
    before: number | null;
    after: number | null;
    summaryBefore: number | null;
    summaryAfter: number | null;
    delta: number | null;
  }[];
}

export interface HospitalRow {
  id: string;
  state: string;
  star: number | null;
  summary: number | null;
  peer: number | null;
  eligible: number;
  groups: number;
  mortality: number | null;
  safety: number | null;
  readmission: number | null;
  patient_experience: number | null;
  process: number | null;
}

export interface HospitalDetail {
  id: string;
  state: string;
  star: number | null;
  summary: number | null;
  eligible: boolean;
  groupsWithThree: number;
  mortSafeGroups: number;
  peer: number | null;
  nationalSummary: number;
  peerSummary: number | null;
  groups: {
    key: GroupKey;
    label: string;
    score: number | null;
    weight: number | null;
    contribution: number | null;
    measureCount: number;
    national: number;
    measures: { code: string; label: string; included: boolean; value: number | null }[];
  }[];
}

export const GROUP_LABELS: Record<GroupKey, string> = {
  mortality: "Mortality",
  safety: "Safety of Care",
  readmission: "Readmission",
  patient_experience: "Patient Experience",
  process: "Timely & Effective Care",
};

export const GROUP_WEIGHTS: Record<GroupKey, number> = {
  mortality: 0.22,
  safety: 0.22,
  readmission: 0.22,
  patient_experience: 0.22,
  process: 0.12,
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.detail) message = String(body.detail);
    } catch {
      /* keep the status text */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  latest: () => request<RunSummary>("/api/runs/latest"),
  about: () => request<AboutInfo>("/api/about"),
  runs: () => request<RunSummary[]>("/api/runs"),
  run: (id: string) => request<RunSummary>(`/api/runs/${id}`),
  hospitals: (id: string) => request<HospitalRow[]>(`/api/runs/${id}/hospitals`),
  hospital: (id: string, ccn: string) => request<HospitalDetail>(`/api/runs/${id}/hospitals/${ccn}`),
  start: (file?: File, label = "") => {
    const body = new FormData();
    if (file) body.append("file", file);
    if (label) body.append("label", label);
    return request<RunSummary>("/api/runs", { method: "POST", body });
  },
  rename: (id: string, label: string) =>
    request<RunSummary>(`/api/runs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    }),
  remove: async (id: string) => {
    const res = await fetch(`/api/runs/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Could not delete the run (${res.status})`);
  },
  compare: (base: string, target: string) =>
    request<Comparison>(`/api/compare?base=${encodeURIComponent(base)}&target=${encodeURIComponent(target)}`),
  zipUrl: (id: string) => `/api/runs/${id}/export.zip`,
  csvUrl: (id: string, table: string) => `/api/runs/${id}/export/${table}.csv`,
};

export const fmt = {
  score: (v: number | null | undefined, digits = 3) => {
    if (v === null || v === undefined) return "–";
    const text = Math.abs(v).toFixed(digits);
    if (Number(text) === 0) return text; // no sign on values that round to zero
    return (v > 0 ? "+" : "−") + text;
  },
  int: (v: number) => v.toLocaleString("en-US"),
  pct: (v: number, digits = 0) => `${(v * 100).toFixed(digits)}%`,
  diff: (v: number) => (v === 0 ? "0" : v.toExponential(1)),
  ms: (s: number) => (s < 1 ? `${Math.max(1, Math.round(s * 1000))} ms` : `${s.toFixed(2)} s`),
};
