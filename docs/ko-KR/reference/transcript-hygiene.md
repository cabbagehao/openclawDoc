---
description: provider별 transcript 정리, tool-call 복구, 이미지 sanitization, inter-session provenance 규칙을 정리한 레퍼런스입니다.
summary: "참고: provider별 transcript 정리 및 복구 규칙"
read_when:
  - transcript 형태 때문에 provider 요청이 거부되는 문제를 디버깅할 때
  - transcript 정리나 tool-call 복구 로직을 변경할 때
  - provider 간 tool-call id 불일치를 조사할 때
title: "Transcript Hygiene"
x-i18n:
  source_path: "reference/transcript-hygiene.md"
---

# Transcript Hygiene (Provider Fixups)

이 문서는 실행 전에 transcript(모델 컨텍스트 구성)를 다듬기 위해 적용되는 **provider별 수정**을 설명합니다. 이 정리 단계는 엄격한 provider 요구사항을 만족시키기 위한 **메모리 내(in-memory)** 조정입니다. 이 hygiene 단계는 디스크에 저장된 JSONL transcript를 다시 쓰지 않습니다. 다만 별도의 세션 파일 복구 단계에서는 세션을 로드하기 전에 잘못된 JSONL 줄을 제거하면서 malformed JSONL 파일을 다시 쓸 수 있습니다. 복구가 일어나면 원본 파일은 세션 파일 옆에 백업됩니다.

범위는 다음을 포함합니다.

- Tool call id 정리
- Tool call 입력 검증
- Tool result 짝맞춤 복구
- 턴 검증 / 순서 정리
- Thought signature 정리
- 이미지 payload 정리
- 사용자 입력 provenance 태깅(세션 간 라우팅된 프롬프트용)

transcript 저장 방식이 필요하면 다음 문서를 참고하세요.

- [/reference/session-management-compaction](/reference/session-management-compaction)

---

## Where this runs

모든 transcript hygiene는 embedded runner에 집중되어 있습니다.

- 정책 선택: `src/agents/transcript-policy.ts`
- 정리/복구 적용: `src/agents/pi-embedded-runner/google.ts`의 `sanitizeSessionHistory`

이 정책은 `provider`, `modelApi`, `modelId`를 사용해 어떤 수정을 적용할지 결정합니다.

transcript hygiene와 별개로, 세션 파일은 로드 전에 필요 시 복구됩니다.

- `src/agents/session-file-repair.ts`의 `repairSessionFileIfNeeded`
- `run/attempt.ts`와 `compact.ts`(embedded runner)에서 호출

---

## Global rule: image sanitization

provider 측의 크기 제한 때문에 거부되지 않도록 이미지 payload는 항상 정리됩니다. 과도하게 큰 base64 이미지는 축소/재압축됩니다.

이 과정은 vision 모델에서 이미지가 토큰을 과도하게 사용하는 것도 억제합니다. 최대 크기를 낮추면 대체로 토큰 사용량이 줄고, 높이면 세부 묘사가 더 잘 보존됩니다.

구현:

- `src/agents/pi-embedded-helpers/images.ts`의 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts`의 `sanitizeContentBlocksImages`
- 최대 이미지 한 변 길이는 `agents.defaults.imageMaxDimensionPx`(기본값 `1200`)로 설정할 수 있습니다.

---

## Global rule: malformed tool calls

`input`과 `arguments`가 모두 없는 assistant tool-call block은 모델 컨텍스트를 만들기 전에 제거됩니다. 이렇게 하면 부분적으로만 저장된 tool call 때문에 provider가 요청을 거부하는 일을 막을 수 있습니다. 예를 들어 rate limit 실패 직후에 이런 문제가 생길 수 있습니다.

구현:

- `src/agents/session-transcript-repair.ts`의 `sanitizeToolCallInputs`
- `src/agents/pi-embedded-runner/google.ts`의 `sanitizeSessionHistory`에서 적용

---

## Global rule: inter-session input provenance

agent가 `sessions_send`를 사용해 다른 세션으로 프롬프트를 보낼 때(agent-to-agent reply/announce 단계 포함), OpenClaw는 생성된 user turn에 다음 값을 기록합니다.

- `message.provenance.kind = "inter_session"`

이 메타데이터는 transcript append 시점에 기록되며 role은 변경하지 않습니다. provider 호환성을 위해 `role: "user"`는 그대로 유지됩니다. transcript reader는 이를 사용해 내부 라우팅 프롬프트를 최종 사용자 작성 지시로 오인하지 않을 수 있습니다.

컨텍스트를 다시 구성할 때 OpenClaw는 해당 user turn 앞에 메모리 내에서 짧은 `[Inter-session message]` 마커를 붙입니다. 이렇게 하면 모델이 이를 외부 최종 사용자 지시와 구분할 수 있습니다.

---

## Provider matrix (current behavior)

**OpenAI / OpenAI Codex**

- 이미지 정리만 적용합니다.
- OpenAI Responses/Codex transcript에서 orphaned reasoning signature(뒤에 content block이 없는 reasoning 항목)를 제거합니다.
- Tool call id 정리는 하지 않습니다.
- Tool result 짝맞춤 복구는 하지 않습니다.
- 턴 검증이나 재정렬은 하지 않습니다.
- synthetic tool result를 만들지 않습니다.
- thought signature 제거도 하지 않습니다.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Tool call id 정리: 엄격한 영숫자만 허용
- Tool result 짝맞춤 복구 및 synthetic tool result 생성
- 턴 검증(Gemini 스타일 턴 교대)
- Google 턴 순서 보정(history가 assistant로 시작하면 작은 user bootstrap 추가)
- Antigravity Claude: thinking signature 정규화, unsigned thinking block 제거

**Anthropic / Minimax (Anthropic-compatible)**

- Tool result 짝맞춤 복구 및 synthetic tool result 생성
- 턴 검증(엄격한 교대를 만족시키기 위해 연속 user turn 병합)

**Mistral (model-id 기반 감지 포함)**

- Tool call id 정리: strict9(길이 9의 영숫자)

**OpenRouter Gemini**

- Thought signature 정리: base64가 아닌 `thought_signature` 값을 제거하고 base64는 유지

**Everything else**

- 이미지 정리만 적용합니다.

---

## Historical behavior (pre-2026.1.22)

2026.1.22 릴리스 이전에는 OpenClaw가 여러 층의 transcript hygiene를 적용했습니다.

- 모든 컨텍스트 빌드에서 **transcript-sanitize extension**이 실행되었고, 다음을 수행할 수 있었습니다.
  - tool use/result 짝맞춤 복구
  - tool call id 정리(`_`, `-`를 보존하는 비엄격 모드 포함)
- runner도 provider별 정리를 수행했기 때문에 작업이 중복되었습니다.
- provider policy 밖에서도 다음과 같은 추가 변형이 일어났습니다.
  - assistant 텍스트를 저장하기 전에 `<final>` 태그 제거
  - 비어 있는 assistant error turn 제거
  - tool call 이후 assistant content 잘라내기

이 복잡성은 provider 간 회귀를 일으켰고, 특히 `openai-responses`의 `call_id|fc_id` 짝맞춤 문제가 있었습니다. 2026.1.22 정리 작업으로 extension을 제거하고, 로직을 runner에 집중시켰으며, 이미지 정리 외에는 OpenAI transcript를 **건드리지 않도록** 바꿨습니다.
