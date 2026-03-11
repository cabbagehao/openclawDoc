---
summary: "Elevated exec 모드와 `/elevated` 지시어"
read_when:
  - elevated 모드 기본값, 허용 목록, 또는 슬래시 명령 동작을 조정할 때
title: "Elevated 모드"
---

# Elevated 모드 (`/elevated` 지시어)

## 하는 일

- `/elevated on` 은 gateway host 에서 실행되며 exec 승인도 유지합니다(`/elevated ask` 와 동일).
- `/elevated full` 은 gateway host 에서 실행되며 **동시에** exec 를 자동 승인합니다(exec 승인 건너뜀).
- `/elevated ask` 는 gateway host 에서 실행되지만 exec 승인은 유지합니다(`/elevated on` 과 동일).
- `on`/`ask` 는 `exec.security=full` 을 **강제하지 않습니다**. 구성된 security/ask 정책이 계속 적용됩니다.
- agent 가 **sandboxed** 된 경우에만 동작을 변경합니다(그 외에는 exec 가 이미 host 에서 실행됨).
- 지시어 형식: `/elevated on|off|ask|full`, `/elev on|off|ask|full`.
- `on|off|ask|full` 만 허용됩니다. 그 외 값은 힌트를 반환하고 상태를 변경하지 않습니다.

## 제어하는 것(그리고 제어하지 않는 것)

- **사용 가능 게이트**: `tools.elevated` 가 전역 기준선입니다. `agents.list[].tools.elevated` 는 agent 별로 elevated 를 추가 제한할 수 있습니다(둘 다 허용해야 함).
- **세션별 상태**: `/elevated on|off|ask|full` 은 현재 session key 에 대한 elevated level 을 설정합니다.
- **인라인 지시어**: 메시지 안의 `/elevated on|ask|full` 은 해당 메시지에만 적용됩니다.
- **그룹**: 그룹 채팅에서는 agent 가 멘션된 경우에만 elevated 지시어가 적용됩니다. 멘션 요구 사항을 우회하는 command-only 메시지는 멘션된 것으로 처리됩니다.
- **Host 실행**: elevated 는 `exec` 를 gateway host 로 강제하며, `full` 은 추가로 `security=full` 도 설정합니다.
- **승인**: `full` 은 exec 승인을 건너뜁니다. `on`/`ask` 는 allowlist/ask 규칙이 요구할 때 이를 따릅니다.
- **Unsandboxed agents**: 실행 위치에는 영향이 없습니다. 게이팅, 로깅, 상태에만 영향을 줍니다.
- **툴 정책은 계속 적용됨**: `exec` 가 툴 정책에 의해 거부되면 elevated 를 사용할 수 없습니다.
- **`/exec` 와는 별개**: `/exec` 는 승인된 발신자에 대한 세션별 기본값을 조정하며 elevated 가 필요하지 않습니다.

## 결정 순서

1. 메시지에 있는 인라인 지시어(해당 메시지에만 적용).
2. 세션 오버라이드(지시어만 있는 메시지를 보내 설정).
3. 전역 기본값(구성의 `agents.defaults.elevatedDefault`).

## 세션 기본값 설정

- 공백은 허용되지만, 메시지는 **지시어만** 포함해야 합니다. 예: `/elevated full`.
- 확인 응답이 전송됩니다(`Elevated mode set to full...` / `Elevated mode disabled.`).
- elevated 접근이 비활성화되어 있거나 발신자가 승인된 allowlist 에 없으면, 지시어는 실행 가능한 오류를 응답하고 세션 상태를 바꾸지 않습니다.
- 현재 elevated level 을 보려면 인자 없이 `/elevated`(또는 `/elevated:`) 를 보내세요.

## 사용 가능 여부 + allowlist

- 기능 게이트: `tools.elevated.enabled`(코드가 지원하더라도 config 에 따라 기본값이 off 일 수 있음).
- 발신자 allowlist: `tools.elevated.allowFrom` 과 provider 별 allowlist(예: `discord`, `whatsapp`).
- 접두사가 없는 allowlist 항목은 발신자 범위 identity 값에만 매칭됩니다(`SenderId`, `SenderE164`, `From`). 수신자 라우팅 필드는 elevated 권한 부여에 절대 사용되지 않습니다.
- 변경 가능한 발신자 메타데이터에는 명시적 접두사가 필요합니다:
  - `name:<value>` 는 `SenderName` 에 매칭
  - `username:<value>` 는 `SenderUsername` 에 매칭
  - `tag:<value>` 는 `SenderTag` 에 매칭
  - `id:<value>`, `from:<value>`, `e164:<value>` 는 명시적 identity 대상을 위해 사용 가능
- agent 별 게이트: `agents.list[].tools.elevated.enabled`(선택 사항이며 추가 제한만 가능).
- agent 별 allowlist: `agents.list[].tools.elevated.allowFrom`(선택 사항이며, 설정되면 발신자는 전역 + agent 별 allowlist 를 **모두** 만족해야 함).
- Discord 폴백: `tools.elevated.allowFrom.discord` 가 생략되면, `channels.discord.allowFrom` 목록이 폴백으로 사용됩니다(레거시: `channels.discord.dm.allowFrom`). 이를 재정의하려면 `tools.elevated.allowFrom.discord` 를 설정하세요(`[]` 도 가능). agent 별 allowlist 는 이 폴백을 사용하지 않습니다.
- 모든 게이트를 통과해야 하며, 그렇지 않으면 elevated 는 사용할 수 없는 것으로 처리됩니다.

## 로깅 + 상태

- Elevated exec 호출은 info 레벨로 기록됩니다.
- 세션 상태에는 elevated mode 가 포함됩니다(예: `elevated=ask`, `elevated=full`).
