// protocol.js：目录一致性状态机（读/写/清退，维护 single-writer 不变量）
// 目录对象上缓存共享者/持有者集合，事件处理只动相关副本，不做全量扫描。
const BOOK = Symbol("cachecoherence.book");

function buildBook(states) {
  const book = { states: states, sharers: new Set(), modifiers: new Set() };
  for (const node of Object.keys(states)) {
    if (states[node] === "S") book.sharers.add(node);
    else if (states[node] === "M") book.modifiers.add(node);
  }
  return book;
}

function bookFor(states, directory) {
  const dir = directory && typeof directory === "object" ? directory : {};
  let book = dir[BOOK];
  if (!book || book.states !== states) {
    book = buildBook(states);
    dir[BOOK] = book;
  }
  return book;
}

function knownNode(states, directory, node) {
  if (directory && Array.isArray(directory.nodes)) {
    return directory.nodes.indexOf(node) !== -1;
  }
  const nodes = Object.keys(states);
  return nodes.length === 0 || Object.prototype.hasOwnProperty.call(states, node);
}

export function directoryStats(states, directory) {
  const book = bookFor(states, directory);
  return { writers: book.modifiers.size, sharers: book.sharers.size };
}

export function applyEvent(states, event, directory) {
  const book = bookFor(states, directory);
  if (!knownNode(states, directory, event.node)) {
    const error = new Error("unknown node: " + String(event.node));
    error.code = "E_UNKNOWN_NODE";
    throw error;
  }
  let invalidations = 0;
  let illegal = 0;
  const node = event.node;
  const current = states[node];
  if (event.kind === "read") {
    if (current !== "M") {
      for (const holder of book.modifiers) {
        states[holder] = "I";
        invalidations += 1;
      }
      book.modifiers.clear();
      book.sharers.add(node);
      states[node] = "S";
    }
  } else if (event.kind === "write") {
    for (const sharer of book.sharers) {
      if (sharer === node) continue;
      states[sharer] = "I";
      invalidations += 1;
    }
    book.sharers.clear();
    for (const holder of book.modifiers) {
      if (holder === node) continue;
      states[holder] = "I";
      invalidations += 1;
    }
    book.modifiers.clear();
    book.modifiers.add(node);
    states[node] = "M";
  } else if (event.kind === "evict") {
    if (current === "M") {
      book.modifiers.delete(node);
      invalidations += 1;
    } else if (current === "S") {
      book.sharers.delete(node);
    }
    states[node] = "I";
  } else {
    illegal += 1;
  }
  return { states: states, invalidations: invalidations, illegal: illegal };
}
