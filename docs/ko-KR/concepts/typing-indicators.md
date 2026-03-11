---
summary: "OpenClaw 가 typing indicator 를 보여 주는 시점과 조정 방법"
read_when:
  - typing indicator 동작이나 기본값을 변경할 때
title: "Typing Indicators"
---

# Typing indicators

run 이 활성화되어 있는 동안 typing indicator 가 채팅 채널로 전송됩니다.
`agents.defaults.typingMode` 로 **언제** typing 이 시작될지 제어하고, `typingIntervalSeconds`
로 **얼마나 자주** 새로고침할지 제어합니다.

## 기본값

`agents.defaults.typingMode` 가 **unset** 이면, OpenClaw 는 레거시 동작을 유지합니다:

- **Direct chats**: 모델 루프가 시작되면 즉시 typing 시작
- **Group chats with a mention**: 즉시 typing 시작
- **Group chats without a mention**: 메시지 텍스트 스트리밍이 시작될 때만 typing 시작
- **Heartbeat runs**: typing 비활성화

## 모드

`agents.defaults.typingMode` 를 다음 중 하나로 설정합니다:

- `never` — 절대 typing indicator 를 보내지 않음
- `instant` — run 이 나중에 silent reply token 만 반환하더라도 **모델 루프가 시작되자마자** typing 시작
- `thinking` — **첫 reasoning delta** 에서 typing 시작(run 에서 `reasoningLevel: "stream"` 필요)
- `message` — **첫 non-silent text delta** 에서 typing 시작(`NO_REPLY` silent token 무시)

"얼마나 빨리 발동하는지" 순서:
`never` → `message` → `thinking` → `instant`

## 설정

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

세션별로 mode 나 cadence 를 덮어쓸 수도 있습니다:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## 메모

- `message` 모드는 silent-only reply(예: 출력 억제를 위한 `NO_REPLY` 토큰)에는 typing 을 보여 주지 않습니다.
- `thinking` 은 run 이 reasoning 을 스트리밍할 때만 발동합니다(`reasoningLevel: "stream"`). 모델이 reasoning delta 를 내보내지 않으면 typing 도 시작되지 않습니다.
- heartbeat 는 mode 와 상관없이 typing 을 절대 표시하지 않습니다.
- `typingIntervalSeconds` 는 **시작 시점** 이 아니라 **새로고침 주기** 를 제어합니다. 기본값은 6초입니다.
