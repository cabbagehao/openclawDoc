---
summary: "제안: ACP 바인딩 대화에 대한 장기 명령 권한 부여 모델"
description: "ACP-bound 대화에서 네이티브 명령 권한을 metadata와 shared policy evaluator로 옮기기 위한 장기 제안입니다."
read_when:
  - "Telegram/Discord의 ACP-bound 채널 또는 토픽에서 네이티브 명령 권한 동작을 설계할 때"
title: "ACP 바인딩 명령 권한 부여 (제안)"
x-i18n:
  source_path: "experiments/proposals/acp-bound-command-auth.md"
---

# ACP 바인딩 명령 권한 부여 (제안)

상태: 제안됨. **아직 구현되지 않았습니다.**

이 문서는 ACP-bound 대화에서 네이티브 명령에 적용할 장기 authorization model을 설명합니다. experiments proposal이며, 현재 production behavior를 대체하지 않습니다.

현재 구현된 동작은 다음 source와 tests를 참고하세요.

- `src/telegram/bot-native-commands.ts`
- `src/discord/monitor/native-command.ts`
- `src/auto-reply/reply/commands-core.ts`

## 문제

현재는 `/new`, `/reset` 같은 command-specific checks에 의존하고 있으며, allowlists가 비어 있어도 ACP-bound 채널/토픽 안에서 동작해야 합니다. 이 방식은 당장의 UX 문제는 해결하지만, command-name-based exceptions는 확장성이 없습니다.

## 장기 방향

command authorization을 ad-hoc handler logic에서 command metadata + shared policy evaluator로 옮깁니다.

### 1) 명령 정의에 권한 정책 메타데이터 추가

각 command definition은 auth policy를 선언해야 합니다. 예시 형태는 다음과 같습니다.

```ts
type CommandAuthPolicy =
  | { mode: "owner_or_allowlist" } // default, current strict behavior
  | { mode: "bound_acp_or_owner_or_allowlist" } // allow in explicitly bound ACP conversations
  | { mode: "owner_only" };
```

`/new`와 `/reset`은 `bound_acp_or_owner_or_allowlist`를 사용합니다.
대부분의 다른 commands는 `owner_or_allowlist`를 유지합니다.

### 2) 채널 전반에서 하나의 평가기 공유

다음 요소를 사용해 command auth를 평가하는 helper를 하나 도입합니다.

- command policy metadata
- sender authorization state
- resolved conversation binding state

behavior drift를 막기 위해 Telegram과 Discord native handlers는 같은 helper를 호출해야 합니다.

### 3) 바인딩 일치를 우회 경계로 사용

policy가 bound ACP bypass를 허용하더라도, 현재 대화에 대해 구성된 binding match가 실제로 해석된 경우에만 authorize해야 합니다. 단지 현재 session key가 ACP처럼 보인다는 이유만으로는 허용하지 않습니다.

이렇게 하면 boundary가 명시적으로 유지되고, 의도치 않은 완화 확대를 최소화할 수 있습니다.

## 왜 더 나은가

- 앞으로 commands가 늘어나도 command-name conditionals를 추가하지 않아도 됩니다.
- 채널 간 behavior를 일관되게 유지할 수 있습니다.
- 명시적 binding match를 요구하므로 현재 security model을 유지합니다.
- allowlists를 보편적 의무가 아니라 선택적 hardening 수단으로 남겨둘 수 있습니다.

## 롤아웃 계획(향후)

1. command registry types와 command data에 command auth policy field를 추가합니다.
2. shared evaluator를 구현하고 Telegram + Discord native handlers를 마이그레이션합니다.
3. `/new`와 `/reset`을 metadata-driven policy로 옮깁니다.
4. policy mode와 channel surface별 tests를 추가합니다.

## 비목표

- 이 제안은 ACP session lifecycle behavior를 바꾸지 않습니다.
- 이 제안은 모든 ACP-bound commands에 allowlists를 요구하지 않습니다.
- 이 제안은 기존 route binding semantics를 바꾸지 않습니다.

## 메모

이 제안은 의도적으로 additive합니다. 기존 experiments documents를 삭제하거나 대체하지 않습니다.
