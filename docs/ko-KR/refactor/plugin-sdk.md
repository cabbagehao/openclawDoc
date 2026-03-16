---
description: 모든 메시징 커넥터를 하나의 SDK와 주입형 runtime으로 통합하기 위한 plugin 아키텍처 리팩터링 계획
summary: "계획: 모든 메시징 커넥터를 위한 하나의 깔끔한 plugin SDK + runtime"
read_when:
  - plugin 아키텍처를 정의하거나 리팩터링할 때
  - channel connector를 plugin SDK/runtime으로 마이그레이션할 때
title: "Plugin SDK 리팩터링"
x-i18n:
  source_path: "refactor/plugin-sdk.md"
---

# Plugin SDK + Runtime 리팩터링 계획

목표: 모든 messaging connector가 하나의 안정적인 API를 사용하는 plugin(번들 또는 외부)이 되게 합니다.
Plugin은 더 이상 `src/**`를 직접 import하지 않습니다. 모든 의존성은 SDK 또는 runtime을 통해 접근합니다.

## 지금 필요한 이유

- 현재 connector는 패턴이 뒤섞여 있습니다: core 직접 import, dist 전용 bridge, 커스텀 helper.
- 이 때문에 업그레이드가 취약해지고, 깔끔한 외부 plugin 표면 구성을 막습니다.

## 목표 아키텍처 (두 계층)

### 1) Plugin SDK (컴파일 타임, 안정적, 배포 가능)

범위: type, helper, config utility. runtime state 없음, side effect 없음.

내용(예시):

- Type: `ChannelPlugin`, adapter, `ChannelMeta`, `ChannelCapabilities`, `ChannelDirectoryEntry`.
- Config helper: `buildChannelConfigSchema`, `setAccountEnabledInConfigSection`, `deleteAccountFromConfigSection`,
  `applyAccountNameToChannelSection`.
- Pairing helper: `PAIRING_APPROVED_MESSAGE`, `formatPairingApproveHint`.
- Onboarding helper: `promptChannelAccessConfig`, `addWildcardAllowFrom`, onboarding type.
- Tool param helper: `createActionGate`, `readStringParam`, `readNumberParam`, `readReactionParams`, `jsonResult`.
- Docs link helper: `formatDocsLink`.

전달 방식:

- `openclaw/plugin-sdk`로 publish(또는 core에서 `openclaw/plugin-sdk`로 export).
- 명시적인 안정성 보장을 갖는 semver 적용.

### 2) Plugin Runtime (실행 표면, 주입형)

범위: core runtime 동작에 닿는 모든 것.
Plugin은 `OpenClawPluginApi.runtime`를 통해 접근하므로 `src/**`를 import하지 않습니다.

제안 표면(최소이지만 완전):

```ts
export type PluginRuntime = {
  channel: {
    text: {
      chunkMarkdownText(text: string, limit: number): string[];
      resolveTextChunkLimit(cfg: OpenClawConfig, channel: string, accountId?: string): number;
      hasControlCommand(text: string, cfg: OpenClawConfig): boolean;
    };
    reply: {
      dispatchReplyWithBufferedBlockDispatcher(params: {
        ctx: unknown;
        cfg: unknown;
        dispatcherOptions: {
          deliver: (payload: {
            text?: string;
            mediaUrls?: string[];
            mediaUrl?: string;
          }) => void | Promise<void>;
          onError?: (err: unknown, info: { kind: string }) => void;
        };
      }): Promise<void>;
      createReplyDispatcherWithTyping?: unknown; // adapter for Teams-style flows
    };
    routing: {
      resolveAgentRoute(params: {
        cfg: unknown;
        channel: string;
        accountId: string;
        peer: { kind: RoutePeerKind; id: string };
      }): { sessionKey: string; accountId: string };
    };
    pairing: {
      buildPairingReply(params: { channel: string; idLine: string; code: string }): string;
      readAllowFromStore(channel: string): Promise<string[]>;
      upsertPairingRequest(params: {
        channel: string;
        id: string;
        meta?: { name?: string };
      }): Promise<{ code: string; created: boolean }>;
    };
    media: {
      fetchRemoteMedia(params: { url: string }): Promise<{ buffer: Buffer; contentType?: string }>;
      saveMediaBuffer(
        buffer: Uint8Array,
        contentType: string | undefined,
        direction: "inbound" | "outbound",
        maxBytes: number,
      ): Promise<{ path: string; contentType?: string }>;
    };
    mentions: {
      buildMentionRegexes(cfg: OpenClawConfig, agentId?: string): RegExp[];
      matchesMentionPatterns(text: string, regexes: RegExp[]): boolean;
    };
    groups: {
      resolveGroupPolicy(
        cfg: OpenClawConfig,
        channel: string,
        accountId: string,
        groupId: string,
      ): {
        allowlistEnabled: boolean;
        allowed: boolean;
        groupConfig?: unknown;
        defaultConfig?: unknown;
      };
      resolveRequireMention(
        cfg: OpenClawConfig,
        channel: string,
        accountId: string,
        groupId: string,
        override?: boolean,
      ): boolean;
    };
    debounce: {
      createInboundDebouncer<T>(opts: {
        debounceMs: number;
        buildKey: (v: T) => string | null;
        shouldDebounce: (v: T) => boolean;
        onFlush: (entries: T[]) => Promise<void>;
        onError?: (err: unknown) => void;
      }): { push: (v: T) => void; flush: () => Promise<void> };
      resolveInboundDebounceMs(cfg: OpenClawConfig, channel: string): number;
    };
    commands: {
      resolveCommandAuthorizedFromAuthorizers(params: {
        useAccessGroups: boolean;
        authorizers: Array<{ configured: boolean; allowed: boolean }>;
      }): boolean;
    };
  };
  logging: {
    shouldLogVerbose(): boolean;
    getChildLogger(name: string): PluginLogger;
  };
  state: {
    resolveStateDir(cfg: OpenClawConfig): string;
  };
};
```

메모:

- Runtime이 core 동작에 접근하는 유일한 방법입니다.
- SDK는 의도적으로 작고 안정적으로 유지합니다.
- 각 runtime 메서드는 기존 core 구현 하나에 대응합니다(중복 없음).

## 마이그레이션 계획 (단계별, 안전하게)

### Phase 0: scaffolding

- `openclaw/plugin-sdk` 도입.
- 위 표면을 가진 `api.runtime`을 `OpenClawPluginApi`에 추가.
- 전환 기간 동안 기존 import를 유지(비권장 경고 추가).

### Phase 1: bridge 정리 (리스크 낮음)

- extension별 `core-bridge.ts`를 `api.runtime`으로 교체.
- BlueBubbles, Zalo, Zalo Personal부터 마이그레이션(이미 구조가 가까움).
- 중복 bridge 코드 제거.

### Phase 2: direct-import가 가벼운 plugin

- Matrix를 SDK + runtime으로 마이그레이션.
- onboarding, directory, group mention 로직 검증.

### Phase 3: direct-import가 많은 plugin

- MS Teams를 마이그레이션(runtime helper 집합이 가장 큼).
- reply/typing 의미론이 현재 동작과 일치하는지 보장.

### Phase 4: iMessage pluginization

- iMessage를 `extensions/imessage`로 이동.
- direct core call을 `api.runtime`으로 교체.
- config key, CLI 동작, 문서는 그대로 유지.

### Phase 5: 강제

- lint rule / CI check 추가: `extensions/**`가 `src/**`를 import하지 못하게 함.
- plugin SDK/version 호환성 검사(runtime + SDK semver) 추가.

## 호환성 및 버전 관리

- SDK: semver, publish, 변경 사항 문서화.
- Runtime: core release마다 버전 관리. `api.runtime.version` 추가.
- Plugin은 필요한 runtime 범위를 선언(e.g., `openclawRuntime: ">=2026.2.0"`).

## 테스트 전략

- Adapter 수준 unit test(runtime 함수가 실제 core 구현을 통해 동작하는지 확인).
- plugin별 golden test: 동작 변화 없음 보장(routing, pairing, allowlist, mention gating).
- CI에서 사용할 단일 end-to-end plugin 샘플(install + run + smoke).

## 열린 질문

- SDK type은 어디에 둘 것인가: 별도 package vs core export?
- Runtime type 배포는 어디서 할 것인가: SDK(type only) vs core?
- 번들 plugin과 외부 plugin에 대한 docs link를 어떻게 노출할 것인가?
- 전환 기간 동안 in-repo plugin에 제한적인 direct core import를 허용할 것인가?

## 성공 기준

- 모든 channel connector가 SDK + runtime을 사용하는 plugin이다.
- `extensions/**`에서 `src/**`를 import하지 않는다.
- 새 connector template는 SDK + runtime에만 의존한다.
- 외부 plugin을 core source 접근 없이 개발하고 업데이트할 수 있다.

관련 문서: [Plugins](/tools/plugin), [Channels](/channels/index), [Configuration](/gateway/configuration).
