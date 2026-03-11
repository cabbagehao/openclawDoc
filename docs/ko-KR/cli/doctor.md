---
summary: "`openclaw doctor`용 CLI 레퍼런스(헬스 체크 + 가이드형 복구)"
read_when:
  - 연결 또는 인증 문제가 있고 가이드형 수정이 필요할 때
  - 업데이트 후 정상 동작 여부를 점검하려고 할 때
title: "doctor"
---

# `openclaw doctor`

gateway와 채널에 대한 헬스 체크와 빠른 수정을 제공합니다.

관련 문서:

- 문제 해결: [Troubleshooting](/gateway/troubleshooting)
- 보안 감사: [Security](/gateway/security)

## 예시

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
```

참고:

- 대화형 프롬프트(키체인/OAuth 수정 등)는 stdin이 TTY이고 `--non-interactive`가 **설정되지 않았을 때만** 실행됩니다. 헤드리스 실행(cron, Telegram, 터미널 없음)에서는 프롬프트를 건너뜁니다.
- `--fix`(`--repair`의 별칭)는 백업을 `~/.openclaw/openclaw.json.bak`에 저장하고, 알 수 없는 설정 키를 제거하면서 각각의 제거 내역을 나열합니다.
- 이제 상태 무결성 검사가 세션 디렉터리의 고아 transcript 파일을 감지하고, 공간을 안전하게 회수할 수 있도록 이를 `.deleted.<timestamp>`로 아카이브할 수 있습니다.
- Doctor는 `~/.openclaw/cron/jobs.json`(또는 `cron.store`)도 검사해 레거시 cron job 형태를 찾아내고, 스케줄러가 런타임에 자동 정규화하기 전에 제자리에서 다시 쓸 수 있습니다.
- Doctor에는 memory-search 준비 상태 검사도 포함되며, 임베딩 자격 증명이 누락된 경우 `openclaw configure --section model`을 추천할 수 있습니다.
- sandbox 모드가 켜져 있는데 Docker를 사용할 수 없으면, doctor는 해결책(`install Docker` 또는 `openclaw config set agents.defaults.sandbox.mode off`)과 함께 신호가 강한 경고를 보고합니다.

## macOS: `launchctl` 환경 변수 오버라이드

이전에 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`(또는 `...PASSWORD`)를 실행했다면, 그 값이 설정 파일보다 우선되어 지속적인 “unauthorized” 오류를 일으킬 수 있습니다.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
