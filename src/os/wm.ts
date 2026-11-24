// Window manager reducer for JovanyOS. Pure and unit-tested.

export type WinKind = "finder" | "terminal" | "experience" | "contact" | "project";

export type Win = {
  id: string; // "finder", "terminal", "project:<repo>", ...
  kind: WinKind;
  repo?: string;
  note?: string;
  z: number;
  minimized: boolean;
  x: number;
  y: number;
};

export type WmState = { wins: Win[]; zTop: number; spawned: number };

export type WmAction =
  | { type: "open"; kind: WinKind; repo?: string; note?: string; at?: { x: number; y: number } }
  | { type: "focus"; id: string }
  | { type: "close"; id: string }
  | { type: "minimize"; id: string };

export const MAX_WINDOWS = 5;

export const initialWm: WmState = { wins: [], zTop: 0, spawned: 0 };

export const winId = (kind: WinKind, repo?: string) => (kind === "project" ? `project:${repo}` : kind);

export function wmReducer(state: WmState, action: WmAction): WmState {
  switch (action.type) {
    case "open": {
      const id = winId(action.kind, action.repo);
      const z = state.zTop + 1;
      const existing = state.wins.find((w) => w.id === id);
      if (existing) {
        return {
          ...state,
          zTop: z,
          wins: state.wins.map((w) =>
            w.id === id ? { ...w, z, minimized: false, note: action.note ?? w.note } : w,
          ),
        };
      }
      let wins = state.wins;
      if (wins.length >= MAX_WINDOWS) {
        // close the window that has been unfocused the longest
        const oldest = wins.reduce((a, b) => (a.z <= b.z ? a : b));
        wins = wins.filter((w) => w.id !== oldest.id);
      }
      const n = state.spawned % 6;
      const win: Win = {
        id,
        kind: action.kind,
        repo: action.repo,
        note: action.note,
        z,
        minimized: false,
        x: action.at?.x ?? 120 + n * 40,
        y: action.at?.y ?? 48 + n * 32,
      };
      return { wins: [...wins, win], zTop: z, spawned: state.spawned + 1 };
    }
    case "focus": {
      const target = state.wins.find((w) => w.id === action.id);
      if (!target) return state;
      if (target.z === state.zTop && !target.minimized) return state;
      const z = state.zTop + 1;
      return { ...state, zTop: z, wins: state.wins.map((w) => (w.id === action.id ? { ...w, z, minimized: false } : w)) };
    }
    case "close":
      return { ...state, wins: state.wins.filter((w) => w.id !== action.id) };
    case "minimize":
      return { ...state, wins: state.wins.map((w) => (w.id === action.id ? { ...w, minimized: true } : w)) };
    default:
      return state;
  }
}

/** The focused window is the visible one with the highest z. */
export function focusedId(state: WmState): string | null {
  const visible = state.wins.filter((w) => !w.minimized);
  if (!visible.length) return null;
  return visible.reduce((a, b) => (a.z >= b.z ? a : b)).id;
}
