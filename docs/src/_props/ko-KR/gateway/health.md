---
summary: "통신 채널 연결 상태 진단 및 문제 해결 절차 안내"
read_when:
  - WhatsApp 등 개별 채널의 연결 상태를 점검하거나 진단할 때
title: "헬스 체크 (상태 점검)"
x-i18n:
  source_path: "gateway/health.md"
---

# 헬스 체크 (Health Checks)

OpenClaw 시스템 및 개별 통신 채널의 연결 상태를 정확하게 확인하기 위한 가이드임.

## 빠른 상태 점검

* **`openclaw status`**: 로컬 요약 정보(Gateway 도달 가능 여부, 업데이트 힌트, 채널 인증 경과 시간, 세션 및 최근 활동 요약)를 표시함.
* **`openclaw status --all`**: 전체 로컬 진단 결과(읽기 전용, 색상 강조 적용)를 출력함. 디버깅 보고용으로 안전하게 복사하여 사용할 수 있음.
* **`openclaw status --deep`**: 실행 중인 Gateway에 대한 심층 진단을 수행함 (지원되는 경우 채널별 상세 Probe 포함).
* **`openclaw health --json`**: 실행 중인 Gateway에 전체 헬스 스냅샷을 요청함 (WebSocket 전용, 채널 소켓 직접 접속 없음).
* **상태 명령 메시지**: WhatsApp 또는 WebChat에서 `/status` 메시지를 단독으로 전송하면 에이전트를 호출하지 않고 즉시 상태 응답을 받을 수 있음.
* **로그 모니터링**: `/tmp/openclaw/openclaw-*.log` 파일을 실시간으로 추적하며 `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound` 키워드로 필터링함.

## 심층 진단 방법

* **인증 정보 확인**: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` 명령으로 파일의 수정 시간(`mtime`)이 최신인지 확인함.
* **세션 저장소 확인**: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` 경로를 확인함 (경로는 설정에서 오버라이드 가능). 세션 수와 최근 대화 상대는 `status` 명령으로도 파악 가능함.
* **재인증 절차**: 로그에 상태 코드 `409–515` 또는 `loggedOut`이 기록되는 경우, `openclaw channels logout` 실행 후 `openclaw channels login --verbose` 명령을 통해 다시 페어링함. (참고: QR 로그인 중 상태 코드 515 발생 시 시스템이 자동으로 1회 재시도함.)

## 장애 발생 시 조치 사항

* **로그아웃 상태 (`logged out`, 409–515)**: 기존 세션을 로그아웃한 뒤 다시 로그인 과정을 수행함.
* **Gateway 도달 불가**: `openclaw gateway --port 18789` 명령으로 서버를 시작함 (포트 충돌 시 `--force` 플래그 사용).
* **메시지 수신 불가**:
  * 연결된 모바일 기기가 온라인 상태인지 확인함.
  * 발신자가 허용 목록(`channels.whatsapp.allowFrom`)에 포함되어 있는지 확인함.
  * 그룹 채팅의 경우, 허용 목록 및 멘션 규칙(`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`)이 올바르게 설정되었는지 확인함.

## 전용 `health` 명령어 상세

`openclaw health --json` 명령어는 실행 중인 Gateway 서버에 현재 상태 요약을 요청함. 이 명령은 CLI가 직접 채널 소켓에 연결하지 않고 서버 정보를 전달받는 방식임.

**보고 내용:**

* 연결된 인증 정보 및 인증 경과 시간.
* 채널별 상세 Probe 요약.
* 세션 저장소 요약 및 상태 점검 소요 시간.

**참고 사항:**

* Gateway 서버에 도달할 수 없거나 점검이 실패/타임아웃될 경우 종료 코드(Exit code) `1`을 반환함.
* 기본 타임아웃은 10초이며, `--timeout <ms>` 플래그로 조절 가능함.
