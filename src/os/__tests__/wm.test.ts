import { describe, expect, it } from "vitest";
import { focusedId, initialWm, MAX_WINDOWS, wmReducer, type WmAction, type WmState } from "../wm";

const apply = (actions: WmAction[], s: WmState = initialWm) => actions.reduce(wmReducer, s);

describe("window manager", () => {
  it("opens windows on top and focuses the newest", () => {
    const s = apply([{ type: "open", kind: "finder" }, { type: "open", kind: "terminal" }]);
    expect(s.wins.map((w) => w.id)).toEqual(["finder", "terminal"]);
    expect(focusedId(s)).toBe("terminal");
  });

  it("focus brings a window to the front (z-order)", () => {
    const s = apply([{ type: "open", kind: "finder" }, { type: "open", kind: "terminal" }, { type: "focus", id: "finder" }]);
    const finder = s.wins.find((w) => w.id === "finder")!;
    const term = s.wins.find((w) => w.id === "terminal")!;
    expect(finder.z).toBeGreaterThan(term.z);
    expect(focusedId(s)).toBe("finder");
  });

  it("re-opening an existing window focuses it instead of duplicating", () => {
    const s = apply([
      { type: "open", kind: "project", repo: "smartticket" },
      { type: "open", kind: "terminal" },
      { type: "minimize", id: "project:smartticket" },
      { type: "open", kind: "project", repo: "smartticket" },
    ]);
    expect(s.wins.filter((w) => w.id === "project:smartticket")).toHaveLength(1);
    expect(s.wins.find((w) => w.id === "project:smartticket")!.minimized).toBe(false);
    expect(focusedId(s)).toBe("project:smartticket");
  });

  it("close removes the window and focus falls to the next highest z", () => {
    const s = apply([{ type: "open", kind: "finder" }, { type: "open", kind: "terminal" }, { type: "close", id: "terminal" }]);
    expect(s.wins.map((w) => w.id)).toEqual(["finder"]);
    expect(focusedId(s)).toBe("finder");
  });

  it("minimized windows are not focused", () => {
    const s = apply([{ type: "open", kind: "finder" }, { type: "open", kind: "terminal" }, { type: "minimize", id: "terminal" }]);
    expect(focusedId(s)).toBe("finder");
  });

  it(`keeps at most ${MAX_WINDOWS} windows, dropping the least recently focused`, () => {
    const repos = ["a", "b", "c", "d", "e", "f"];
    let s = apply(repos.slice(0, 5).map((r) => ({ type: "open", kind: "project", repo: r }) as WmAction));
    s = wmReducer(s, { type: "focus", id: "project:a" }); // a is now most recent, b is oldest
    s = wmReducer(s, { type: "open", kind: "project", repo: "f" });
    expect(s.wins).toHaveLength(MAX_WINDOWS);
    expect(s.wins.map((w) => w.id)).not.toContain("project:b");
    expect(s.wins.map((w) => w.id)).toContain("project:a");
  });
});
