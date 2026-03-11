---
summary: "아웃바운드 공급자 호출을 위한 재시도(Retry) 정책 및 설정 안내"
read_when:
  - 공급자별 재시도 동작이나 기본값을 수정하고자 할 때
  - 메시지 전송 오류 또는 속도 제한(Rate limit) 문제를 디버깅할 때
title: "재시도 정책"
x-i18n:
  source_path: "concepts/retry.md"
---

# 재시도 정책 (Retry Policy)

## 주요 목표

* **요청 단위 처리**: 여러 단계로 구성된 전체 플로우가 아닌, 개별 HTTP 요청 단위로 재시도를 수행함.
* **순서 보존**: 현재 단계만 재시도함으로써 작업의 선후 관계가 어긋나지 않도록 함.
* **중복 방지**: 비멱등(Non-idempotent) 작업이 중복 실행되어 의도치 않은 결과가 발생하는 것을 방지함.

## 기본 설정값

* **재시도 횟수 (Attempts)**: 3회
* **최대 지연 시간 (Max delay cap)**: 30,000ms (30초)
* **지터 (Jitter)**: 0.1 (10%)
* **공급자별 최소 지연 시간**:
  * Telegram: 400ms
  * Discord: 500ms

## 공급자별 동작 방식

### Discord

* **대상**: 속도 제한 오류(HTTP 429) 발생 시에만 재시도함.
* **방식**: Discord API가 응답으로 제공하는 `retry_after` 값을 우선 사용하며, 해당 값이 없을 경우 지수 백오프(Exponential backoff)를 적용함.

### Telegram

* **대상**: 일시적인 오류(429 에러, 타임아웃, 연결 끊김/재설정, 일시적인 서버 불능) 발생 시 재시도함.
* **방식**: `retry_after` 값을 우선 사용하거나 지수 백오프를 적용함.
* **예외**: 마크다운 파싱 에러는 재시도 대상에서 제외되며, 대신 일반 텍스트(Plain text)로 전환(Fallback)하여 재전송을 시도함.

## 설정 방법

`~/.openclaw/openclaw.json` 파일의 `channels` 섹션에서 공급자별로 재시도 정책을 개별 설정할 수 있음:

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## 참고 사항

* 재시도 로직은 개별 요청(메시지 전송, 미디어 업로드, 리액션 추가, 투표 생성, 스티커 전송 등)마다 독립적으로 적용됨.
* 복합 워크플로우(Composite flows)의 경우, 이미 성공적으로 완료된 이전 단계에 대해서는 재시도를 수행하지 않음.
