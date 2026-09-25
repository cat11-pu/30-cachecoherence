// network.js：消息投递（按序号递增应用；乱序消息暂缓计数，不静默应用也不丢弃）
export function deliver(messages, states) {
  let watermark = null;
  let applied = 0;
  let deferred = 0;
  const order = [];
  for (const message of messages) {
    const seq = typeof message.seq === "number" ? message.seq : 0;
    if (watermark === null || seq > watermark) {
      watermark = seq;
      applied += 1;
      order.push(message.id);
      if (states && message.kind === "invalidate" &&
          Object.prototype.hasOwnProperty.call(states, message.to)) {
        states[message.to] = "I";
      }
    } else {
      deferred += 1;
    }
  }
  return { applied: applied, deferred: deferred, order: order };
}
