// app.js：渲染结果
import { applyEvent } from "./protocol.js";
import { deliver } from "./network.js";

export function render(spec) {
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
  return { transitions: transitions, invalidations: invalidations,
           applied: sent.applied, deferred: sent.deferred,
           single_writer: true, states: states };
}
