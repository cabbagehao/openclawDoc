---
summary: "컨텍스트 창 및 압축(Compaction): 세션 데이터를 모델 한도 내로 유지하는 OpenClaw의 자동 관리 기법"
read_when:
  - 자동 압축(Auto-compaction) 및 `/compact` 명령어의 동작 방식을 이해하고자 할 때
  - 긴 세션에서 컨텍스트 제한 초과 문제를 해결하고 싶을 때
title: "데이터 압축 (Compaction)"
x-i18n:
  source_path: "concepts/compaction.md"
---

# 컨텍스트 창 및 압축 (Compaction)

모든 모델에는 한 번에 처리할 수 있는 최대 토큰 수인 **컨텍스트 창(Context Window)** 제한이 존재함. 장시간 이어지는 대화는 메시지와 도구 실행 결과가 누적되어 컨텍스트 용량을 압박하게 됨. OpenClaw는 이러한 제한을 넘지 않도록 오래된 이력을 \*\*압축(Compaction)\*\*하여 관리함.

## 압축(Compaction)의 정의

압축은 **과거의 대화 내용을 요약**하여 하나의 압축된 요약본(Summary entry)으로 만들고, 최근 메시지는 원본 그대로 보존하는 프로세스임. 요약된 내용은 세션 이력에 저장되어 이후의 모든 요청에서 다음과 같이 활용됨:

* **이전 대화 요약본** (Compaction summary)
* **압축 시점 이후의 최신 메시지들**

압축된 결과는 세션의 JSONL 이력 파일에 **영구적으로 반영**됨.

## 설정 가이드

`openclaw.json` 파일의 `agents.defaults.compaction` 섹션에서 압축 모드, 목표 토큰 수 등의 동작을 설정할 수 있음. 기본적으로 요약 과정에서 고유 식별자(Opaque identifiers)를 보존함(`identifierPolicy: "strict"`). 필요에 따라 이를 해제하거나(`"off"`) 커스텀 지침을 줄 수 있음.

압축 요약 작업을 수행할 모델을 별도로 지정할 수도 있음(`compaction.model`). 주 모델이 로컬 모델이거나 성능이 낮은 모델일 경우, 더 뛰어난 성능의 모델(예: Claude 3.5 Sonnet)을 사용하여 요약 품질을 높이는 것이 효과적임:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-3-5-sonnet-latest"
      }
    }
  }
}
```

Ollama와 같은 로컬 모델 환경에서 요약 전용 모델을 별도로 구성하는 것도 가능함:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

지정하지 않을 경우 에이전트의 주 모델(Primary model)을 사용하여 요약함.

## 자동 압축 (Auto-compaction)

세션 데이터가 모델의 컨텍스트 제한에 근접하거나 초과할 경우, OpenClaw는 자동으로 압축 과정을 수행하고 압축된 컨텍스트를 사용하여 원래의 요청을 재시도함.

자동 압축 발생 시 확인 방법:

* **상세 출력 모드(Verbose)**: `🧹 Auto-compaction complete` 메시지 표시.
* **상태 확인**: `/status` 명령어 결과의 `🧹 Compactions` 항목에서 횟수 확인 가능.

압축 시작 직전, OpenClaw는 디스크에 중요한 정보를 남기기 위해 \*\*무음 메모리 플러시(Silent memory flush)\*\*를 수행할 수 있음. 상세 내용은 [기억 시스템(Memory)](/concepts/memory) 참조.

## 수동 압축

`/compact` 명령어를 사용하여 원할 때 즉시 압축을 실행할 수 있음 (선택적으로 요약 지침 추가 가능):

```text
/compact 핵심 결정 사항과 미결 과제 위주로 요약해줘
```

## 컨텍스트 창 정보의 출처

컨텍스트 제한 수치는 모델별로 상이함. OpenClaw는 설정된 공급자(Provider)의 카탈로그 정보를 바탕으로 각 모델의 정확한 제한치를 결정함.

## 압축(Compaction) vs 가지치기(Pruning)

* **압축 (Compaction)**: 내용을 요약하여 JSONL 이력에 **영구 저장**함.
* **세션 가지치기 (Session Pruning)**: 오래된 **도구 실행 결과**만을 요청 시점에 **메모리에서만** 일시적으로 제거함.

상세 내용은 [세션 가지치기 가이드](/concepts/session-pruning) 참조.

## OpenAI 서버 측 압축 지원

OpenClaw는 OpenAI 호환 모델에 대해 서버 측 압축 힌트(OpenAI Responses server-side compaction hints) 기능을 지원함. 이는 로컬 압축 기능과 별개로 작동하며 동시에 활성화할 수 있음.

* **로컬 압축**: OpenClaw가 직접 요약하여 세션 파일에 기록.
* **서버 측 압축**: OpenAI 공급자가 `store` 및 `context_management` 설정을 기반으로 서버 측에서 처리.

상세 파라미터는 [OpenAI 공급자 가이드](/providers/openai) 참조.

## 유용한 팁

* 세션 응답이 느려지거나 맥락이 너무 비대해졌다고 느껴질 때 `/compact` 명령어를 사용함.
* 용량이 큰 도구 출력물은 이미 자동으로 잘리지만(Truncated), 가지치기 기능을 사용하면 누적된 도구 결과 데이터를 더욱 효과적으로 관리할 수 있음.
* 완전히 새로운 맥락에서 대화를 시작하고 싶다면 `/new` 또는 `/reset` 명령어로 새 세션 ID를 생성함.
