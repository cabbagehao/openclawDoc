---
summary: "모델 제공업체용 OAuth 만료 상태 모니터링"
read_when:
  - 인증 만료 모니터링이나 경고를 설정할 때
  - Claude Code / Codex OAuth 갱신 점검을 자동화할 때
title: "인증 모니터링"
x-i18n:
  source_path: "automation/auth-monitoring.md"
---

# 인증 모니터링

OpenClaw는 `openclaw models status`를 통해 OAuth 만료 상태를 노출합니다.
자동화와 경고는 이를 기준으로 구성하면 되고, 스크립트는 휴대폰 워크플로우를 위한 선택적 부가 기능입니다.

## 권장 방식: CLI 점검(이식성 높음)

```bash
openclaw models status --check
```

종료 코드:

- `0`: 정상
- `1`: 자격 증명이 만료되었거나 없음
- `2`: 곧 만료됨(24시간 이내)

이 방식은 cron/systemd에서 동작하며 별도 스크립트가 필요 없습니다.

## 선택적 스크립트(운영 / 휴대폰 워크플로우)

이 스크립트들은 `scripts/` 아래에 있으며 **선택 사항**입니다. Gateway 호스트에 SSH로 접속할 수 있다고 가정하며, systemd + Termux 환경에 맞춰져 있습니다.

- `scripts/claude-auth-status.sh`는 이제 `openclaw models status --json`을 기준 진실의 원천으로 사용합니다(CLI를 사용할 수 없으면 직접 파일을 읽는 방식으로 폴백). 따라서 타이머에서는 `openclaw`가 `PATH`에 있어야 합니다.
- `scripts/auth-monitor.sh`: cron/systemd 타이머 대상, 알림 전송(ntfy 또는 휴대폰)
- `scripts/systemd/openclaw-auth-monitor.{service,timer}`: systemd 사용자 타이머
- `scripts/claude-auth-status.sh`: Claude Code + OpenClaw 인증 점검기(full/json/simple)
- `scripts/mobile-reauth.sh`: SSH를 통한 안내형 재인증 흐름
- `scripts/termux-quick-auth.sh`: 한 번 탭으로 상태 확인 + 인증 URL 열기 위젯
- `scripts/termux-auth-widget.sh`: 전체 안내형 위젯 흐름
- `scripts/termux-sync-widget.sh`: Claude Code 자격 증명 → OpenClaw 동기화

휴대폰 자동화나 systemd 타이머가 필요하지 않다면 이 스크립트들은 건너뛰어도 됩니다.
