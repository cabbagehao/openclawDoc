---
summary: "모델 provider의 OAuth 만료 상태를 모니터링하는 방법"
description: "`openclaw models status`와 선택적 보조 스크립트를 사용해 OAuth 자격 증명의 만료를 감시하고 알림을 구성하는 방법을 설명합니다."
read_when:
  - OAuth 만료 모니터링이나 알림을 설정할 때
  - Claude Code / Codex OAuth 갱신 상태 점검을 자동화할 때
title: "인증 모니터링"
x-i18n:
  source_path: "automation/auth-monitoring.md"
---

# 인증 모니터링

OpenClaw는 `openclaw models status`를 통해 OAuth 만료 상태를 노출합니다.
자동화와 알림에는 이 명령을 사용하면 되고, 스크립트는 휴대폰 워크플로우를
위한 선택적 보조 도구입니다.

## 권장 방식: CLI 점검(이식성 높음)

```bash
openclaw models status --check
```

종료 코드:

- `0`: 정상
- `1`: 자격 증명이 없거나 만료됨
- `2`: 곧 만료됨(24시간 이내)

이 방식은 cron/systemd에서 그대로 사용할 수 있으며 추가 스크립트가 필요하지
않습니다.

## 선택적 스크립트(운영 / 휴대폰 워크플로우)

이 스크립트들은 `scripts/` 아래에 있으며 **선택 사항**입니다. SSH로 gateway
호스트에 접속할 수 있다고 가정하며, systemd + Termux 환경에 맞춰져 있습니다.

- `scripts/claude-auth-status.sh`는 이제 `openclaw models status --json`을
  기준 데이터로 사용하며(CLI를 사용할 수 없을 때만 직접 파일 읽기로
  폴백합니다), 타이머에서 사용하려면 `openclaw`가 `PATH`에 있어야 합니다.
- `scripts/auth-monitor.sh`: cron/systemd 타이머 대상 스크립트이며 알림(ntfy
  또는 휴대폰) 전송을 담당합니다.
- `scripts/systemd/openclaw-auth-monitor.{service,timer}`: systemd 사용자
  타이머 예제입니다.
- `scripts/claude-auth-status.sh`: Claude Code + OpenClaw 인증 상태 점검기
  (`full`/`json`/`simple`).
- `scripts/mobile-reauth.sh`: SSH를 통한 단계별 재인증 흐름입니다.
- `scripts/termux-quick-auth.sh`: 원탭 위젯 상태 확인 + 인증 URL 열기입니다.
- `scripts/termux-auth-widget.sh`: 전체 단계별 위젯 흐름입니다.
- `scripts/termux-sync-widget.sh`: Claude Code 자격 증명 -> OpenClaw 동기화입니다.

휴대폰 자동화나 systemd 타이머가 필요 없다면 이 스크립트들은 건너뛰면 됩니다.
