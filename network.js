// network.js：消息投递（基线：按到达顺序直接应用、不缓冲）
export function deliver(messages, states) {
  return { applied: messages.length, deferred: 0, order: messages.map((message) => message.id) };
}
