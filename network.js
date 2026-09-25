// network.js：消息投递（按序号水位应用，乱序的暂缓计数、不静默应用也不丢弃）
export function deliver(messages, states) {
  let watermark = -Infinity;
  let applied = 0;
  let deferred = 0;
  const order = [];
  const pending = [];
  for (const message of messages || []) {
    if (!message) continue;
    const seq = typeof message.seq === "number" ? message.seq : -Infinity;
    if (seq < watermark) {
      deferred += 1;
      pending.push(message);
      continue;
    }
    if (seq > watermark) watermark = seq;
    if (states && message.kind === "invalidate" &&
        Object.prototype.hasOwnProperty.call(states, message.to)) {
      states[message.to] = "I";
    }
    applied += 1;
    order.push(message.id);
  }
  return { applied: applied, deferred: deferred, order: order, pending: pending };
}
