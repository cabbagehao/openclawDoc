---
summary: "OpenClaw가 프롬프트 컨텍스트를 구성하고 token usage와 costs를 보고하는 방식"
read_when:
  - token usage, costs, context window를 설명할 때
  - context 증가나 compaction 동작을 디버깅할 때
title: "Token Use and Costs"
---

# Token use & costs

OpenClaw는 **문자 수가 아니라 token**을 추적합니다. token은 모델마다 다르지만, 대부분의 OpenAI 스타일 모델은 영어 기준으로 토큰당 평균 약 4자입니다.

## How the system prompt is built

OpenClaw는 매 실행마다 자체 system prompt를 조립합니다. 포함되는 항목:

- Tool 목록 + 짧은 설명
- Skills 목록(메타데이터만 포함, 실제 지시는 필요 시 `read`로 로드)
- Self-update instructions
- Workspace + bootstrap 파일(`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, 새로 생성 시 `BOOTSTRAP.md`, 그리고 존재할 경우 `MEMORY.md` 및/또는 `memory.md`)
  큰 파일은 `agents.defaults.bootstrapMaxChars`(기본값: 20000)로 잘리고, 전체 bootstrap 주입은 `agents.defaults.bootstrapTotalMaxChars`(기본값: 150000)로 제한됩니다.
  `memory/*.md` 파일은 memory tool을 통해 필요 시 로드되며 자동 주입되지 않습니다.
- 시간(UTC + 사용자 timezone)
- Reply tag + heartbeat 동작
- 런타임 metadata(host/OS/model/thinking)

전체 구성은 [System Prompt](/concepts/system-prompt)에서 확인하세요.

## What counts in the context window

모델이 받는 모든 항목이 컨텍스트 한도에 포함됩니다.

- System prompt(위 모든 섹션)
- 대화 history(user + assistant 메시지)
- Tool call과 tool result
- 첨부 파일/전사(images, audio, files)
- Compaction summary와 pruning artifact
- Provider wrapper나 safety header(보이지 않아도 카운트됨)

이미지의 경우 OpenClaw는 provider 호출 전에 transcript/tool image payload를 축소합니다.
`agents.defaults.imageMaxDimensionPx`(기본값: `1200`)로 조정할 수 있습니다.

- 값을 낮추면 보통 vision-token 사용량과 payload 크기가 줄어듭니다.
- 값을 높이면 OCR/UI 중심 스크린샷에서 시각적 세부 정보가 더 잘 보존됩니다.

주입 파일별, tools, skills, system prompt 크기별 실전 분해는 `/context list` 또는 `/context detail`로 확인하세요. 자세한 내용은 [Context](/concepts/context)를 참고하세요.

## How to see current token usage

채팅에서 다음 명령을 사용합니다.

- `/status` → 세션 모델, context usage, 마지막 응답의 input/output token, **추정 비용**(API key 전용)을 보여주는 **이모지 풍부한 상태 카드**
- `/usage off|tokens|full` → 모든 응답에 **응답별 usage footer**를 붙입니다.
  - 세션별로 유지되며 `responseUsage`로 저장됩니다.
  - OAuth auth에서는 **비용을 숨기고** token만 표시합니다.
- `/usage cost` → OpenClaw session log를 기반으로 한 로컬 비용 요약을 보여줍니다.

기타 표면:

- **TUI/Web TUI:** `/status`, `/usage` 모두 지원
- **CLI:** `openclaw status --usage`, `openclaw channels list`는 provider quota window를 보여줍니다.
  응답별 비용은 아닙니다.

## Cost estimation (when shown)

비용은 모델 가격 설정을 기반으로 추정됩니다.

```
models.providers.<provider>.models[].cost
```

이 값은 `input`, `output`, `cacheRead`, `cacheWrite` 각각에 대한 **1M token당 USD**입니다. 가격 정보가 없으면 OpenClaw는 token만 표시합니다. OAuth token은 달러 비용을 절대 표시하지 않습니다.

## Cache TTL and pruning impact

provider 프롬프트 캐싱은 cache TTL 창 안에서만 적용됩니다. OpenClaw는 선택적으로 **cache-ttl pruning**을 실행할 수 있습니다. TTL이 지난 뒤 세션을 prune하고 cache 창을 재설정하여, 이후 요청이 전체 history를 다시 캐시하는 대신 새로 캐시된 컨텍스트를 재사용하게 합니다. 이렇게 하면 세션이 TTL보다 오래 유휴 상태였을 때 cache write 비용을 낮출 수 있습니다.

설정은 [Gateway configuration](/gateway/configuration)에서 할 수 있고, 세부 동작은 [Session pruning](/concepts/session-pruning)에서 확인하세요.

Heartbeat는 유휴 구간 사이에서도 cache를 **warm** 상태로 유지할 수 있습니다. 모델 cache TTL이 `1h`라면, heartbeat 간격을 그보다 약간 짧게(예: `55m`) 설정하면 전체 프롬프트를 다시 캐시하지 않아도 되어 cache write 비용을 줄일 수 있습니다.

multi-agent 구성에서는 공유 model config 하나를 유지한 채 `agents.list[].params.cacheRetention`으로 agent별 cache 동작을 조정할 수 있습니다.

설정 항목별 전체 가이드는 [Prompt Caching](/reference/prompt-caching)을 참고하세요.

Anthropic API 가격 정책에서는 cache read가 input token보다 훨씬 저렴하고, cache write는 더 높은 계수로 과금됩니다. 최신 요율과 TTL 배수는 Anthropic 문서를 확인하세요:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Example: keep 1h cache warm with heartbeat

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### Example: mixed traffic with per-agent cache strategy

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # 대부분의 agent용 기본 baseline
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # 깊은 세션용 장기 cache를 warm 상태로 유지
    - id: "alerts"
      params:
        cacheRetention: "none" # bursty notification에는 cache write 방지
```

`agents.list[].params`는 선택된 model의 `params` 위에 병합되므로, `cacheRetention`만 override하고 나머지 기본 model 설정은 그대로 상속할 수 있습니다.

### Example: enable Anthropic 1M context beta header

Anthropic의 1M context window는 현재 beta gating 상태입니다. OpenClaw는 지원되는 Opus/Sonnet 모델에서 `context1m`을 켜면 필요한 `anthropic-beta` 값을 주입할 수 있습니다.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

이 설정은 Anthropic의 `context-1m-2025-08-07` beta header로 매핑됩니다.

이는 해당 model entry에 `context1m: true`가 설정된 경우에만 적용됩니다.

요구 사항: 자격 증명은 장문 컨텍스트 사용 자격이 있어야 합니다(API key 과금 또는 Extra Usage가 켜진 subscription). 그렇지 않으면 Anthropic은 다음과 같이 응답합니다.
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`

Anthropic을 OAuth/subscription token(`sk-ant-oat-*`)으로 인증하면, OpenClaw는 현재 Anthropic이 그 조합을 HTTP 401로 거부하기 때문에 `context-1m-*` beta header를 넣지 않습니다.

## Tips for reducing token pressure

- `/compact`를 사용해 긴 세션을 요약하세요.
- 워크플로우에서 큰 tool output을 잘라내세요.
- 스크린샷이 많은 세션에서는 `agents.defaults.imageMaxDimensionPx`를 낮추세요.
- Skill 설명은 짧게 유지하세요(skill list가 prompt에 주입됩니다).
- 장황하고 탐색적인 작업에는 더 작은 모델을 우선 사용하세요.

정확한 skill list 오버헤드 계산식은 [Skills](/tools/skills)를 참고하세요.
