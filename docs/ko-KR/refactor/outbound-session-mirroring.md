---
title: "Outbound Session Mirroring 리팩터링 (Issue #1520)"
description: "outbound sends를 대상 채널 session에 미러링하도록 바꾸는 리팩터링 메모와 결정 사항을 정리합니다."
summary: "대상 채널 세션으로 outbound 전송을 미러링하는 리팩터링 메모"
read_when:
  - outbound transcript/session mirroring 동작을 다룰 때
  - send/message 도구 경로의 sessionKey 파생을 디버깅할 때
x-i18n:
  source_path: "refactor/outbound-session-mirroring.md"
---

# Outbound Session Mirroring 리팩터링 (Issue #1520)

## Status

- 진행 중
- core + plugin channel routing이 outbound mirroring을 위해 업데이트됨
- Gateway send는 `sessionKey`가 생략되면 target session을 유도

## Context

outbound sends는 target channel session이 아니라 _현재_ agent session(tool session key)에 미러링되고 있었습니다. inbound routing은 channel/peer session keys를 사용하므로, outbound replies가 잘못된 session에 기록됐고 first-contact targets에는 session entries가 없는 경우가 자주 생겼습니다.

## 목표

- outbound messages를 target channel session key에 미러링
- 누락된 경우 outbound 시점에 session entries 생성
- thread/topic scoping을 inbound session keys와 일치시키기
- core channels와 bundled extensions를 모두 커버하기

## 구현 요약

- 새로운 outbound session routing helper:
  - `src/infra/outbound/outbound-session.ts`
  - `resolveOutboundSessionRoute`는 `buildAgentSessionKey`(dmScope + identityLinks)를 사용해 target sessionKey를 생성
  - `ensureOutboundSessionEntry`는 `recordSessionMetaFromInbound`를 통해 최소 `MsgContext`를 기록
- `runMessageAction` (send)은 target sessionKey를 유도한 뒤 `executeSendAction`에 전달해 미러링
- `message-tool`은 더 이상 직접 미러링하지 않고, 현재 session key에서 agentId만 해결
- plugin send path는 유도된 sessionKey를 사용해 `appendAssistantMessageToSessionTranscript`로 미러링
- Gateway send는 sessionKey가 없으면 target session key를 유도하고 session entry를 생성

## Thread/Topic handling

- Slack: replyTo/threadId -> `resolveThreadSessionKeys` (suffix)
- Discord: threadId/replyTo -> `resolveThreadSessionKeys` with `useSuffix=false` to match inbound (thread channel id 자체가 session 범위를 정함)
- Telegram: topic IDs는 `buildTelegramGroupPeerId`를 통해 `chatId:topic:<id>`로 매핑

## Extensions covered

- Matrix, MS Teams, Mattermost, BlueBubbles, Nextcloud Talk, Zalo, Zalo Personal, Nostr, Tlon
- Notes:
  - Mattermost 대상은 DM session key routing을 위해 `@`를 제거
  - Zalo Personal은 1:1 대상에 DM peer kind를 사용(`group:`이 있을 때만 group)
  - BlueBubbles group 대상은 inbound session key와 맞추기 위해 `chat_*` 접두사를 제거
  - Slack auto-thread mirroring은 channel id를 대소문자 구분 없이 비교
  - Gateway send는 미러링 전에 제공된 session key를 소문자로 정규화

## Decisions

- **Gateway send session derivation**: `sessionKey`가 제공되면 그대로 사용하고, 없으면 target + default agent로 sessionKey를 생성해 그쪽에 미러링
- **Session entry creation**: 항상 `recordSessionMetaFromInbound`를 사용하고, `Provider/From/To/ChatType/AccountId/Originating*` 형식을 inbound와 맞춤
- **Target normalization**: outbound routing은 가능하면 `resolveChannelTarget` 이후의 resolved targets를 사용
- **Session key casing**: session keys는 기록 시점과 migration 시 모두 lowercase로 canonicalize

## Tests added/updated

- `src/infra/outbound/outbound.test.ts`
  - Slack thread session key
  - Telegram topic session key
  - dmScope identityLinks with Discord
- `src/agents/tools/message-tool.test.ts`
  - session key에서 agentId 파생(sessionKey 직접 전달 없음)
- `src/gateway/server-methods/send.test.ts`
  - sessionKey가 없을 때 유도하고 session entry 생성

## Open items / follow-ups

- voice-call plugin은 사용자 정의 `voice:<phone>` session key를 사용합니다. 여기서는 outbound mapping이 표준화되지 않았으므로, message-tool이 voice-call sends를 지원해야 한다면 별도 매핑을 추가해야 합니다.
- bundled set 외에 표준이 아닌 `From/To` 형식을 쓰는 external plugin이 있는지 확인 필요

## Files touched

- `src/infra/outbound/outbound-session.ts`
- `src/infra/outbound/outbound-send-service.ts`
- `src/infra/outbound/message-action-runner.ts`
- `src/agents/tools/message-tool.ts`
- `src/gateway/server-methods/send.ts`
- Tests:
  - `src/infra/outbound/outbound.test.ts`
  - `src/agents/tools/message-tool.test.ts`
  - `src/gateway/server-methods/send.test.ts`
