---
summary: "대상형 디버그 로그를 위한 diagnostics 플래그"
description: "전체 verbose logging을 켜지 않고 subsystem별 diagnostics flag로 targeted debug log를 수집하는 방법을 설명합니다."
read_when:
  - 전체 로깅 레벨을 올리지 않고 특정 디버그 로그만 필요할 때
  - 지원용으로 서브시스템별 로그를 수집해야 할 때
title: "Diagnostics Flags"
x-i18n:
  source_path: "diagnostics/flags.md"
---

# Diagnostics 플래그

Diagnostics 플래그를 사용하면 전체 verbose logging을 켜지 않고도 특정 대상의 디버그 로그만 활성화할 수 있습니다. 플래그는 opt-in 방식이며, 서브시스템이 이를 확인하지 않으면 아무 효과가 없습니다.

## 동작 방식

- 플래그는 문자열입니다(대소문자 구분 없음).
- config나 환경 변수 override로 활성화할 수 있습니다.
- wildcard도 지원합니다.
  - `telegram.*`는 `telegram.http`와 일치
  - `*`는 모든 플래그 활성화

## config로 활성화

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

여러 플래그:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

플래그를 바꾼 뒤에는 gateway를 다시 시작하세요.

## 환경 변수 override(1회용)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

모든 플래그 비활성화:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## 로그 위치

플래그 로그는 표준 diagnostics 로그 파일로 기록됩니다. 기본값은 다음과 같습니다.

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

`logging.file`을 설정했다면 그 경로를 사용합니다. 로그 형식은 JSONL(한 줄에 JSON 객체 하나)이며, `logging.redactSensitive`에 따른 redaction은 그대로 적용됩니다.

## 로그 추출

가장 최근 로그 파일 선택:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Telegram HTTP diagnostics 필터링:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

또는 재현 중에 tail:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

원격 gateway의 경우 `openclaw logs --follow`도 사용할 수 있습니다([/cli/logs](/cli/logs) 참고).

## 참고

- `logging.level`이 `warn`보다 높게 설정돼 있으면 이 로그들이 억제될 수 있습니다. 기본값인 `info`면 충분합니다.
- 플래그는 켜 둬도 안전합니다. 해당 서브시스템의 로그 양만 늘어납니다.
- 로그 대상, 레벨, redaction을 바꾸려면 [/logging](/logging)을 참고하세요.
