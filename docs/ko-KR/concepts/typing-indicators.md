---
summary: "When OpenClaw shows typing indicators and how to tune them"
description: "OpenClaw가 typing indicator를 언제 시작하고 얼마나 자주 갱신하는지, session별로 어떻게 조정하는지 설명합니다."
read_when:
  - typing indicator 동작이나 기본값을 바꿔야 할 때
title: "Typing Indicators"
x-i18n:
  source_path: "concepts/typing-indicators.md"
---

# Typing indicators

typing indicator는 run이 active한 동안 chat channel로 전송됩니다.
`agents.defaults.typingMode`는 typing이 **언제** 시작되는지 제어하고,
`typingIntervalSeconds`는 **얼마나 자주** refresh할지를 제어합니다.

## Defaults

`agents.defaults.typingMode`가 **unset**이면 OpenClaw는 legacy behavior를 유지합니다.

- **Direct chat:** model loop가 시작되면 즉시 typing 시작
- **Mention이 있는 group chat:** 즉시 typing 시작
- **Mention이 없는 group chat:** message text streaming이 시작될 때 typing 시작
- **Heartbeat run:** typing 비활성화

## Modes

`agents.defaults.typingMode`는 다음 중 하나로 설정합니다.

- `never`: typing indicator를 전혀 보내지 않음
- `instant`: **model loop가 시작되는 즉시** typing 시작.
  나중에 silent reply token만 반환하더라도 시작함
- `thinking`: **첫 reasoning delta**에서 typing 시작
  (해당 run에 `reasoningLevel: "stream"` 필요)
- `message`: **첫 non-silent text delta**에서 typing 시작
  (`NO_REPLY` silent token은 무시)

"얼마나 빨리 켜지는가" 기준 순서:
`never` → `message` → `thinking` → `instant`

## Configuration

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

session별로 mode나 cadence를 override할 수도 있습니다.

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Notes

- `message` mode는 silent-only reply
  (예: 출력 억제용 `NO_REPLY` token)에서는 typing을 표시하지 않습니다
- `thinking`은 run이 reasoning을 streaming할 때만 동작합니다
  (`reasoningLevel: "stream"` 필요). 모델이 reasoning delta를 내지 않으면 typing도
  시작되지 않습니다
- heartbeat는 mode와 관계없이 typing을 표시하지 않습니다
- `typingIntervalSeconds`는 **refresh cadence**를 제어하는 값이며,
  시작 시점을 바꾸는 값이 아닙니다. 기본값은 6초입니다
