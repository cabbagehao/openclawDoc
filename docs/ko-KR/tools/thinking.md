---
summary: "`/think` + `/verbose` 지시어 문법과 이것이 모델 추론에 미치는 영향"
read_when:
  - thinking 또는 verbose 지시어 파싱이나 기본값을 조정할 때
title: "Thinking 수준"
---

# Thinking 수준 (/think 지시어)

## 기능

- 모든 수신 본문에서 인라인 지시어를 사용할 수 있습니다: `/t <level>`, `/think:<level>`, 또는 `/thinking <level>`.
- 수준(별칭): `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (최대 예산)
  - xhigh → "ultrathink+" (GPT-5.2 + Codex 모델 전용)
  - adaptive → 공급자가 관리하는 적응형 추론 예산(Anthropic Claude 4.6 모델 계열에서 지원)
  - `x-high`, `x_high`, `extra-high`, `extra high`, `extra_high`는 `xhigh`로 매핑됩니다.
  - `highest`, `max`는 `high`로 매핑됩니다.
- 공급자 참고 사항:
  - Anthropic Claude 4.6 모델은 명시적인 thinking 수준이 설정되지 않으면 기본값으로 `adaptive`를 사용합니다.
  - Z.AI(`zai/*`)는 이진 thinking(`on`/`off`)만 지원합니다. `off`가 아닌 모든 수준은 `on`으로 처리됩니다(`low`로 매핑).
  - Moonshot(`moonshot/*`)은 `/think off`를 `thinking: { type: "disabled" }`로, `off`가 아닌 모든 수준을 `thinking: { type: "enabled" }`로 매핑합니다. thinking이 활성화되면 Moonshot은 `tool_choice`로 `auto|none`만 허용하며, OpenClaw는 호환되지 않는 값을 `auto`로 정규화합니다.

## 결정 순서

1. 메시지의 인라인 지시어(해당 메시지에만 적용).
2. 세션 오버라이드(지시어만 있는 메시지를 보내 설정).
3. 전역 기본값(설정의 `agents.defaults.thinkingDefault`).
4. 폴백: Anthropic Claude 4.6 모델은 `adaptive`, 그 외 추론 가능 모델은 `low`, 그 외에는 `off`.

## 세션 기본값 설정

- 공백만 허용된 상태로 **지시어만** 포함한 메시지를 보내세요. 예: `/think:medium` 또는 `/t high`.
- 이 설정은 현재 세션(기본적으로 발신자별)에 유지되며, `/think:off` 또는 세션 유휴 초기화로 해제됩니다.
- 확인 응답이 전송됩니다(`Thinking level set to high.` / `Thinking disabled.`). 수준이 올바르지 않으면(예: `/thinking big`) 힌트와 함께 명령이 거부되며 세션 상태는 변경되지 않습니다.
- 현재 thinking 수준을 보려면 인자 없이 `/think`(또는 `/think:`)를 보내세요.

## 에이전트별 적용

- **Embedded Pi**: 결정된 수준이 인프로세스 Pi 에이전트 런타임에 전달됩니다.

## Verbose 지시어 (/verbose 또는 /v)

- 수준: `on` (최소) | `full` | `off` (기본값).
- 지시어만 있는 메시지는 세션 verbose를 전환하고 `Verbose logging enabled.` / `Verbose logging disabled.`로 응답합니다. 잘못된 수준은 상태를 바꾸지 않고 힌트를 반환합니다.
- `/verbose off`는 명시적인 세션 오버라이드를 저장합니다. Sessions UI에서 `inherit`를 선택해 이를 해제하세요.
- 인라인 지시어는 해당 메시지에만 영향을 주며, 그 외에는 세션/전역 기본값이 적용됩니다.
- 현재 verbose 수준을 보려면 인자 없이 `/verbose`(또는 `/verbose:`)를 보내세요.
- verbose가 켜져 있으면 구조화된 도구 결과를 내보내는 에이전트(Pi, 기타 JSON 에이전트)는 각 도구 호출을 별도의 메타데이터 전용 메시지로 다시 보냅니다. 가능한 경우 `<emoji> <tool-name>: <arg>` 형식의 접두사(경로/명령)가 붙습니다. 이러한 도구 요약은 각 도구가 시작되는 즉시(별도 버블) 전송되며 스트리밍 델타로 전송되지는 않습니다.
- 도구 실패 요약은 일반 모드에서도 계속 표시되지만, 원시 오류 상세 접미사는 verbose가 `on` 또는 `full`이 아니면 숨겨집니다.
- verbose가 `full`이면 완료 후 도구 출력도 전달됩니다(별도 버블, 안전한 길이로 잘림). 실행이 진행 중일 때 `/verbose on|full|off`를 전환하면 이후 도구 버블은 새 설정을 따릅니다.

## 추론 표시 (/reasoning)

- 수준: `on|off|stream`.
- 지시어만 있는 메시지는 응답에서 thinking 블록을 표시할지 여부를 전환합니다.
- 활성화되면 추론은 `Reasoning:` 접두사가 붙은 **별도 메시지**로 전송됩니다.
- `stream`(Telegram 전용): 응답 생성 중 Telegram 초안 버블에 추론을 스트리밍한 뒤, 최종 응답은 추론 없이 전송합니다.
- 별칭: `/reason`.
- 현재 추론 수준을 보려면 인자 없이 `/reasoning`(또는 `/reasoning:`)을 보내세요.

## 관련

- Elevated mode 문서는 [Elevated mode](/tools/elevated)에 있습니다.

## 하트비트

- 하트비트 프로브 본문은 구성된 하트비트 프롬프트입니다(기본값: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). 하트비트 메시지의 인라인 지시어는 평소처럼 적용되지만(하트비트에서 세션 기본값을 바꾸는 것은 피하세요).
- 하트비트 전달은 기본적으로 최종 페이로드만 보냅니다. 별도의 `Reasoning:` 메시지도 함께 보내려면(사용 가능한 경우) `agents.defaults.heartbeat.includeReasoning: true` 또는 에이전트별 `agents.list[].heartbeat.includeReasoning: true`를 설정하세요.

## 웹 채팅 UI

- 웹 채팅 thinking 선택기는 페이지가 로드될 때 수신 세션 저장소/설정에 저장된 세션 수준을 반영합니다.
- 다른 수준을 선택하면 다음 메시지에만 적용됩니다(`thinkingOnce`). 전송 후 선택기는 저장된 세션 수준으로 다시 돌아갑니다.
- 세션 기본값을 변경하려면 예전과 같이 `/think:<level>` 지시어를 보내세요. 선택기는 다음 새로고침 후 이를 반영합니다.
