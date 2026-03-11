---
summary: "모델 공급자용 OAuth 인증 만료 상태 모니터링 및 알림 설정 가이드"
read_when:
  - 인증 만료 모니터링 시스템이나 자동 알림을 구축하고자 할 때
  - Claude Code 또는 Codex OAuth 갱신 여부를 자동으로 확인하고 싶을 때
title: "인증 상태 모니터링"
x-i18n:
  source_path: "automation/auth-monitoring.md"
---

# 인증 상태 모니터링 (Auth Monitoring)

OpenClaw는 `openclaw models status` 명령어를 통해 OAuth 인증 만료 상태를 외부에 노출함. 자동화 및 알림 시스템 구축 시 이를 활용할 수 있으며, 제공되는 스크립트들은 모바일 워크플로우를 위한 선택적 추가 도구임.

## 권장 방식: CLI 기반 점검 (높은 이식성)

별도의 스크립트 없이 CLI 명령어를 사용하여 현재 상태를 확인할 수 있음:

```bash
openclaw models status --check
```

**종료 코드(Exit Codes) 설명:**
- **`0`**: 정상 (OK).
- **`1`**: 자격 증명이 누락되었거나 이미 만료됨.
- **`2`**: 곧 만료 예정 (24시간 이내).

이 방식은 표준 종료 코드를 반환하므로 크론(Cron) 작업이나 systemd 타이머에 그대로 연동하여 사용할 수 있음.

## 선택적 스크립트 (운영 및 모바일 워크플로우)

`scripts/` 디렉터리에 포함된 다음 스크립트들은 **선택 사항**임. 이 도구들은 Gateway 호스트에 대한 SSH 접근 권한이 있음을 가정하며, 주로 systemd 및 Termux 환경에 최적화되어 있음.

- **`scripts/claude-auth-status.sh`**: `openclaw models status --json`을 **데이터 단일 원천(SSOT)**으로 사용하여 인증 상태를 조회함. (CLI 사용 불가 시 파일 직접 읽기로 폴백)
- **`scripts/auth-monitor.sh`**: 크론이나 systemd 타이머의 실행 대상임. ntfy 또는 스마트폰 위젯으로 알림을 전송함.
- **`scripts/systemd/openclaw-auth-monitor.{service,timer}`**: systemd 사용자 타이머 설정 파일 예시.
- **`scripts/mobile-reauth.sh`**: SSH 접속 환경에서 수행하는 안내형 재인증 프로세스.
- **`scripts/termux-quick-auth.sh`**: 탭 한 번으로 상태를 확인하고 인증 URL을 여는 원클릭 위젯 스크립트.
- **`scripts/termux-auth-widget.sh`**: 전체 과정을 안내하는 위젯 워크플로우.
- **`scripts/termux-sync-widget.sh`**: Claude Code 자격 증명을 OpenClaw로 동기화하는 도구.

모바일 자동화나 systemd 타이머 기반의 별도 관리가 필요하지 않다면 해당 스크립트들은 무시해도 무방함.
