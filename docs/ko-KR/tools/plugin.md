---
title: "Plugins"
description: "OpenClaw 플러그인의 설치, discovery, SDK import 경로, HTTP route, 보안 규칙을 설명합니다."
summary: "OpenClaw 플러그인/확장: discovery, config, safety"
read_when:
  - 플러그인/확장을 추가하거나 수정할 때
  - 플러그인 설치 또는 로드 규칙을 문서화할 때
x-i18n:
  source_path: "tools/plugin.md"
---

# 플러그인(확장)

## 빠른 시작(플러그인이 처음인가요?)

플러그인은 추가 기능(명령, 도구, Gateway RPC)으로 OpenClaw를 확장하는
**작은 코드 모듈**일 뿐입니다.

대부분의 경우, 아직 OpenClaw 코어에 내장되지 않은 기능이 필요할 때
(또는 선택적 기능을 주 설치본과 분리해 두고 싶을 때) 플러그인을 사용합니다.

빠른 경로:

1. 무엇이 이미 로드되어 있는지 확인합니다:

```bash
openclaw plugins list
```

2. 공식 플러그인을 설치합니다(예: Voice Call):

```bash
openclaw plugins install @openclaw/voice-call
```

Npm spec은 **레지스트리 전용**입니다(패키지 이름 + 선택적 **정확한 버전** 또는
**dist-tag**). Git/URL/file spec과 semver 범위는 거부됩니다.

Bare spec과 `@latest`는 안정 트랙에 머뭅니다. npm이 둘 중 하나를 prerelease로
해석하면 OpenClaw는 중지하고 `@beta`/`@rc` 같은 prerelease 태그나 정확한
prerelease 버전으로 명시적으로 opt-in 하라고 요청합니다.

3. Gateway를 재시작한 다음 `plugins.entries.<id>.config` 아래에서 구성합니다.

구체적인 예시 플러그인은 [Voice Call](/plugins/voice-call)을 참고하세요.
서드파티 목록을 찾고 있다면 [Community plugins](/plugins/community)을 보세요.

## 사용 가능한 플러그인(공식)

- Microsoft Teams는 2026.1.15부터 플러그인 전용입니다. Teams를 사용한다면 `@openclaw/msteams`를 설치하세요.
- Memory (Core) — 번들된 memory search 플러그인(`plugins.slots.memory`를 통해 기본 활성화)
- Memory (LanceDB) — 번들된 장기 메모리 플러그인(auto-recall/capture, `plugins.slots.memory = "memory-lancedb"` 설정)
- [Voice Call](/plugins/voice-call) — `@openclaw/voice-call`
- [Zalo Personal](/plugins/zalouser) — `@openclaw/zalouser`
- [Matrix](/channels/matrix) — `@openclaw/matrix`
- [Nostr](/channels/nostr) — `@openclaw/nostr`
- [Zalo](/channels/zalo) — `@openclaw/zalo`
- [Microsoft Teams](/channels/msteams) — `@openclaw/msteams`
- Google Antigravity OAuth (provider auth) — `google-antigravity-auth`로 번들 제공(기본 비활성화)
- Gemini CLI OAuth (provider auth) — `google-gemini-cli-auth`로 번들 제공(기본 비활성화)
- Qwen OAuth (provider auth) — `qwen-portal-auth`로 번들 제공(기본 비활성화)
- Copilot Proxy (provider auth) — 로컬 VS Code Copilot Proxy 브리지, 내장 `github-copilot` device login과는 별개(번들 제공, 기본 비활성화)

OpenClaw 플러그인은 jiti를 통해 런타임에 로드되는 **TypeScript 모듈**입니다.
**Config validation은 플러그인 코드를 실행하지 않습니다**. 대신 플러그인
manifest와 JSON Schema를 사용합니다. [Plugin manifest](/plugins/manifest)를
참고하세요.

플러그인이 등록할 수 있는 항목:

- Gateway RPC 메서드
- Gateway HTTP 라우트
- 에이전트 도구
- CLI 명령
- 백그라운드 서비스
- 컨텍스트 엔진
- 선택적 config validation
- **Skills** (`skills` 디렉터리를 플러그인 manifest에 나열하여)
- **자동 응답 명령** (AI 에이전트를 호출하지 않고 실행)

플러그인은 Gateway와 **같은 프로세스 내**에서 실행되므로, 신뢰할 수 있는
코드로 취급하세요. 도구 작성 가이드는 [Plugin agent tools](/plugins/agent-tools)를
참고하세요.

## 런타임 헬퍼

플러그인은 `api.runtime`를 통해 선택된 코어 헬퍼에 접근할 수 있습니다.
전화용 TTS 예시:

```ts
const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});
```

참고:

- 코어 `messages.tts` 구성(OpenAI 또는 ElevenLabs)을 사용합니다.
- PCM 오디오 버퍼 + 샘플 레이트를 반환합니다. 플러그인은 provider에 맞게 resample/encode해야 합니다.
- Edge TTS는 전화용으로 지원되지 않습니다.

STT/transcription의 경우 플러그인은 다음을 호출할 수 있습니다:

```ts
const { text } = await api.runtime.stt.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

참고:

- 코어 media-understanding 오디오 구성(`tools.media.audio`)과 provider fallback 순서를 사용합니다.
- transcription 출력이 생성되지 않으면 `{ text: undefined }`를 반환합니다(예: 입력이 건너뛰어졌거나 지원되지 않는 경우).

## Gateway HTTP 라우트

플러그인은 `api.registerHttpRoute(...)`로 HTTP endpoint를 노출할 수 있습니다.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

라우트 필드:

- `path`: gateway HTTP 서버 아래의 라우트 경로
- `auth`: 필수. 일반 gateway auth가 필요하면 `"gateway"`를, 플러그인 관리 auth/webhook verification에는 `"plugin"`을 사용합니다.
- `match`: 선택 사항. `"exact"`(기본값) 또는 `"prefix"`
- `replaceExisting`: 선택 사항. 같은 플러그인이 기존에 등록한 자신의 라우트를 교체할 수 있게 합니다.
- `handler`: 라우트가 요청을 처리했으면 `true`를 반환합니다.

참고:

- `api.registerHttpHandler(...)`는 더 이상 사용되지 않습니다. `api.registerHttpRoute(...)`를 사용하세요.
- 플러그인 라우트는 `auth`를 명시적으로 선언해야 합니다.
- 정확히 같은 `path + match` 충돌은 `replaceExisting: true`가 아닌 한 거부되며, 한 플러그인이 다른 플러그인의 라우트를 교체할 수는 없습니다.
- `auth` 수준이 다른 중첩 라우트는 거부됩니다. `exact`/`prefix` fallthrough 체인은 같은 auth 수준에서만 유지하세요.

## Plugin SDK import 경로

플러그인을 작성할 때는 단일 `openclaw/plugin-sdk` import 대신 SDK 서브패스를
사용하세요:

- 범용 플러그인 API, provider auth 타입, 공유 헬퍼에는 `openclaw/plugin-sdk/core`
- `core`보다 더 넓은 공유 런타임 헬퍼가 필요한 번들/내부 플러그인 코드에는 `openclaw/plugin-sdk/compat`
- Telegram 채널 플러그인에는 `openclaw/plugin-sdk/telegram`
- Discord 채널 플러그인에는 `openclaw/plugin-sdk/discord`
- Slack 채널 플러그인에는 `openclaw/plugin-sdk/slack`
- Signal 채널 플러그인에는 `openclaw/plugin-sdk/signal`
- iMessage 채널 플러그인에는 `openclaw/plugin-sdk/imessage`
- WhatsApp 채널 플러그인에는 `openclaw/plugin-sdk/whatsapp`
- LINE 채널 플러그인에는 `openclaw/plugin-sdk/line`
- 번들된 Microsoft Teams 플러그인 표면에는 `openclaw/plugin-sdk/msteams`
- 번들된 확장 전용 서브패스도 사용할 수 있습니다:
  `openclaw/plugin-sdk/acpx`, `openclaw/plugin-sdk/bluebubbles`,
  `openclaw/plugin-sdk/copilot-proxy`, `openclaw/plugin-sdk/device-pair`,
  `openclaw/plugin-sdk/diagnostics-otel`, `openclaw/plugin-sdk/diffs`,
  `openclaw/plugin-sdk/feishu`,
  `openclaw/plugin-sdk/google-gemini-cli-auth`, `openclaw/plugin-sdk/googlechat`,
  `openclaw/plugin-sdk/irc`, `openclaw/plugin-sdk/llm-task`,
  `openclaw/plugin-sdk/lobster`, `openclaw/plugin-sdk/matrix`,
  `openclaw/plugin-sdk/mattermost`, `openclaw/plugin-sdk/memory-core`,
  `openclaw/plugin-sdk/memory-lancedb`,
  `openclaw/plugin-sdk/minimax-portal-auth`,
  `openclaw/plugin-sdk/nextcloud-talk`, `openclaw/plugin-sdk/nostr`,
  `openclaw/plugin-sdk/open-prose`, `openclaw/plugin-sdk/phone-control`,
  `openclaw/plugin-sdk/qwen-portal-auth`, `openclaw/plugin-sdk/synology-chat`,
  `openclaw/plugin-sdk/talk-voice`, `openclaw/plugin-sdk/test-utils`,
  `openclaw/plugin-sdk/thread-ownership`, `openclaw/plugin-sdk/tlon`,
  `openclaw/plugin-sdk/twitch`, `openclaw/plugin-sdk/voice-call`,
  `openclaw/plugin-sdk/zalo`, `openclaw/plugin-sdk/zalouser`.

호환성 참고:

- `openclaw/plugin-sdk`는 기존 외부 플러그인에 대해 계속 지원됩니다.
- 신규 및 마이그레이션된 번들 플러그인은 채널 또는 확장 전용 서브패스를
  사용해야 합니다. 범용 표면에는 `core`, 더 넓은 공유 헬퍼가 필요할 때만
  `compat`를 사용하세요.

## 읽기 전용 채널 검사

플러그인이 채널을 등록한다면 `resolveAccount(...)`와 함께
`plugin.config.inspectAccount(cfg, accountId)` 구현을 우선 고려하세요.

이유:

- `resolveAccount(...)`는 런타임 경로입니다. 자격 증명이 완전히 materialize되었다고 가정해도 되며, 필요한 secret이 없으면 빠르게 실패해도 됩니다.
- `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, doctor/config repair 흐름 같은 읽기 전용 명령 경로는 구성 설명만 하기 위해 런타임 자격 증명을 materialize할 필요가 없어야 합니다.

권장 `inspectAccount(...)` 동작:

- 설명용 계정 상태만 반환합니다.
- `enabled`와 `configured`를 유지합니다.
- 관련이 있다면 다음과 같은 credential source/status 필드를 포함합니다:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 읽기 전용 가용성 보고를 위해 raw token 값을 반환할 필요는 없습니다. 상태형 명령에는 `tokenStatus: "available"`(및 그에 대응하는 source 필드)만으로 충분합니다.
- SecretRef를 통해 credential이 구성되어 있지만 현재 명령 경로에서는 사용할 수 없다면 `configured_unavailable`을 사용하세요.

이렇게 하면 읽기 전용 명령이 충돌하거나 계정이 미구성 상태라고 잘못 보고하지 않고,
"configured but unavailable in this command path"를 보고할 수 있습니다.

성능 참고:

- 플러그인 discovery와 manifest 메타데이터는 burst성 startup/reload 작업을 줄이기 위해 짧은 in-process cache를 사용합니다.
- 이 cache를 끄려면 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 또는 `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`을 설정하세요.
- cache window는 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS`와 `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`로 조정합니다.

## Discovery 및 precedence

OpenClaw는 다음 순서로 스캔합니다:

1. Config 경로

- `plugins.load.paths` (file 또는 directory)

2. 워크스페이스 확장

- `<workspace>/.openclaw/extensions/*.ts`
- `<workspace>/.openclaw/extensions/*/index.ts`

3. 전역 확장

- `~/.openclaw/extensions/*.ts`
- `~/.openclaw/extensions/*/index.ts`

4. 번들 확장(OpenClaw와 함께 제공되며 대부분 기본 비활성화)

- `<openclaw>/extensions/*`

대부분의 번들 플러그인은 `plugins.entries.<id>.enabled` 또는
`openclaw plugins enable <id>`를 통해 명시적으로 활성화해야 합니다.

기본 활성화되는 번들 플러그인 예외:

- `device-pair`
- `phone-control`
- `talk-voice`
- 활성 메모리 슬롯 플러그인(기본 슬롯: `memory-core`)

설치된 플러그인은 기본적으로 활성화되지만, 같은 방식으로 비활성화할 수 있습니다.

강화 관련 참고:

- `plugins.allow`가 비어 있고 번들이 아닌 플러그인이 discovery 가능하면 OpenClaw는 startup warning에 플러그인 id와 source를 기록합니다.
- 후보 경로는 discovery 허용 전에 safety-check를 거칩니다. OpenClaw는 다음 경우 후보를 차단합니다:
  - 확장 엔트리가 플러그인 루트 밖으로 resolve되는 경우(심볼릭 링크/경로 순회 escape 포함)
  - 플러그인 루트/source 경로가 world-writable인 경우
  - 번들이 아닌 플러그인의 path ownership이 의심스러운 경우(POSIX owner가 현재 uid도 root도 아님)
- install/load-path provenance가 없는 로드된 비번들 플러그인은 trust pin(`plugins.allow`) 또는 install tracking(`plugins.installs`)을 설정할 수 있도록 warning을 출력합니다.

각 플러그인은 루트에 `openclaw.plugin.json` 파일을 포함해야 합니다. 경로가 파일을
가리키면 플러그인 루트는 그 파일의 디렉터리가 되며, 그 디렉터리에 manifest가
있어야 합니다.

여러 플러그인이 같은 id로 resolve되면 위 순서에서 먼저 일치한 것이 우선하며,
더 낮은 우선순위의 복사본은 무시됩니다.

### Package pack

플러그인 디렉터리는 `openclaw.extensions`가 있는 `package.json`을 포함할 수 있습니다:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"]
  }
}
```

각 항목은 하나의 플러그인이 됩니다. pack이 여러 확장을 나열하면 플러그인 id는
`name/<fileBase>`가 됩니다.

플러그인이 npm dependency를 import한다면 해당 디렉터리에 dependency를 설치해
`node_modules`를 사용할 수 있게 하세요(`npm install` / `pnpm install`).

보안 가드레일: 모든 `openclaw.extensions` 항목은 심볼릭 링크 해석 후에도 플러그인
디렉터리 내부에 있어야 합니다. 패키지 디렉터리 밖으로 벗어나는 항목은 거부됩니다.

보안 참고: `openclaw plugins install`은 플러그인 dependency를
`npm install --ignore-scripts`(lifecycle script 없음)로 설치합니다. 플러그인
dependency 트리는 "pure JS/TS"로 유지하고 `postinstall` 빌드가 필요한 패키지는
피하세요.

### 채널 카탈로그 메타데이터

채널 플러그인은 `openclaw.channel`을 통해 onboarding metadata를,
`openclaw.install`을 통해 설치 힌트를 광고할 수 있습니다. 이렇게 하면 코어에
카탈로그 데이터를 넣지 않아도 됩니다.

예시:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "extensions/nextcloud-talk",
      "defaultChoice": "npm"
    }
  }
}
```

OpenClaw는 **외부 채널 카탈로그**(예: MPM 레지스트리 export)도 병합할 수 있습니다.
다음 중 한 곳에 JSON 파일을 두세요:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

또는 `OPENCLAW_PLUGIN_CATALOG_PATHS`(또는 `OPENCLAW_MPM_CATALOG_PATHS`)를 하나
이상의 JSON 파일(쉼표/세미콜론/`PATH` 구분)로 지정하세요. 각 파일은
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`
형태를 포함해야 합니다.

## Plugin ID

기본 plugin id:

- Package pack: `package.json`의 `name`
- 독립 파일: 파일 기본 이름(`~/.../voice-call.ts` → `voice-call`)

플러그인이 `id`를 export하면 OpenClaw는 그것을 사용하지만, 구성된 id와 일치하지
않으면 warning을 출력합니다.

## Config

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

필드:

- `enabled`: 마스터 토글(기본값: true)
- `allow`: allowlist(선택 사항)
- `deny`: denylist(선택 사항, deny가 우선)
- `load.paths`: 추가 plugin file/dir
- `slots`: `memory`, `contextEngine` 같은 배타적 slot selector
- `entries.<id>`: 플러그인별 토글 + config

Config 변경에는 **Gateway 재시작이 필요합니다**.

validation 규칙(엄격):

- `entries`, `allow`, `deny`, `slots`의 알 수 없는 plugin id는 **오류**입니다.
- plugin manifest가 채널 id를 선언하지 않은 한, 알 수 없는 `channels.<id>` 키는 **오류**입니다.
- plugin config는 `openclaw.plugin.json`에 내장된 JSON Schema(`configSchema`)를 사용해 validation됩니다.
- 플러그인이 비활성화되어 있으면 해당 config는 보존되고 **warning**이 출력됩니다.

## Plugin slot(배타적 카테고리)

일부 plugin 카테고리는 **배타적**입니다(한 번에 하나만 활성). 어떤 plugin이 그
slot을 소유할지 `plugins.slots`로 선택합니다:

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable memory plugins
      contextEngine: "legacy", // or a plugin id such as "lossless-claw"
    },
  },
}
```

지원되는 배타적 slot:

- `memory`: 활성 memory plugin(`"none"`이면 memory plugin 비활성화)
- `contextEngine`: 활성 context engine plugin(`"legacy"`는 내장 기본값)

여러 plugin이 `kind: "memory"` 또는 `kind: "context-engine"`을 선언하면, 해당
slot에 선택된 plugin만 로드됩니다. 나머지는 diagnostics와 함께 비활성화됩니다.

### Context engine 플러그인

Context engine 플러그인은 ingest, assembly, compaction에 대한 세션 컨텍스트
오케스트레이션을 담당합니다. 플러그인에서
`api.registerContextEngine(id, factory)`로 등록한 다음, 활성 엔진을
`plugins.slots.contextEngine`으로 선택하세요.

메모리 search나 hook만 추가하는 것이 아니라 기본 context pipeline을 교체하거나
확장해야 할 때 사용합니다.

## Control UI(schema + label)

Control UI는 더 나은 폼 렌더링을 위해 `config.schema`(JSON Schema + `uiHints`)를
사용합니다.

OpenClaw는 discovery된 plugin에 따라 런타임에 `uiHints`를 보강합니다:

- `plugins.entries.<id>` / `.enabled` / `.config`에 plugin별 label 추가
- 선택적인 plugin 제공 config field hint를 다음 아래로 병합:
  `plugins.entries.<id>.config.<field>`

plugin config field에 좋은 label/placeholder를 표시하고 secret을 민감 정보로
표시하고 싶다면, plugin manifest의 JSON Schema와 함께 `uiHints`를 제공하세요.

예시:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": { "type": "string" },
      "region": { "type": "string" }
    }
  },
  "uiHints": {
    "apiKey": { "label": "API Key", "sensitive": true },
    "region": { "label": "Region", "placeholder": "us-east-1" }
  }
}
```

## CLI

```bash
openclaw plugins list
openclaw plugins info <id>
openclaw plugins install <path>                 # copy a local file/dir into ~/.openclaw/extensions/<id>
openclaw plugins install ./extensions/voice-call # relative path ok
openclaw plugins install ./plugin.tgz           # install from a local tarball
openclaw plugins install ./plugin.zip           # install from a local zip
openclaw plugins install -l ./extensions/voice-call # link (no copy) for dev
openclaw plugins install @openclaw/voice-call # install from npm
openclaw plugins install @openclaw/voice-call --pin # store exact resolved name@version
openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins doctor
```

`plugins update`는 `plugins.installs` 아래에서 추적되는 npm 설치에 대해서만
동작합니다. 업데이트 사이에 저장된 integrity metadata가 바뀌면 OpenClaw는
warning을 표시하고 확인을 요청합니다(프롬프트를 건너뛰려면 전역 `--yes` 사용).

플러그인은 자신만의 최상위 명령도 등록할 수 있습니다(예: `openclaw voicecall`).

## Plugin API(개요)

플러그인은 다음 중 하나를 export합니다:

- 함수: `(api) => { ... }`
- 객체: `{ id, name, configSchema, register(api) { ... } }`

Context engine 플러그인은 런타임 소유 context manager도 등록할 수 있습니다:

```ts
export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

그런 다음 config에서 활성화합니다:

```json5
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw",
    },
  },
}
```

## Plugin hook

플러그인은 런타임에 hook을 등록할 수 있습니다. 이를 통해 별도의 hook pack 설치
없이 플러그인이 이벤트 기반 automation을 번들로 제공할 수 있습니다.

### 예시

```ts
export default function register(api) {
  api.registerHook(
    "command:new",
    async () => {
      // Hook logic here.
    },
    {
      name: "my-plugin.command-new",
      description: "Runs when /new is invoked",
    },
  );
}
```

참고:

- `api.registerHook(...)`로 hook을 명시적으로 등록하세요.
- hook eligibility 규칙은 계속 적용됩니다(OS/bins/env/config 요구 사항).
- plugin 관리 hook은 `openclaw hooks list`에 `plugin:<id>`로 표시됩니다.
- plugin 관리 hook은 `openclaw hooks`로 enable/disable할 수 없습니다. 대신 plugin 자체를 enable/disable하세요.

### 에이전트 lifecycle hook (`api.on`)

타입이 지정된 런타임 lifecycle hook에는 `api.on(...)`을 사용하세요:

```ts
export default function register(api) {
  api.on(
    "before_prompt_build",
    (event, ctx) => {
      return {
        prependSystemContext: "Follow company style guide.",
      };
    },
    { priority: 10 },
  );
}
```

프롬프트 구성에 중요한 hook:

- `before_model_resolve`: 세션 로드 전에 실행됩니다(`messages` 사용 불가). `modelOverride` 또는 `providerOverride`를 결정적으로 덮어쓸 때 사용하세요.
- `before_prompt_build`: 세션 로드 후에 실행됩니다(`messages` 사용 가능). 프롬프트 입력을 조정할 때 사용하세요.
- `before_agent_start`: 레거시 호환용 hook입니다. 가능하면 위 두 개의 명시적 hook을 우선 사용하세요.

코어에서 강제하는 hook 정책:

- 운영자는 `plugins.entries.<id>.hooks.allowPromptInjection: false`로 플러그인별 프롬프트 변형 hook을 비활성화할 수 있습니다.
- 비활성화되면 OpenClaw는 `before_prompt_build`를 차단하고, 레거시 `before_agent_start`가 반환한 프롬프트 변경 필드는 무시하되 레거시 `modelOverride`와 `providerOverride`는 유지합니다.

`before_prompt_build` 결과 필드:

- `prependContext`: 이번 실행의 user prompt 앞에 텍스트를 추가합니다. turn별 또는 동적 콘텐츠에 가장 적합합니다.
- `systemPrompt`: 전체 system prompt를 덮어씁니다.
- `prependSystemContext`: 현재 system prompt 앞에 텍스트를 추가합니다.
- `appendSystemContext`: 현재 system prompt 뒤에 텍스트를 추가합니다.

임베디드 런타임의 prompt 빌드 순서:

1. user prompt에 `prependContext`를 적용합니다.
2. 제공되면 `systemPrompt` override를 적용합니다.
3. `prependSystemContext + current system prompt + appendSystemContext`를 적용합니다.

병합 및 precedence 참고:

- hook handler는 priority 순으로 실행됩니다(높을수록 먼저).
- 병합되는 context 필드는 실행 순서대로 값을 이어 붙입니다.
- `before_prompt_build` 값은 레거시 `before_agent_start` fallback 값보다 먼저 적용됩니다.

마이그레이션 가이드:

- provider가 안정적인 system-prefix 콘텐츠를 캐시할 수 있도록, 정적인 가이드는 `prependContext`에서 `prependSystemContext`(또는 `appendSystemContext`)로 옮기세요.
- user message에 결합된 상태로 유지되어야 하는 turn별 동적 컨텍스트에는 `prependContext`를 유지하세요.

## Provider 플러그인(model auth)

플러그인은 **모델 provider auth** 흐름을 등록할 수 있으므로 사용자가 OpenClaw
내부에서 OAuth 또는 API key 설정을 수행할 수 있습니다(외부 스크립트 불필요).

`api.registerProvider(...)`로 provider를 등록하세요. 각 provider는 하나 이상의
auth method(OAuth, API key, device code 등)를 노출합니다. 이 method는 다음을
구동합니다:

- `openclaw models auth login --provider <id> [--method <id>]`

예시:

```ts
api.registerProvider({
  id: "acme",
  label: "AcmeAI",
  auth: [
    {
      id: "oauth",
      label: "OAuth",
      kind: "oauth",
      run: async (ctx) => {
        // Run OAuth flow and return auth profiles.
        return {
          profiles: [
            {
              profileId: "acme:default",
              credential: {
                type: "oauth",
                provider: "acme",
                access: "...",
                refresh: "...",
                expires: Date.now() + 3600 * 1000,
              },
            },
          ],
          defaultModel: "acme/opus-1",
        };
      },
    },
  ],
});
```

참고:

- `run`은 `prompter`, `runtime`, `openUrl`, `oauth.createVpsAwareHandlers` 헬퍼가 포함된 `ProviderAuthContext`를 받습니다.
- 기본 모델 또는 provider config를 추가해야 한다면 `configPatch`를 반환하세요.
- `--set-default`가 에이전트 기본값을 업데이트할 수 있도록 `defaultModel`을 반환하세요.

### 메시징 채널 등록

플러그인은 내장 채널(WhatsApp, Telegram 등)처럼 동작하는 **채널 플러그인**을
등록할 수 있습니다. 채널 config는 `channels.<id>` 아래에 위치하며, 여러분의
채널 플러그인 코드로 validation됩니다.

```ts
const myChannel = {
  id: "acmechat",
  meta: {
    id: "acmechat",
    label: "AcmeChat",
    selectionLabel: "AcmeChat (API)",
    docsPath: "/channels/acmechat",
    blurb: "demo channel plugin.",
    aliases: ["acme"],
  },
  capabilities: { chatTypes: ["direct"] },
  config: {
    listAccountIds: (cfg) => Object.keys(cfg.channels?.acmechat?.accounts ?? {}),
    resolveAccount: (cfg, accountId) =>
      cfg.channels?.acmechat?.accounts?.[accountId ?? "default"] ?? {
        accountId,
      },
  },
  outbound: {
    deliveryMode: "direct",
    sendText: async () => ({ ok: true }),
  },
};

export default function (api) {
  api.registerChannel({ plugin: myChannel });
}
```

참고:

- config는 `plugins.entries`가 아니라 `channels.<id>` 아래에 두세요.
- `meta.label`은 CLI/UI 목록의 label로 사용됩니다.
- `meta.aliases`는 정규화와 CLI 입력을 위한 대체 id를 추가합니다.
- `meta.preferOver`는 두 채널이 모두 구성되어 있을 때 자동 활성화에서 건너뛸 채널 id를 나열합니다.
- `meta.detailLabel`과 `meta.systemImage`는 UI가 더 풍부한 채널 label/icon을 표시할 수 있게 합니다.

### 채널 onboarding hook

채널 플러그인은 `plugin.onboarding`에 선택적 onboarding hook을 정의할 수 있습니다:

- `configure(ctx)`는 기본 설정 흐름입니다.
- `configureInteractive(ctx)`는 구성됨/미구성 상태 모두에 대해 대화형 설정을 완전히 직접 제어할 수 있습니다.
- `configureWhenConfigured(ctx)`는 이미 구성된 채널에 대해서만 동작을 재정의할 수 있습니다.

wizard에서의 hook precedence:

1. `configureInteractive`(존재하는 경우)
2. `configureWhenConfigured`(채널 상태가 이미 configured일 때만)
3. 그렇지 않으면 `configure`로 fallback

컨텍스트 세부 정보:

- `configureInteractive`와 `configureWhenConfigured`는 다음을 받습니다:
  - `configured` (`true` 또는 `false`)
  - `label` (프롬프트에 사용되는 사용자 대상 채널 이름)
  - 그리고 공유되는 config/runtime/prompter/options 필드
- `"skip"`을 반환하면 selection과 account tracking은 변경되지 않습니다.
- `{ cfg, accountId? }`를 반환하면 config 업데이트가 적용되고 account selection이 기록됩니다.

### 새 메시징 채널 작성(step-by-step)

모델 provider가 아니라 **새 채팅 표면**(즉, "messaging channel")이 필요할 때
사용하세요. 모델 provider 문서는 `/providers/*` 아래에 있습니다.

1. id와 config shape를 정합니다

- 모든 채널 config는 `channels.<id>` 아래에 위치합니다.
- 멀티 계정 설정에는 `channels.<id>.accounts.<accountId>`를 우선 고려하세요.

2. 채널 metadata를 정의합니다

- `meta.label`, `meta.selectionLabel`, `meta.docsPath`, `meta.blurb`가 CLI/UI 목록을 제어합니다.
- `meta.docsPath`는 `/channels/<id>` 같은 docs 페이지를 가리켜야 합니다.
- `meta.preferOver`를 사용하면 플러그인이 다른 채널을 대체할 수 있습니다(자동 활성화가 이를 우선합니다).
- `meta.detailLabel`과 `meta.systemImage`는 UI에서 상세 텍스트/icon에 사용됩니다.

3. 필수 adapter를 구현합니다

- `config.listAccountIds` + `config.resolveAccount`
- `capabilities`(채팅 타입, 미디어, 스레드 등)
- `outbound.deliveryMode` + `outbound.sendText`(기본 전송용)

4. 필요에 따라 선택적 adapter를 추가합니다

- `setup`(wizard), `security`(DM 정책), `status`(상태/진단)
- `gateway`(start/stop/login), `mentions`, `threading`, `streaming`
- `actions`(message action), `commands`(네이티브 명령 동작)

5. 플러그인에서 채널을 등록합니다

- `api.registerChannel({ plugin })`

최소 config 예시:

```json5
{
  channels: {
    acmechat: {
      accounts: {
        default: { token: "ACME_TOKEN", enabled: true },
      },
    },
  },
}
```

최소 채널 플러그인(outbound 전용):

```ts
const plugin = {
  id: "acmechat",
  meta: {
    id: "acmechat",
    label: "AcmeChat",
    selectionLabel: "AcmeChat (API)",
    docsPath: "/channels/acmechat",
    blurb: "AcmeChat messaging channel.",
    aliases: ["acme"],
  },
  capabilities: { chatTypes: ["direct"] },
  config: {
    listAccountIds: (cfg) => Object.keys(cfg.channels?.acmechat?.accounts ?? {}),
    resolveAccount: (cfg, accountId) =>
      cfg.channels?.acmechat?.accounts?.[accountId ?? "default"] ?? {
        accountId,
      },
  },
  outbound: {
    deliveryMode: "direct",
    sendText: async ({ text }) => {
      // deliver `text` to your channel here
      return { ok: true };
    },
  },
};

export default function (api) {
  api.registerChannel({ plugin });
}
```

플러그인을 로드하고(extensions 디렉터리 또는 `plugins.load.paths`), Gateway를
재시작한 다음 config에서 `channels.<id>`를 구성하세요.

### Agent tool

전용 가이드를 참고하세요: [Plugin agent tools](/plugins/agent-tools).

### Gateway RPC 메서드 등록

```ts
export default function (api) {
  api.registerGatewayMethod("myplugin.status", ({ respond }) => {
    respond(true, { ok: true });
  });
}
```

### CLI 명령 등록

```ts
export default function (api) {
  api.registerCli(
    ({ program }) => {
      program.command("mycmd").action(() => {
        console.log("Hello");
      });
    },
    { commands: ["mycmd"] },
  );
}
```

### 자동 응답 명령 등록

플러그인은 AI 에이전트를 호출하지 않고 실행되는 사용자 지정 슬래시 명령을 등록할
수 있습니다. 이는 LLM 처리가 필요 없는 토글 명령, 상태 확인, 빠른 동작에
유용합니다.

```ts
export default function (api) {
  api.registerCommand({
    name: "mystatus",
    description: "Show plugin status",
    handler: (ctx) => ({
      text: `Plugin is running! Channel: ${ctx.channel}`,
    }),
  });
}
```

명령 handler 컨텍스트:

- `senderId`: 발신자 ID(가능한 경우)
- `channel`: 명령이 전송된 채널
- `isAuthorizedSender`: 발신자가 권한 있는 사용자인지 여부
- `args`: 명령 뒤에 전달된 인수(`acceptsArgs: true`인 경우)
- `commandBody`: 전체 명령 텍스트
- `config`: 현재 OpenClaw config

명령 옵션:

- `name`: 명령 이름(앞의 `/` 제외)
- `nativeNames`: 슬래시/메뉴 표면용 선택적 native-command 별칭. 모든 native provider에는 `default`, provider별 키에는 `discord` 같은 값을 사용합니다.
- `description`: 명령 목록에 표시되는 도움말 텍스트
- `acceptsArgs`: 명령이 인수를 받을지 여부(기본값: false). false인데 인수가 제공되면 명령은 일치하지 않고 메시지는 다른 handler로 fall through됩니다.
- `requireAuth`: 권한 있는 발신자를 요구할지 여부(기본값: true)
- `handler`: `{ text: string }`을 반환하는 함수(async 가능)

권한 및 인수를 포함한 예시:

```ts
api.registerCommand({
  name: "setmode",
  description: "Set plugin mode",
  acceptsArgs: true,
  requireAuth: true,
  handler: async (ctx) => {
    const mode = ctx.args?.trim() || "default";
    await saveMode(mode);
    return { text: `Mode set to: ${mode}` };
  },
});
```

참고:

- plugin 명령은 내장 명령과 AI 에이전트보다 **먼저** 처리됩니다
- 명령은 전역으로 등록되며 모든 채널에서 동작합니다
- 명령 이름은 대소문자를 구분하지 않습니다(`/MyStatus`는 `/mystatus`와 일치)
- 명령 이름은 문자로 시작해야 하며 문자, 숫자, 하이픈, 밑줄만 포함할 수 있습니다
- 예약된 명령 이름(`help`, `status`, `reset` 등)은 plugin이 재정의할 수 없습니다
- 플러그인 간 중복 명령 등록은 diagnostic error로 실패합니다

### 백그라운드 서비스 등록

```ts
export default function (api) {
  api.registerService({
    id: "my-service",
    start: () => api.logger.info("ready"),
    stop: () => api.logger.info("bye"),
  });
}
```

## 네이밍 규칙

- Gateway 메서드: `pluginId.action`(예: `voicecall.status`)
- 도구: `snake_case`(예: `voice_call`)
- CLI 명령: kebab 또는 camel, 단 코어 명령과 충돌은 피하세요

## Skills

플러그인은 저장소에 skill(`skills/<name>/SKILL.md`)을 포함해 배포할 수 있습니다.
`plugins.entries.<id>.enabled`(또는 다른 config gate)로 활성화하고,
워크스페이스/관리형 skills 위치에 존재하도록 하세요.

## 배포(npm)

권장 패키징:

- 메인 패키지: `openclaw`(이 저장소)
- 플러그인: `@openclaw/*` 아래의 별도 npm 패키지(예: `@openclaw/voice-call`)

퍼블리싱 계약:

- 플러그인 `package.json`에는 하나 이상의 엔트리 파일이 들어 있는 `openclaw.extensions`가 포함되어야 합니다.
- 엔트리 파일은 `.js` 또는 `.ts`일 수 있습니다(jiti가 런타임에 TS를 로드).
- `openclaw plugins install <npm-spec>`는 `npm pack`을 사용하고, `~/.openclaw/extensions/<id>/`에 압축 해제한 뒤 config에서 활성화합니다.
- Config 키 안정성: scoped package는 `plugins.entries.*`에 대해 **unscoped** id로 정규화됩니다.

## 예시 플러그인: Voice Call

이 저장소에는 voice-call 플러그인(Twilio 또는 log fallback)이 포함되어 있습니다:

- Source: `extensions/voice-call`
- Skill: `skills/voice-call`
- CLI: `openclaw voicecall start|status`
- Tool: `voice_call`
- RPC: `voicecall.start`, `voicecall.status`
- Config (twilio): `provider: "twilio"` + `twilio.accountSid/authToken/from` (선택적 `statusCallbackUrl`, `twimlUrl`)
- Config (dev): `provider: "log"` (네트워크 없음)

설정과 사용법은 [Voice Call](/plugins/voice-call) 및
`extensions/voice-call/README.md`를 참고하세요.

## 안전성 참고

플러그인은 Gateway와 같은 프로세스 안에서 실행됩니다. 신뢰할 수 있는 코드로
취급하세요:

- 신뢰하는 플러그인만 설치하세요.
- 가능하면 `plugins.allow` allowlist를 우선 사용하세요.
- 변경 후 Gateway를 재시작하세요.

## 플러그인 테스트

플러그인은 테스트를 포함할 수 있으며, 포함해야 합니다:

- 저장소 내부 플러그인은 `src/**` 아래에 Vitest 테스트를 둘 수 있습니다(예: `src/plugins/voice-call.plugin.test.ts`).
- 별도로 퍼블리시되는 플러그인은 자체 CI(lint/build/test)를 실행하고 `openclaw.extensions`가 빌드된 엔트리포인트(`dist/index.js`)를 가리키는지 검증해야 합니다.
