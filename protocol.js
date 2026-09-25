// protocol.js：状态机（基线：本地直接改状态）
export function applyEvent(states, event, directory) {
  const next = Object.assign({}, states);
  if (event.kind === "write") next[event.node] = "M";
  else if (event.kind === "read") next[event.node] = "S";
  else next[event.node] = "I";
  return { states: next, invalidations: 0, illegal: 0 };
}
