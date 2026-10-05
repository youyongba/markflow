# WebSocket 事件订阅

## 概述
本文档说明了用于实现 MarkFlow 实时协作、光标位置共享和状态同步的 WebSocket 通信协议。通过订阅特定事件，前端可以实时响应其他用户的修改。

## 连接说明
- **连接 URL**: `wss://ws.markflow.com/v1/realtime`
- **心跳保活**: 客户端需每 30 秒发送一次 `ping` 消息，服务端回复 `pong`。
- **鉴权机制**: 连接建立后，必须在 3 秒内发送 `auth` 消息进行 Token 验证，否则将被服务端强制断开。

---

## 事件类型 (Event Types)

### 1. 鉴权验证 (auth)
**方向**: 客户端 -> 服务端

```json
{
  "type": "auth",
  "payload": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5..."
  }
}
```

### 2. 协同光标移动 (cursor_move)
**方向**: 双向 (客户端发送，服务端广播给同房间其他客户端)
**用途**: 用于在多端实时展示其他用户的光标位置。

```json
{
  "type": "cursor_move",
  "payload": {
    "userId": "u_456",
    "userName": "Alex Chen",
    "docId": "doc_123",
    "position": { 
      "line": 12, 
      "ch": 5 
    },
    "color": "#3b82f6"
  }
}
```

### 3. 文档内容实时更新 (doc_update)
**方向**: 服务端 -> 客户端
**用途**: 当其他用户修改文档并触发保存/同步时，服务端下发增量 Patch 或全量内容。

```json
{
  "type": "doc_update",
  "payload": {
    "docId": "doc_123",
    "patch": "@@ -10,5 +10,6 @@\n- old text\n+ new text\n",
    "updatedBy": "u_456",
    "timestamp": 1709114400000
  }
}
```

### 4. 系统通知 (system_notify)
**方向**: 服务端 -> 客户端
**用途**: 下发全局的系统通知，如服务重启、版本更新等。

```json
{
  "type": "system_notify",
  "payload": {
    "level": "warning",
    "message": "系统将于今晚 24:00 进行升级，请及时保存文档。"
  }
}
```
