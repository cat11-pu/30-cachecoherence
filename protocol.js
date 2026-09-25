// protocol.js：MSI 状态机（目录记录持有者，事件只触碰相关副本，不做全量扫描）
export const E_UNKNOWN_NODE = "E_UNKNOWN_NODE";

const DIR_KEY = "__msiDirectory";

// 把目录与当前 states 对齐；之后由 applyEvent 增量维护，保证单事件常量时间
export function syncDirectory(states, directory) {
  const dir = directory && typeof directory === "object" ? directory : {};
  if (!dir[DIR_KEY]) {
    const coh = { owner: null, sharers: new Set(), multiWriter: false };
    let writers = 0;
    for (const node of Object.keys(states)) {
      if (states[node] === "M") { writers += 1; coh.owner = node; }
      else if (states[node] === "S") { coh.sharers.add(node); }
    }
    coh.multiWriter = writers > 1;
    dir[DIR_KEY] = coh;
  }
  return dir[DIR_KEY];
}

export function singleWriterHolds(directory) {
  const coh = directory && directory[DIR_KEY];
  return !coh || !coh.multiWriter;
}

export function applyEvent(states, event, directory) {
  const coh = syncDirectory(states, directory);
  const next = Object.assign({}, states);
  const node = event ? event.node : undefined;
  if (!Object.prototype.hasOwnProperty.call(states, node)) {
    return { states: next, invalidations: 0, illegal: 1, error: E_UNKNOWN_NODE };
  }
  let invalidations = 0;
  if (event.kind === "read") {
    if (next[node] !== "M") {
      next[node] = "S";
      coh.sharers.add(node);
      if (coh.owner !== null && coh.owner !== node) {
        next[coh.owner] = "I";
        coh.owner = null;
        invalidations += 1;
      }
    }
  } else if (event.kind === "write") {
    for (const sharer of coh.sharers) {
      if (sharer !== node) {
        next[sharer] = "I";
        invalidations += 1;
      }
    }
    coh.sharers.clear();
    if (coh.owner !== null && coh.owner !== node) {
      next[coh.owner] = "I";
      invalidations += 1;
    }
    coh.owner = node;
    next[node] = "M";
  } else {
    if (next[node] === "M") invalidations += 1;
    if (coh.owner === node) coh.owner = null;
    coh.sharers.delete(node);
    next[node] = "I";
  }
  return { states: next, invalidations: invalidations, illegal: 0 };
}
