// app.js：渲染结果
import { applyEvent, syncDirectory, singleWriterHolds } from "./protocol.js";
import { deliver } from "./network.js";

export function render(spec) {
  let states = {};
  for (const node of spec.nodes) states[node] = spec.home_state || "S";
  const directory = Object.assign({}, spec.directory);
  syncDirectory(states, directory);
  const transitions = [];
  let invalidations = 0;
  let singleWriter = singleWriterHolds(directory);
  for (const event of spec.events || []) {
    const result = applyEvent(states, event, directory);
    states = result.states;
    invalidations += result.invalidations;
    if (!singleWriterHolds(directory)) singleWriter = false;
    transitions.push(Object.assign({}, states));
  }
  const sent = deliver(spec.messages || [], states);
  return { transitions: transitions, invalidations: invalidations,
           applied: sent.applied, deferred: sent.deferred,
           single_writer: singleWriter, states: states };
}
