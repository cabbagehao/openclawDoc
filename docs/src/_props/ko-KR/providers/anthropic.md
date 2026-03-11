---
summary: "OpenClaw에서 API 키 또는 setup-token으로 Anthropic Claude 사용하기"
read_when:
  - OpenClaw에서 Anthropic 모델을 사용하고 싶을 때
  - API 키 대신 setup-token을 쓰고 싶을 때
title: "Anthropic"
x-i18n:
  source_path: "providers/anthropic.md"
---

# Anthropic (Claude)

Anthropic은 **Claude** 모델 제품군을 만들고 API를 통해 접근을 제공합니다.
OpenClaw에서는 API 키나 **setup-token**으로 인증할 수 있습니다.

## Option A: Anthropic API key

**Best for:** 표준 API 접근과 사용량 기반 과금.
Anthropic Console에서 API 키를 생성하세요.

### CLI setup

```bash
openclaw onboard
# choose: Anthropic API key

# or non-interactive
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### Config snippet

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Thinking defaults (Claude 4.6)

* Anthropic Claude 4.6 모델은 명시적인 thinking level을 설정하지 않으면 OpenClaw에서 기본적으로 `adaptive` thinking을 사용합니다.
* 메시지별(`/think:<level>`) 또는 모델 params인 `agents.defaults.models["anthropic/<model>"].params.thinking`으로 재정의할 수 있습니다.
* 관련 Anthropic 문서:
  * [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  * [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## Prompt caching (Anthropic API)

OpenClaw는 Anthropic의 prompt caching 기능을 지원합니다. 이 기능은 **API 전용**이며,
구독 인증에서는 cache 설정을 반영하지 않습니다.

### Configuration

모델 설정에서 `cacheRetention` 파라미터를 사용하세요.

| Value   | Cache Duration | Description         |
| ------- | -------------- | ------------------- |
| `none`  | No caching     | 프롬프트 캐싱 비활성화        |
| `short` | 5 minutes      | API Key 인증의 기본값     |
| `long`  | 1 hour         | 확장 캐시(beta flag 필요) |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

### Defaults

Anthropic API Key 인증을 사용할 때 OpenClaw는 모든 Anthropic 모델에
`cacheRetention: "short"`(5분 캐시)를 자동 적용합니다. 설정 파일에서
`cacheRetention`을 명시하면 이를 덮어쓸 수 있습니다.

### Per-agent cacheRetention overrides

모델 수준 params를 기본값으로 두고, 특정 agent는 `agents.list[].params`로 재정의하세요.

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" }, // baseline for most agents
        },
      },
    },
    list: [
      { id: "research", default: true },
      { id: "alerts", params: { cacheRetention: "none" } }, // override for this agent only
    ],
  },
}
```

캐시 관련 params의 config 병합 순서:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (`id`가 일치하면 키별로 덮어씀)

이렇게 하면 같은 모델을 쓰더라도 어떤 agent는 장시간 캐시를 유지하고, 다른 agent는
쓰기 비용이 아까운 burst/저재사용 트래픽을 피하기 위해 캐싱을 끌 수 있습니다.

### Bedrock Claude notes

* Bedrock의 Anthropic Claude 모델(`amazon-bedrock/*anthropic.claude*`)은 설정되어 있으면 `cacheRetention` pass-through를 허용합니다.
* Anthropic이 아닌 Bedrock 모델은 런타임에 `cacheRetention: "none"`으로 강제됩니다.
* Anthropic API-key smart default는 명시적 값이 없을 때 Claude-on-Bedrock model ref에도 `cacheRetention: "short"`를 채워 넣습니다.

### Legacy parameter

이전의 `cacheControlTtl` 파라미터도 하위 호환성을 위해 여전히 지원됩니다.

* `"5m"`는 `short`로 매핑
* `"1h"`는 `long`으로 매핑

새 `cacheRetention` 파라미터로 옮기는 것을 권장합니다.

OpenClaw는 Anthropic API 요청에 `extended-cache-ttl-2025-04-11` beta flag를 포함합니다.
provider header를 직접 재정의한다면 이를 유지하세요([/gateway/configuration](/gateway/configuration) 참고).

## 1M context window (Anthropic beta)

Anthropic의 1M context window는 beta gate 뒤에 있습니다. OpenClaw에서는 지원되는
Opus/Sonnet 모델에 `params.context1m: true`를 모델별로 설정해 활성화할 수 있습니다.

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { context1m: true },
        },
      },
    },
  },
}
```

OpenClaw는 이를 Anthropic 요청의 `anthropic-beta: context-1m-2025-08-07`로 매핑합니다.

이 기능은 해당 모델에 `params.context1m`을 명시적으로 `true`로 설정했을 때만 활성화됩니다.

요구 사항: 해당 자격 증명에서 Anthropic이 장문맥 사용을 허용해야 합니다
(보통 API 키 과금이거나, Extra Usage가 켜진 구독 계정). 그렇지 않으면 Anthropic이 다음 오류를 반환합니다.
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

참고: Anthropic은 현재 OAuth/구독 토큰(`sk-ant-oat-*`)을 사용할 때 `context-1m-*` beta 요청을 거부합니다.
OpenClaw는 OAuth 인증에서는 context1m beta header를 자동으로 건너뛰고, 필요한 OAuth beta만 유지합니다.

## Option B: Claude setup-token

**Best for:** Claude 구독을 사용할 때.

### Where to get a setup-token

Setup-token은 Anthropic Console이 아니라 **Claude Code CLI**가 생성합니다. **어떤 머신에서든**
아래 명령으로 생성할 수 있습니다.

```bash
claude setup-token
```

토큰을 OpenClaw에 붙여넣으세요(마법사: **Anthropic token (paste setup-token)**).
또는 gateway 호스트에서 다음 명령을 실행하세요.

```bash
openclaw models auth setup-token --provider anthropic
```

토큰을 다른 머신에서 생성했다면 붙여넣을 수 있습니다.

```bash
openclaw models auth paste-token --provider anthropic
```

### CLI setup (setup-token)

```bash
# Paste a setup-token during onboarding
openclaw onboard --auth-choice setup-token
```

### Config snippet (setup-token)

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Notes

* `claude setup-token`으로 setup-token을 생성해 붙여넣거나, gateway 호스트에서 `openclaw models auth setup-token`을 실행하세요.
* Claude 구독에서 “OAuth token refresh failed …”가 보이면 setup-token으로 다시 인증하세요. [/gateway/troubleshooting#oauth-token-refresh-failed-anthropic-claude-subscription](/gateway/troubleshooting#oauth-token-refresh-failed-anthropic-claude-subscription) 참고.
* 인증 세부 사항과 재사용 규칙은 [/concepts/oauth](/concepts/oauth)에 있습니다.

## Troubleshooting

**401 errors / token suddenly invalid**

* Claude 구독 인증은 만료되거나 취소될 수 있습니다. `claude setup-token`을 다시 실행한 뒤 **gateway 호스트**에 붙여넣으세요.
* Claude CLI 로그인이 다른 머신에 있다면 gateway 호스트에서 `openclaw models auth paste-token --provider anthropic`을 사용하세요.

**No API key found for provider "anthropic"**

* 인증은 **agent별**입니다. 새 agent는 메인 agent의 키를 자동 상속하지 않습니다.
* 해당 agent에 대해 온보딩을 다시 실행하거나, gateway 호스트에 setup-token/API 키를 붙여넣은 뒤 `openclaw models status`로 확인하세요.
