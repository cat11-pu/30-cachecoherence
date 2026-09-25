# cachecoherence

浏览器单页工作台（原生 ES 模块，零依赖）。

## 起服务看页面

    python3 -m http.server 8000

浏览器打开 http://127.0.0.1:8000/ ，改样例点运行看结果。

## 测试

    node tests/run.js

## 场景自检

    node check_sample.js

## 协议语义

- 读：本节点非 M 则转 S，其他持 M 的副本失效（每次失效计一次）。
- 写：其他 S/M 副本全部失效，本节点转 M；任一时刻至多一个 M（single_writer）。
- 清退（evict）：本节点转 I，原为 M 时记一次失效。
- 消息按序号递增应用，序号不高于已应用水位的暂缓（deferred），不静默应用也不丢弃。
- 事件节点不在节点列表里时抛出错误码 E_UNKNOWN_NODE。
