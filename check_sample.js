import fs from "node:fs";
import { applyEvent } from "./protocol.js";
import { deliver } from "./network.js";
import { render } from "./app.js";

const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/coherence.json", "utf8"));
let states = {};
for (const node of spec.nodes) states[node] = spec.home_state || "S";
const transitions = [];
let invalidations = 0;
for (const event of spec.events) {
  const result = applyEvent(states, event, spec.directory || {});
  states = result.states;
  invalidations += result.invalidations;
  transitions.push(Object.assign({}, states));
}
const sent = deliver(spec.messages || [], states);
const out = render(spec);

console.log("每次事件后的状态 =", JSON.stringify(transitions));
console.log("失效消息数 =", invalidations);
console.log("直接应用的消息数 =", sent.applied);
console.log("因乱序暂缓的消息数 =", sent.deferred);
console.log("是否至多一个写入者 =", out.single_writer);
console.log("最终状态 =", JSON.stringify(states));
console.log("未知节点的错误码 =", spec.unknown_code);
