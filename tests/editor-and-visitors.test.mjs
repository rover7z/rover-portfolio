import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function compile(source) {
  return ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
}

// Run the actual save handlers with a delayed database response.
function editorHarness() {
  const source = readFileSync(new URL("../app/admin/personal-editor.tsx", import.meta.url), "utf8");
  const file = ts.createSourceFile("editor.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const functions = [];
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && ["saveSettings", "updateSettings", "discardSettings"].includes(node.name?.text)) functions.push(node.getText(file));
    ts.forEachChild(node, visit);
  }
  visit(file);
  let resolve, reject;
  const response = new Promise((ok, fail) => { resolve = ok; reject = fail; });
  const state = {
    settings: { hero: { name: "Before" } }, savedSettings: { hero: { name: "Initial" } },
    settingsRevisionRef: { current: 0 }, busy: false, dirty: true, message: "",
    t: { saved: "Saved", unsaved: "Unsaved changes" }, lang: "en", refreshes: 0, writes: [],
    structuredClone, Error,
  };
  for (const [setter, property] of [["setSettings", "settings"], ["setSavedSettings", "savedSettings"], ["setBusy", "busy"], ["setDirty", "dirty"], ["setMessage", "message"]]) state[setter] = (value) => { state[property] = value; };
  state.router = { refresh: () => { state.refreshes++; } };
  state.supabase = { from: () => ({ upsert: (payload) => { state.writes.push(payload); return response; } }) };
  vm.createContext(state);
  vm.runInContext(compile(functions.join("\n")), state);
  return { state, resolve, reject };
}

test("edits made during saving remain dirty and discard restores only the saved snapshot", async () => {
  const { state, resolve } = editorHarness();
  const saving = state.saveSettings();
  state.updateSettings({ hero: { name: "After" } });
  state.discardSettings();
  assert.equal(state.settings.hero.name, "After");
  resolve({ error: null });
  await saving;
  assert.equal(state.writes[0].value.hero.name, "Before");
  assert.equal(state.savedSettings.hero.name, "Before");
  assert.equal(state.settings.hero.name, "After");
  assert.equal(state.dirty, true);
  assert.equal(state.message, "Unsaved changes");
  assert.equal(state.busy, false);
  state.discardSettings();
  assert.equal(state.settings.hero.name, "Before");
  assert.equal(state.dirty, false);
});

test("successful save clears dirty state when there were no newer edits", async () => {
  const { state, resolve } = editorHarness();
  const saving = state.saveSettings();
  resolve({ error: null });
  await saving;
  assert.equal(state.dirty, false);
  assert.equal(state.message, "Saved");
  assert.equal(state.refreshes, 1);
});

for (const failure of ["returned", "rejected"]) {
  test(`a ${failure} save failure releases the busy state and preserves changes`, async () => {
    const { state, resolve, reject } = editorHarness();
    const saving = state.saveSettings();
    if (failure === "returned") resolve({ error: { message: "Database unavailable" } });
    else reject(new Error("Database unavailable"));
    await saving;
    assert.equal(state.busy, false);
    assert.equal(state.dirty, true);
    assert.equal(state.message, "Database unavailable");
    assert.equal(state.savedSettings.hero.name, "Initial");
    assert.equal(state.refreshes, 0);
  });
}

function storage(mode) {
  const values = new Map();
  return {
    getItem(key) { if (mode === "read-blocked") throw new Error("SecurityError"); return values.get(key) ?? null; },
    setItem(key, value) { if (mode === "write-blocked") throw new Error("QuotaExceededError"); values.set(key, value); },
  };
}

function trackerHarness(mode, pathname = "/") {
  const requests = [];
  const exports = {};
  let effect;
  const state = {
    exports, crypto: { randomUUID: (() => { let n = 0; return () => `visitor-id-${++n}`; })() },
    localStorage: storage(mode), sessionStorage: storage(mode),
    location: { pathname, search: "" }, document: { referrer: "" },
    navigator: { userAgent: "test", language: "ar" }, window: { screen: { width: 360, height: 800 } },
    fetch: (url, options) => { requests.push({ url, body: JSON.parse(options.body) }); return Promise.resolve({ ok: true }); },
    require(name) {
      if (name === "react") return { useEffect: (callback) => { effect = callback; } };
      if (name === "next/navigation") return { usePathname: () => pathname };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  };
  vm.createContext(state);
  vm.runInContext(compile(readFileSync(new URL("../components/visitor-tracker.tsx", import.meta.url), "utf8")), state);
  exports.VisitorTracker();
  return { requests, run: () => effect() };
}

for (const mode of ["available", "read-blocked", "write-blocked"]) {
  test(`visitor tracking keeps stable IDs with ${mode} browser storage`, () => {
    const { requests, run } = trackerHarness(mode);
    assert.doesNotThrow(run);
    assert.doesNotThrow(run);
    assert.equal(requests.length, 2);
    assert.equal(requests[0].body.visitorId, requests[1].body.visitorId);
    assert.equal(requests[0].body.sessionId, requests[1].body.sessionId);
    assert.notEqual(requests[0].body.visitorId, requests[0].body.sessionId);
    assert.equal(requests[0].body.language, "ar");
  });
}

test("admin pages are excluded from visitor tracking", () => {
  const { requests, run } = trackerHarness("read-blocked", "/admin");
  run();
  assert.equal(requests.length, 0);
});
