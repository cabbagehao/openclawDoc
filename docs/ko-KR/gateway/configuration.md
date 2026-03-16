---
description: "OpenClaw 설정의 공통 작업, 빠른 시작 방법, 주요 패턴과 상세 레퍼런스 연결을 정리한 가이드"
summary: "OpenClaw 설정 개요, 빠른 시작, 주요 패턴, 세부 레퍼런스 연결을 정리한 가이드"
read_when:
  - OpenClaw 시스템을 처음으로 구축하고 설정할 때
  - 일반적인 설정 패턴이나 구성 사례를 찾고자 할 때
  - 특정 설정 섹션의 상세 내용을 확인하고 싶을 때
title: "설정"
x-i18n:
  source_path: "gateway/configuration.md"
---

# 설정

OpenClaw는 `~/.openclaw/openclaw.json` 경로에서 선택적으로 <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> 형식의 설정을 읽습니다.

파일이 없으면 OpenClaw는 안전한 기본값으로 동작합니다. config를 추가하는 대표적인 이유는 다음과 같습니다.

- 채널을 연결하고 누가 봇에 메시지를 보낼 수 있는지 제어하기
- 모델, 도구, sandboxing, 자동화(cron, hooks) 설정하기
- 세션, 미디어, 네트워킹, UI 동작을 조정하기

사용 가능한 모든 필드는 [전체 레퍼런스](/gateway/configuration-reference)에서 확인할 수 있습니다.

<Tip>
**설정이 처음이라면** `openclaw onboard`로 대화형 설정을 시작하거나, 바로 복사해 쓸 수 있는 [Configuration Examples](/gateway/configuration-examples)를 먼저 확인하세요.
</Tip>

## 최소 구성 예시

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+821012345678"] } },
}
```

## 설정 편집 방법

<Tabs>
  <Tab title="대화형 마법사">
    ```bash
    openclaw onboard       # full setup wizard
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (단일 명령)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset tools.web.search.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    [http://127.0.0.1:18789](http://127.0.0.1:18789)을 열고 **Config** 탭을 사용하세요.
    Control UI는 config schema 기반 폼과, 예외 상황을 위한 **Raw JSON** 편집기를 함께 제공합니다.
  </Tab>
  <Tab title="직접 편집">
    `~/.openclaw/openclaw.json`을 직접 수정하세요. Gateway는 파일 변경을 감시하고 대부분의 변경을 자동 적용합니다. 자세한 내용은 [Config hot reload](#config-hot-reload)를 참고하세요.
  </Tab>
</Tabs>

## 엄격한 스키마 검증

<Warning>
OpenClaw는 schema와 완전히 일치하는 config만 허용합니다. 알 수 없는 키, 잘못된 타입, 유효하지 않은 값이 있으면 Gateway는 **시작을 거부**합니다. 루트 레벨의 유일한 예외는 에디터용 JSON Schema 메타데이터를 위한 `$schema`(string)입니다.
</Warning>

검증에 실패하면:
- Gateway가 시작되지 않습니다.
- 진단 명령만 동작합니다(`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`).
- `openclaw doctor`로 정확한 문제를 확인하세요.
- `openclaw doctor --fix` 또는 `--yes`로 자동 수정을 적용할 수 있습니다.

## 주요 작업 가이드

<AccordionGroup>
  <Accordion title="채팅 채널 설정 (WhatsApp, Telegram, Discord 등)">
    각 채널은 `channels.<provider>` 하위에 독립된 설정 섹션을 가짐. 상세 설정 단계는 채널별 전용 페이지를 참조함:

    - [WhatsApp](/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/channels/telegram) — `channels.telegram`
    - [Discord](/channels/discord) — `channels.discord`
    - [Slack](/channels/slack) — `channels.slack`
    - [Signal](/channels/signal) — `channels.signal`
    - [iMessage](/channels/imessage) — `channels.imessage`
    - [Google Chat](/channels/googlechat) — `channels.googlechat`
    - [Mattermost](/channels/mattermost) — `channels.mattermost`
    - [MS Teams](/channels/msteams) — `channels.msteams`

    모든 채널은 같은 DM 정책 패턴을 공유합니다:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="모델 선택 및 구성">
    기본 모델과 선택적 fallback을 설정합니다:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-5",
            fallbacks: ["openai/gpt-5.2"],
          },
          models: {
            "anthropic/claude-sonnet-4-5": { alias: "Sonnet" },
            "openai/gpt-5.2": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models`는 가용 모델 카탈로그를 정의하며 `/model` 명령어의 허용 목록(Allowlist) 역할을 수행함.
    - 모델 참조는 `공급자/모델ID` 형식을 사용함 (예: `anthropic/claude-3-5-sonnet-latest`).
    - `agents.defaults.imageMaxDimensionPx`는 이미지 전송 시의 축소 배율을 조절함 (기본값 `1200`). 값을 낮추면 스크린샷 위주의 작업 시 비전 토큰 소비를 줄일 수 있음.
    - 상세 정보: [모델 CLI](/concepts/models), [모델 장애 조치 규칙](/concepts/model-failover).
    - 커스텀 또는 자체 호스팅 공급자 연동: 레퍼런스의 [커스텀 공급자](/gateway/configuration-reference#custom-providers-and-base-urls) 섹션 참조.

  </Accordion>

  <Accordion title="접근 권한 제어 (DM 및 그룹)">
    개인 대화(DM) 접근은 채널별 `dmPolicy` 설정을 통해 제어함:

    - **`"pairing"`** (기본값): 새로운 발신자에게 일회성 페어링 코드를 발송하고 승인을 대기함.
    - **`"allowlist"`**: `allowFrom` 목록에 등록된 사용자만 허용함.
    - **`"open"`**: 모든 발신자의 DM 수락 (`allowFrom: ["*"]` 설정 필수).
    - **`"disabled"`**: 모든 수신 DM을 무시함.

    그룹 대화의 경우 `groupPolicy` 및 `groupAllowFrom` 설정을 통해 제어함.

    상세 내용: [전체 레퍼런스의 DM 및 그룹 접근 제어](/gateway/configuration-reference#dm-and-group-access).

  </Accordion>

  <Accordion title="그룹 대화 멘션 게이팅 설정">
    그룹 메시지는 기본적으로 **멘션 시에만 응답**하도록 설정되어 있음. 에이전트별 멘션 패턴을 구성함:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **메타데이터 멘션**: 네이티브 @멘션 (WhatsApp 선택 멘션, Telegram @bot 등) 감지.
    - **텍스트 패턴**: `mentionPatterns`에 정의된 정규표현식 감지.
    - 상세 내용: [전체 레퍼런스의 그룹 멘션 게이팅](/gateway/configuration-reference#group-chat-mention-gating).

  </Accordion>

  <Accordion title="세션 관리 및 초기화">
    세션은 대화의 연속성 유지와 데이터 격리를 담당함:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommended for multi-user
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - **`dmScope`**: `main` (공유) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`.
    - **`threadBindings`**: 스레드 기반 세션 라우팅의 전역 기본값 (Discord의 `/focus`, `/unfocus` 등과 연동).
    - 상세 정보: [세션 관리 개념](/concepts/session), [세션 설정 레퍼런스](/gateway/configuration-reference#session).

  </Accordion>

  <Accordion title="샌드박싱(Sandboxing) 활성화">
    에이전트 세션을 격리된 Docker 컨테이너 내에서 안전하게 실행함:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    사전 준비: `scripts/sandbox-setup.sh` 스크립트를 통해 이미지를 먼저 빌드해야 함.

    상세 가이드: [샌드박싱](/gateway/sandboxing), [샌드박스 설정 레퍼런스](/gateway/configuration-reference#sandbox).

  </Accordion>

  <Accordion title="하트비트 (주기적 자율 점검) 설정">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - **`every`**: 실행 간격 (예: `30m`, `2h`). 비활성화 시 `0m` 설정.
    - **`target`**: 응답을 보낼 대상 채널 (`last`, `whatsapp`, `telegram`, `discord`, `none`).
    - **`directPolicy`**: DM 형태의 하트비트 대상에 대해 `allow` (기본값) 또는 `block` 지정.
    - 상세 가이드: [하트비트](/gateway/heartbeat).

  </Accordion>

  <Accordion title="크론(Cron) 예약 작업 구성">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - **`sessionRetention`**: 완료된 격리 세션을 `sessions.json`에서 제거함 (기본값 `24h`, 비활성화 시 `false`).
    - **`runLog`**: 개별 작업 로그 파일의 용량 및 보관 라인 수 관리.
    - 상세 정보: [크론 작업 개요](/automation/cron-jobs).

  </Accordion>

  <Accordion title="웹훅(Webhooks) 엔드포인트 구성">
    Gateway에서 외부 요청을 수신할 HTTP 웹훅 엔드포인트를 활성화함:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    보안 주의 사항:
    - 웹훅 페이로드 내용은 항상 '신뢰할 수 없는 입력값'으로 간주함.
    - 디버깅 목적이 아니라면 안전 경계 우회 플래그(`allowUnsafeExternalContent`)는 반드시 비활성화함.
    - 웹훅 전용 에이전트에는 성능이 우수한 최신 모델 사용과 엄격한 도구 정책(샌드박싱 등) 적용을 권장함.

    상세 레퍼런스: [웹훅 매핑 및 Gmail 통합](/gateway/configuration-reference#hooks).

  </Accordion>

  <Accordion title="멀티 에이전트 라우팅 설정">
    서로 다른 워크스페이스와 세션을 가진 여러 명의 격리된 에이전트를 동시에 운영함:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    상세 내용: [멀티 에이전트 개념](/concepts/multi-agent), [라우팅 바인딩 레퍼런스](/gateway/configuration-reference#multi-agent-routing).

  </Accordion>

  <Accordion title="설정 파일 분리 및 포함 ($include)">
    `$include` 지시어를 사용하여 비대해진 설정 파일을 체계적으로 관리함:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **단일 파일**: 해당 객체 전체를 파일 내용으로 대체함.
    - **파일 배열**: 명시된 순서대로 깊은 병합(Deep-merge)을 수행함 (나중에 선언된 파일이 우선).
    - **형제 키(Sibling keys)**: 포함된 파일의 내용과 병합되며, 파일 내의 값을 오버라이드함.
    - **중첩 지원**: 최대 10단계까지 포함 관계를 형성할 수 있음.
    - **상대 경로**: 인클루드를 선언한 상위 파일을 기준으로 경로를 해석함.
    - **오류 처리**: 누락된 파일, 파싱 오류, 순환 include에 대해 명확한 오류를 반환함.

  </Accordion>
</AccordionGroup>

## Config hot reload

Gateway는 `~/.openclaw/openclaw.json`을 감시하고 대부분의 설정을 자동으로 반영합니다. 대다수 변경에는 수동 재시작이 필요하지 않습니다.

### Reload modes

| 모드 (`gateway.reload.mode`) | 동작 설명 |
| :--- | :--- |
| **`hybrid`** (기본값) | 안전한 변경 사항은 즉시 반영하고, 필수 재시작 항목은 자동으로 서버를 재시작함. |
| **`hot`** | 즉시 반영 가능한 안전한 변경 사항만 처리함. 재시작이 필요한 경우 로그로 안내함. |
| **`restart`** | 설정 변경 감지 시 내용의 안전 여부와 관계없이 항상 서버를 재시작함. |
| **`off`** | 파일 감시 기능을 끔. 수동으로 재시작할 때까지 변경 사항이 반영되지 않음. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### What hot-applies vs what needs a restart

대부분의 기능 설정은 다운타임 없이 즉시 적용됨. `hybrid` 모드에서는 재시작이 필요한 항목 변경 시 시스템이 자동으로 대응함.

| 카테고리 | 대상 필드 | 재시작 필요 여부 |
| :--- | :--- | :---: |
| **채널 관리** | `channels.*`, `web` (WhatsApp) — 모든 내장 및 확장 채널 | **아니오** |
| **에이전트 및 모델** | `agent`, `agents`, `models`, `routing` | **아니오** |
| **자동화** | `hooks`, `cron`, `agent.heartbeat` | **아니오** |
| **세션 및 메시징** | `session`, `messages` | **아니오** |
| **도구 및 미디어** | `tools`, `browser`, `skills`, `audio`, `talk` | **아니오** |
| **UI 및 기타** | `ui`, `logging`, `identity`, `bindings` | **아니오** |
| **Gateway 코어** | `gateway.*` (포트, 바인딩, 인증, TLS, HTTP 설정 등) | **예** |
| **인프라** | `discovery`, `canvasHost`, `plugins` | **예** |

<Note>
`gateway.reload`와 `gateway.remote`는 예외이며, 값을 바꿔도 의도적으로 재시작을 트리거하지 않습니다.
</Note>

## 설정 RPC (프로그래밍 방식 업데이트)

<Note>
제어 플레인 쓰기 RPC(`config.apply`, `config.patch`, `update.run`)는 `deviceId+clientIp` 기준 **60초당 3회**로 제한됩니다. 제한되면 `retryAfterMs`와 함께 `UNAVAILABLE`을 반환합니다.
</Note>

<AccordionGroup>
  <Accordion title="config.apply (전체 교체)">
    전체 config를 검증하고 기록한 뒤 Gateway를 재시작합니다.

    <Warning>
    `config.apply`는 **config 전체를 교체**합니다. 일부 키만 바꾸려면 `config.patch` 또는 `openclaw config set`을 사용하세요.
    </Warning>

    파라미터:
    - `raw` (string): 전체 config를 담은 JSON5 payload
    - `baseHash` (optional): `config.get`에서 받은 config hash
    - `sessionKey` (optional): 재시작 후 wake-up ping을 보낼 session key
    - `note` (optional): restart sentinel에 남길 note
    - `restartDelayMs` (optional): 재시작 전 대기 시간(기본값 2000)

    이미 재시작이 대기 중이거나 진행 중이면 요청은 coalesce되며, 재시작 사이에는 30초 cooldown이 적용됩니다.

    ```bash
    openclaw gateway call config.get --params '{}'  # capture payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:dm:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (부분 업데이트)">
    기존 config에 부분 변경을 병합합니다(JSON merge patch semantics).
    - Objects merge recursively
    - `null` deletes a key
    - Arrays replace

    파라미터:
    - `raw` (string): 변경할 키만 담은 JSON5
    - `baseHash` (required): `config.get`에서 받은 config hash
    - `sessionKey`, `note`, `restartDelayMs`: `config.apply`와 동일

    재시작 동작도 `config.apply`와 같습니다. 대기 중 재시작은 coalesce되며, 재시작 사이에는 30초 cooldown이 적용됩니다.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## 환경 변수 활용

OpenClaw는 부모 프로세스의 환경 변수와 함께 다음도 읽습니다.
- 현재 작업 디렉터리의 `.env`(있다면)
- **`~/.openclaw/.env`** (전역 fallback)

이 두 파일은 이미 설정된 환경 변수를 덮어쓰지 않습니다. config 안에 직접 env var를 넣을 수도 있습니다.

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="셸 환경 변수 가져오기 (Shell env import)">
  필요한 키가 비어 있으면 사용자의 로그인 shell을 실행해 누락된 키만 가져올 수 있습니다:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```
Env var equivalent: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="설정값 내 환경 변수 치환">
  config의 모든 string 값에서 `${VAR_NAME}`로 env var를 참조할 수 있습니다:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

**규칙:**
- 대문자, 숫자, 언더바 조합만 지원: `[A-Z_][A-Z0-9_]*`.
- 변수가 없거나 비어 있으면 로드 시점에 오류를 발생시킴.
- 리터럴 문자열로 출력하려면 `$${VAR}` 형식을 사용함.
- `$include` 파일 안에서도 동작함.
- 인라인 치환 지원: `"${BASE_URL}/v1"` → `"https://api.example.com/v1"`.
</Accordion>

<Accordion title="시크릿 참조 (SecretRef: env, file, exec)">
  SecretRef object를 지원하는 필드에는 다음처럼 env, file, exec 소스를 사용할 수 있습니다:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "nano-banana-pro": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/nano-banana-pro/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

SecretRef 세부 사항(`env`/`file`/`exec`용 `secrets.providers` 포함)은 [Secrets Management](/gateway/secrets)에서 다룹니다.
지원되는 credential 경로는 [SecretRef Credential Surface](/reference/secretref-credential-surface)에 정리돼 있습니다.
</Accordion>

우선순위와 전체 source 목록은 [Environment](/help/environment)를 참고하세요.

## 전체 레퍼런스

완전한 필드별 레퍼런스는 **[Configuration Reference](/gateway/configuration-reference)**에서 확인할 수 있습니다.

---

_Related: [Configuration Examples](/gateway/configuration-examples) · [Configuration Reference](/gateway/configuration-reference) · [Doctor](/gateway/doctor)_
