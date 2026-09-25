import assert from "node:assert";
import { applyEvent } from "../protocol.js";
import { deliver } from "../network.js";
import { render } from "../app.js";

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

check("applyEvent returns states", () => {
  assert.strictEqual(typeof applyEvent({}, { kind: "read", node: "n0" }, {}).states, "object");
});

check("applyEvent counts invalidations", () => {
  assert.strictEqual(typeof applyEvent({}, { kind: "read", node: "n0" }, {}).invalidations, "number");
});

check("deliver counts deferred", () => {
  assert.strictEqual(typeof deliver([], {}).deferred, "number");
});

check("deliver reports applied", () => {
  assert.strictEqual(typeof deliver([], {}).applied, "number");
});

check("render exposes single_writer flag", () => {
  assert.strictEqual(typeof render({ nodes: ["n0"], events: [], messages: [] }).single_writer, "boolean");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
