---
summary: "OpenClaw 입력 중(Typing) 상태 표시 시점 및 상세 설정 가이드"
read_when:
  - 입력 중 표시 동작이나 기본 설정을 변경하고자 할 때
title: "입력 중 상태 표시"
x-i18n:
  source_path: "concepts/typing-indicators.md"
---

# 입력 중 상태 표시 (Typing Indicators)

에이전트가 작동하는 동안 해당 채팅 채널에 '입력 중...' 상태를 전송함. `agents.defaults.typingMode` 설정을 통해 표시 **시작 시점**을 제어하고, `typingIntervalSeconds` 설정을 통해 상태 유지 **주기**를 조정할 수 있음.

## 기본 동작 (Default)

`agents.defaults.typingMode` 값이 **설정되지 않은 경우**, 다음과 같은 레거시 동작을 따름:

- **개인 대화 (Direct Chats)**: 모델 루프가 시작되는 즉시 표시를 시작함.
- **멘션이 포함된 그룹 대화**: 메시지 수신 즉시 표시를 시작함.
- **멘션이 없는 그룹 대화**: 에이전트의 메시지 스트리밍이 실제로 시작될 때만 표시함.
- **하트비트(Heartbeat) 실행**: 상태 표시를 하지 않음.

## 표시 모드 (Modes)

`agents.defaults.typingMode` 설정 가능한 값:

- **`never`**: 어떤 경우에도 상태 표시를 하지 않음.
- **`instant`**: 모델 루프가 시작되는 즉시 표시를 시작함. 이후 에이전트가 답변 없이 종료되더라도 표시됨.
- **`thinking`**: 모델의 **첫 번째 사고 과정(Reasoning delta)**이 생성될 때 표시를 시작함 (실행 시 `reasoningLevel: "stream"` 설정 필요).
- **`message`**: 실제 응답의 **첫 번째 텍스트 조각(Text delta)**이 생성될 때 표시를 시작함. 무음 답변용 `NO_REPLY` 토큰은 무시함.

**표시 시점의 조급함 순서:**
`never` (가장 느림/안함) → `message` → `thinking` → `instant` (가장 빠름)

## 설정 방법

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6, // 6초마다 상태 갱신
  },
}
```

세션별로 모드나 주기를 다르게 적용할 수도 있음:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## 참고 사항

- **`message` 모드**: 에이전트가 응답을 억제하기 위해 `NO_REPLY` 토큰만 반환할 경우 사용자에게는 입력 중 표시가 나타나지 않음.
- **`thinking` 모드**: 에이전트가 사고 과정을 스트리밍할 때만 작동함. 모델이 사고 과정을 생략하거나 스트리밍하지 않는 경우 상태 표시가 시작되지 않음.
- **하트비트**: 하트비트에 의한 자율 실행 시에는 설정 모드와 관계없이 사용자에게 입력 중 표시를 보내지 않음.
- **`typingIntervalSeconds`**: 상태 표시가 시작되는 시점이 아니라, 표시를 **유지하기 위해 재전송하는 주기**를 의미함. 기본값은 6초임.
