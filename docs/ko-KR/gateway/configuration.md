---
summary: "설정 개요: 일반적인 작업, 빠른 설정, 전체 레퍼런스로 가는 링크"
read_when:
  - OpenClaw를 처음 설정할 때
  - 일반적인 설정 패턴을 찾고 있을 때
  - 특정 설정 섹션으로 이동할 때
title: "설정"
---

# 설정

OpenClaw는 `~/.openclaw/openclaw.json`에서 선택적인 <Tooltip tip="JSON5는 주석과 trailing comma를 지원합니다">**JSON5**</Tooltip> 설정을 읽습니다.

파일이 없으면 OpenClaw는 안전한 기본값을 사용합니다. 설정을 추가하는 일반적인 이유는 다음과 같습니다.

- 채널을 연결하고 누가 봇에게 메시지를 보낼 수 있는지 제어
- 모델, 도구, 샌드박싱, 자동화(cron, hooks) 설정
- 세션, 미디어, 네트워킹, UI 조정

사용 가능한 모든 필드는 [전체 레퍼런스](/gateway/configuration-reference)를 참고하세요.

<Tip>
**설정이 처음인가요?** 대화형 설정을 위해 `openclaw onboard`로 시작하거나, 완전한 복붙용 설정을 담은 [Configuration Examples](/gateway/configuration-examples) 가이드를 확인하세요.
</Tip>

## 최소 설정

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## 설정 편집

<Tabs>
  <Tab title="대화형 마법사">
    ```bash
    openclaw onboard       # 전체 설정 마법사
    openclaw configure     # 설정 마법사
    ```
  </Tab>
  <Tab title="CLI (원라이너)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset tools.web.search.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    [http://127.0.0.1:18789](http://127.0.0.1:18789)를 열고 **Config** 탭을 사용하세요.
    Control UI는 config schema에서 폼을 렌더링하며, 탈출구로 **Raw JSON** 편집기도 제공합니다.
  </Tab>
  <Tab title="직접 편집">
    `~/.openclaw/openclaw.json`을 직접 편집하세요. Gateway는 파일을 감시하고 자동으로 변경 사항을 적용합니다([hot reload](#config-hot-reload) 참고).
  </Tab>
</Tabs>

## 엄격한 검증

<Warning>
OpenClaw는 schema와 완전히 일치하는 설정만 허용합니다. 알 수 없는 키, 잘못된 타입, 유효하지 않은 값이 있으면 Gateway는 **시작을 거부**합니다. 루트 레벨의 유일한 예외는 편집기가 JSON Schema 메타데이터를 붙일 수 있도록 하는 `$schema` (string)입니다.
</Warning>

검증에 실패하면:

- Gateway가 부팅되지 않음
- 진단 명령만 동작함 (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- 정확한 문제를 보려면 `openclaw doctor` 실행
- 수정을 적용하려면 `openclaw doctor --fix` (또는 `--yes`) 실행

## 일반적인 작업

<AccordionGroup>
  <Accordion title="채널 설정하기 (WhatsApp, Telegram, Discord 등)">
    각 채널은 `channels.<provider>` 아래에 자체 설정 섹션을 가집니다. 설정 단계는 전용 채널 페이지를 참고하세요.

    - [WhatsApp](/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/channels/telegram) — `channels.telegram`
    - [Discord](/channels/discord) — `channels.discord`
    - [Slack](/channels/slack) — `channels.slack`
    - [Signal](/channels/signal) — `channels.signal`
    - [iMessage](/channels/imessage) — `channels.imessage`
    - [Google Chat](/channels/googlechat) — `channels.googlechat`
    - [Mattermost](/channels/mattermost) — `channels.mattermost`
    - [MS Teams](/channels/msteams) — `channels.msteams`

    모든 채널은 동일한 DM 정책 패턴을 공유합니다.

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

  <Accordion title="모델 선택 및 설정">
    기본 모델과 선택적 fallback을 설정하세요.

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

    - `agents.defaults.models`는 모델 카탈로그를 정의하며 `/model`의 allowlist 역할을 합니다.
    - 모델 ref는 `provider/model` 형식을 사용합니다(예: `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx`는 transcript/tool 이미지 downscaling을 제어합니다(기본값 `1200`). 값을 낮추면 보통 스크린샷이 많은 실행에서 vision token 사용량이 줄어듭니다.
    - 채팅에서 모델을 전환하려면 [Models CLI](/concepts/models), 인증 로테이션과 fallback 동작은 [Model Failover](/concepts/model-failover)를 참고하세요.
    - 커스텀/self-hosted provider는 레퍼런스의 [Custom providers](/gateway/configuration-reference#custom-providers-and-base-urls)를 참고하세요.

  </Accordion>

  <Accordion title="누가 봇에게 메시지할 수 있는지 제어">
    DM 접근은 채널별 `dmPolicy`로 제어됩니다.

    - `"pairing"` (기본값): 알 수 없는 발신자는 승인용 일회성 pairing code를 받음
    - `"allowlist"`: `allowFrom`에 있거나 pair된 allow store에 있는 발신자만 허용
    - `"open"`: 모든 inbound DM 허용 (`allowFrom: ["*"]` 필요)
    - `"disabled"`: 모든 DM 무시

    그룹에는 `groupPolicy` + `groupAllowFrom` 또는 채널별 allowlist를 사용하세요.

    채널별 상세 내용은 [전체 레퍼런스](/gateway/configuration-reference#dm-and-group-access)를 참고하세요.

  </Accordion>

  <Accordion title="그룹 채팅 mention gating 설정">
    그룹 메시지는 기본적으로 **mention 필요**입니다. 에이전트별 패턴을 설정하세요.

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

    - **Metadata mention**: 네이티브 @-mention (WhatsApp tap-to-mention, Telegram @bot 등)
    - **텍스트 패턴**: `mentionPatterns`의 regex 패턴
    - 채널별 override와 self-chat mode는 [전체 레퍼런스](/gateway/configuration-reference#group-chat-mention-gating)를 참고하세요.

  </Accordion>

  <Accordion title="세션과 reset 설정">
    세션은 대화 연속성과 격리를 제어합니다.

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

    - `dmScope`: `main` (공유) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: 스레드 바운드 세션 라우팅을 위한 전역 기본값(Discord는 `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`를 지원).
    - 스코프, identity link, send policy는 [Session Management](/concepts/session)를 참고하세요.
    - 모든 필드는 [전체 레퍼런스](/gateway/configuration-reference#session)를 참고하세요.

  </Accordion>

  <Accordion title="샌드박싱 활성화">
    격리된 Docker 컨테이너에서 에이전트 세션을 실행합니다.

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

    먼저 이미지를 빌드하세요: `scripts/sandbox-setup.sh`

    전체 가이드는 [Sandboxing](/gateway/sandboxing), 모든 옵션은 [전체 레퍼런스](/gateway/configuration-reference#sandbox)를 참고하세요.

  </Accordion>

  <Accordion title="heartbeat 설정 (주기적 체크인)">
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

    - `every`: duration string (`30m`, `2h`). 비활성화하려면 `0m` 설정.
    - `target`: `last` | `whatsapp` | `telegram` | `discord` | `none`
    - `directPolicy`: DM 스타일 heartbeat target에 대해 `allow` (기본값) 또는 `block`
    - 전체 가이드는 [Heartbeat](/gateway/heartbeat)를 참고하세요.

  </Accordion>

  <Accordion title="cron job 설정">
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

    - `sessionRetention`: 완료된 격리 실행 세션을 `sessions.json`에서 정리합니다(기본값 `24h`; 비활성화하려면 `false` 설정).
    - `runLog`: `cron/runs/<jobId>.jsonl`을 크기와 유지할 줄 수 기준으로 정리합니다.
    - 기능 개요와 CLI 예시는 [Cron jobs](/automation/cron-jobs)를 참고하세요.

  </Accordion>

  <Accordion title="webhook 설정 (hooks)">
    Gateway에서 HTTP webhook endpoint를 활성화합니다.

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

    보안 참고:
    - 모든 hook/webhook payload 콘텐츠는 신뢰할 수 없는 입력으로 취급하세요.
    - 좁은 범위의 디버깅을 수행하는 경우가 아니라면 unsafe-content bypass 플래그(`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`)는 비활성화된 상태로 유지하세요.
    - hook 기반 에이전트에는 강력한 최신 모델 tier와 엄격한 tool policy를 우선 적용하세요(예: 가능하다면 messaging-only + sandboxing).

    모든 mapping 옵션과 Gmail 통합은 [전체 레퍼런스](/gateway/configuration-reference#hooks)를 참고하세요.

  </Accordion>

  <Accordion title="멀티 에이전트 라우팅 설정">
    별도 workspace와 세션을 가진 여러 개의 격리된 에이전트를 실행합니다.

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

    바인딩 규칙과 에이전트별 접근 프로필은 [Multi-Agent](/concepts/multi-agent)와 [전체 레퍼런스](/gateway/configuration-reference#multi-agent-routing)를 참고하세요.

  </Accordion>

  <Accordion title="설정을 여러 파일로 분리하기 ($include)">
    큰 설정은 `$include`를 사용해 구성하세요.

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

    - **단일 파일**: 포함하는 객체를 대체
    - **파일 배열**: 순서대로 deep-merge됨 (나중 값이 우선)
    - **형제 키**: include 이후 병합됨 (포함된 값을 override)
    - **중첩 include**: 최대 10단계까지 지원
    - **상대 경로**: include한 파일 기준으로 해석
    - **오류 처리**: 누락 파일, parse 오류, 순환 include에 대해 명확한 오류 제공

  </Accordion>
</AccordionGroup>

## Config hot reload

Gateway는 `~/.openclaw/openclaw.json`을 감시하고 자동으로 변경 사항을 적용합니다. 대부분의 설정은 수동 재시작이 필요하지 않습니다.

### Reload 모드

| 모드                  | 동작                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------------- |
| **`hybrid`** (기본값) | 안전한 변경은 즉시 hot-apply합니다. 중요한 변경은 자동으로 재시작합니다.                  |
| **`hot`**             | 안전한 변경만 hot-apply합니다. 재시작이 필요할 때 경고를 기록하고 처리는 사용자가 합니다. |
| **`restart`**         | 안전 여부와 관계없이 모든 설정 변경 시 Gateway를 재시작합니다.                            |
| **`off`**             | 파일 감시를 비활성화합니다. 변경은 다음 수동 재시작 때 적용됩니다.                        |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### hot-apply되는 항목과 재시작이 필요한 항목

대부분의 필드는 다운타임 없이 hot-apply됩니다. `hybrid` 모드에서는 재시작이 필요한 변경도 자동으로 처리됩니다.

| Category            | Fields                                                           | Restart needed? |
| ------------------- | ---------------------------------------------------------------- | --------------- |
| Channels            | `channels.*`, `web` (WhatsApp) — 모든 built-in 및 extension 채널 | No              |
| Agent & models      | `agent`, `agents`, `models`, `routing`                           | No              |
| Automation          | `hooks`, `cron`, `agent.heartbeat`                               | No              |
| Sessions & messages | `session`, `messages`                                            | No              |
| Tools & media       | `tools`, `browser`, `skills`, `audio`, `talk`                    | No              |
| UI & misc           | `ui`, `logging`, `identity`, `bindings`                          | No              |
| Gateway server      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)             | **Yes**         |
| Infrastructure      | `discovery`, `canvasHost`, `plugins`                             | **Yes**         |

<Note>
`gateway.reload`와 `gateway.remote`는 예외입니다. 이 값을 바꿔도 **재시작이 트리거되지 않습니다**.
</Note>

## Config RPC (프로그래밍 방식 업데이트)

<Note>
Control-plane write RPC(`config.apply`, `config.patch`, `update.run`)는 `deviceId+clientIp`당 **60초에 3회 요청**으로 rate-limit됩니다. 제한에 걸리면 RPC는 `retryAfterMs`와 함께 `UNAVAILABLE`을 반환합니다.
</Note>

<AccordionGroup>
  <Accordion title="config.apply (전체 교체)">
    전체 config를 검증하고 쓰고 Gateway를 한 번에 재시작합니다.

    <Warning>
    `config.apply`는 **전체 config**를 교체합니다. 부분 업데이트에는 `config.patch`, 단일 키에는 `openclaw config set`을 사용하세요.
    </Warning>

    Params:

    - `raw` (string) — 전체 config에 대한 JSON5 payload
    - `baseHash` (optional) — `config.get`에서 받은 config hash (config가 존재하면 필수)
    - `sessionKey` (optional) — 재시작 후 wake-up ping을 위한 session key
    - `note` (optional) — restart sentinel용 note
    - `restartDelayMs` (optional) — 재시작 전 지연 시간 (기본값 2000)

    재시작 요청은 이미 보류/진행 중인 요청이 있으면 coalesced되며, 재시작 사이클 사이에는 30초 cooldown이 적용됩니다.

    ```bash
    openclaw gateway call config.get --params '{}'  # payload.hash 캡처
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:dm:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (부분 업데이트)">
    기존 config에 부분 업데이트를 병합합니다(JSON merge patch 의미론).

    - 객체는 재귀적으로 병합
    - `null`은 키를 삭제
    - 배열은 교체

    Params:

    - `raw` (string) — 변경할 키만 담은 JSON5
    - `baseHash` (required) — `config.get`에서 받은 config hash
    - `sessionKey`, `note`, `restartDelayMs` — `config.apply`와 동일

    재시작 동작은 `config.apply`와 같습니다. 보류 중 재시작은 coalesced되고, 재시작 사이클 사이에는 30초 cooldown이 적용됩니다.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## 환경 변수

OpenClaw는 부모 프로세스의 env var와 함께 다음도 읽습니다.

- 현재 작업 디렉터리의 `.env` (있다면)
- `~/.openclaw/.env` (전역 fallback)

두 파일 모두 기존 env var를 override하지 않습니다. config에서 inline env var를 설정할 수도 있습니다.

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell env import (선택 사항)">
  이 기능을 활성화했고 필요한 키가 설정되어 있지 않으면, OpenClaw는 로그인 shell을 실행해 누락된 키만 가져옵니다.

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Env var equivalent: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="config 값의 env var substitution">
  모든 config string 값에서 `${VAR_NAME}`으로 env var를 참조할 수 있습니다.

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

규칙:

- 대문자 이름만 매칭됨: `[A-Z_][A-Z0-9_]*`
- 누락되었거나 비어 있는 변수는 로드 시 오류를 발생시킴
- 리터럴 출력은 `$${VAR}`로 escape
- `$include` 파일 안에서도 동작
- inline substitution: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs (env, file, exec)">
  SecretRef object를 지원하는 필드에서는 다음을 사용할 수 있습니다.

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

`env`/`file`/`exec`용 `secrets.providers`를 포함한 SecretRef 상세 내용은 [Secrets Management](/gateway/secrets)에 있습니다.
지원되는 credential 경로는 [SecretRef Credential Surface](/reference/secretref-credential-surface)에 정리되어 있습니다.
</Accordion>

전체 우선순위와 source는 [Environment](/help/environment)를 참고하세요.

## 전체 레퍼런스

필드별 완전한 레퍼런스는 **[Configuration Reference](/gateway/configuration-reference)** 를 참고하세요.

---

_관련 문서: [Configuration Examples](/gateway/configuration-examples) · [Configuration Reference](/gateway/configuration-reference) · [Doctor](/gateway/doctor)_
