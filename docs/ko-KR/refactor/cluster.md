---
summary: "LOC 감소 잠재력이 가장 큰 리팩터링 클러스터"
read_when:
  - 동작을 바꾸지 않고 전체 LOC를 줄이고 싶을 때
  - 다음 dedupe 또는 extraction 대상을 고를 때
title: "리팩터링 클러스터 백로그"
x-i18n:
  source_path: "refactor/cluster.md"
---

# 리팩터링 클러스터 백로그

예상 LOC 감소량, 안전성, 적용 범위를 기준으로 순위를 매겼습니다.

## 1. Channel plugin config 및 security scaffolding

가장 가치가 큰 클러스터입니다.

많은 channel plugin에 반복되는 형태:

- `config.listAccountIds`
- `config.resolveAccount`
- `config.defaultAccountId`
- `config.setAccountEnabled`
- `config.deleteAccount`
- `config.describeAccount`
- `security.resolveDmPolicy`

대표 사례:

- `extensions/telegram/src/channel.ts`
- `extensions/googlechat/src/channel.ts`
- `extensions/slack/src/channel.ts`
- `extensions/discord/src/channel.ts`
- `extensions/matrix/src/channel.ts`
- `extensions/irc/src/channel.ts`
- `extensions/signal/src/channel.ts`
- `extensions/mattermost/src/channel.ts`

예상 extraction 형태:

- `buildChannelConfigAdapter(...)`
- `buildMultiAccountConfigAdapter(...)`
- `buildDmSecurityAdapter(...)`

예상 절감:

- ~250-450 LOC

리스크:

- Medium. 각 channel마다 `isConfigured`, warning, normalization이 조금씩 다릅니다.

## 2. Extension runtime singleton boilerplate

매우 안전합니다.

거의 모든 extension이 동일한 runtime holder를 가집니다.

- `let runtime: PluginRuntime | null = null`
- `setXRuntime`
- `getXRuntime`

대표 사례:

- `extensions/telegram/src/runtime.ts`
- `extensions/matrix/src/runtime.ts`
- `extensions/slack/src/runtime.ts`
- `extensions/discord/src/runtime.ts`
- `extensions/whatsapp/src/runtime.ts`
- `extensions/imessage/src/runtime.ts`
- `extensions/twitch/src/runtime.ts`

특수 케이스 변형:

- `extensions/bluebubbles/src/runtime.ts`
- `extensions/line/src/runtime.ts`
- `extensions/synology-chat/src/runtime.ts`

예상 extraction 형태:

- `createPluginRuntimeStore<T>(errorMessage)`

예상 절감:

- ~180-260 LOC

리스크:

- Low

## 3. Onboarding prompt 및 config-patch 단계

표면적이 큽니다.

많은 onboarding 파일이 다음을 반복합니다.

- account id 해결
- allowlist 항목 프롬프트
- allowFrom 병합
- DM policy 설정
- secret 프롬프트
- top-level vs account-scoped config patch 적용

대표 사례:

- `extensions/bluebubbles/src/onboarding.ts`
- `extensions/googlechat/src/onboarding.ts`
- `extensions/msteams/src/onboarding.ts`
- `extensions/zalo/src/onboarding.ts`
- `extensions/zalouser/src/onboarding.ts`
- `extensions/nextcloud-talk/src/onboarding.ts`
- `extensions/matrix/src/onboarding.ts`
- `extensions/irc/src/onboarding.ts`

기존 helper seam:

- `src/channels/plugins/onboarding/helpers.ts`

예상 extraction 형태:

- `promptAllowFromList(...)`
- `buildDmPolicyAdapter(...)`
- `applyScopedAccountPatch(...)`
- `promptSecretFields(...)`

예상 절감:

- ~300-600 LOC

리스크:

- Medium. 과도하게 일반화하기 쉬우므로 helper는 좁고 조합 가능하게 유지해야 합니다.

## 4. Multi-account config-schema fragment

extension 전반에 schema fragment가 반복됩니다.

공통 패턴:

- `const allowFromEntry = z.union([z.string(), z.number()])`
- account schema와 함께:
  - `accounts: z.object({}).catchall(accountSchema).optional()`
  - `defaultAccount: z.string().optional()`
- 반복되는 DM/group 필드
- 반복되는 markdown/tool policy 필드

대표 사례:

- `extensions/bluebubbles/src/config-schema.ts`
- `extensions/zalo/src/config-schema.ts`
- `extensions/zalouser/src/config-schema.ts`
- `extensions/matrix/src/config-schema.ts`
- `extensions/nostr/src/config-schema.ts`

예상 extraction 형태:

- `AllowFromEntrySchema`
- `buildMultiAccountChannelSchema(accountSchema)`
- `buildCommonDmGroupFields(...)`

예상 절감:

- ~120-220 LOC

리스크:

- Low to medium. 단순한 schema도 있고 특수한 schema도 있습니다.

## 5. Webhook 및 monitor lifecycle startup

중간 정도 가치가 있는 좋은 클러스터입니다.

반복되는 `startAccount` / monitor setup 패턴:

- account 해결
- webhook path 계산
- startup 로그 출력
- monitor 시작
- abort 대기
- cleanup
- status sink 업데이트

대표 사례:

- `extensions/googlechat/src/channel.ts`
- `extensions/bluebubbles/src/channel.ts`
- `extensions/zalo/src/channel.ts`
- `extensions/telegram/src/channel.ts`
- `extensions/nextcloud-talk/src/channel.ts`

기존 helper seam:

- `src/plugin-sdk/channel-lifecycle.ts`

예상 extraction 형태:

- account monitor lifecycle용 helper
- webhook 기반 account startup용 helper

예상 절감:

- ~150-300 LOC

리스크:

- Medium to high. transport 세부사항이 빠르게 갈라집니다.

## 6. 작고 정확히 동일한 clone 정리

리스크가 낮은 정리 묶음입니다.

예시:

- 중복된 gateway argv 감지:
  - `src/infra/gateway-lock.ts`
  - `src/cli/daemon-cli/lifecycle.ts`
- 중복된 port diagnostics 렌더링:
  - `src/cli/daemon-cli/restart-health.ts`
- 중복된 session-key 구성:
  - `src/web/auto-reply/monitor/broadcast.ts`

예상 절감:

- ~30-60 LOC

리스크:

- Low

## 테스트 클러스터

### LINE webhook event fixture

대표 사례:

- `src/line/bot-handlers.test.ts`

예상 extraction:

- `makeLineEvent(...)`
- `runLineEvent(...)`
- `makeLineAccount(...)`

예상 절감:

- ~120-180 LOC

### Telegram native command auth matrix

대표 사례:

- `src/telegram/bot-native-commands.group-auth.test.ts`
- `src/telegram/bot-native-commands.plugin-auth.test.ts`

예상 extraction:

- forum context builder
- denied-message assertion helper
- table-driven auth case

예상 절감:

- ~80-140 LOC

### Zalo lifecycle setup

대표 사례:

- `extensions/zalo/src/monitor.lifecycle.test.ts`

예상 extraction:

- shared monitor setup harness

예상 절감:

- ~50-90 LOC

### Brave llm-context unsupported-option test

대표 사례:

- `src/agents/tools/web-tools.enabled-defaults.test.ts`

예상 extraction:

- `it.each(...)` matrix

예상 절감:

- ~30-50 LOC

## 권장 순서

1. Runtime singleton boilerplate
2. 작고 정확히 동일한 clone 정리
3. Config 및 security builder extraction
4. Test-helper extraction
5. Onboarding 단계 extraction
6. Monitor lifecycle helper extraction
