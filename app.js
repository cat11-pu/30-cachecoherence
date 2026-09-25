// app.js：渲染结果
import { applyEvent, directoryStats } from "./protocol.js";
import { deliver } from "./network.js";

export function render(spec) {
  let states = {};
  for (const node of spec.nodes) states[node] = spec.home_state || "S";
  const directory = spec.directory || {};
  const transitions = [];
  let invalidations = 0;
  let single_writer = directoryStats(states, directory).writers <= 1;
  for (const event of spec.events) {
    const result = applyEvent(states, event, directory);
    states = result.states;
    invalidations += result.invalidations;
    single_writer = single_writer && directoryStats(states, directory).writers <= 1;
    transitions.push(Object.assign({}, states));
  }
  const sent = deliver(spec.messages || [], states);
  return { transitions: transitions, invalidations: invalidations,
           applied: sent.applied, deferred: sent.deferred,
           single_writer: single_writer, states: states };
}
