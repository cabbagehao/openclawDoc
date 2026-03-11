---
summary: "채널 연결 상태를 점검하는 health check 절차"
read_when:
  - WhatsApp 채널 상태를 진단할 때
title: "상태 확인"
---

# 상태 확인 (CLI)

추측 없이 채널 연결 상태를 확인하는 짧은 가이드입니다.

## 빠른 점검

- `openclaw status` — 로컬 요약: gateway 도달 가능 여부/모드, 업데이트 힌트, 연결된 채널 인증 경과 시간, 세션 + 최근 활동
- `openclaw status --all` — 전체 로컬 진단(read-only, color 출력, 디버깅용으로 붙여 넣기 안전)
- `openclaw status --deep` — 실행 중인 Gateway도 probe(지원되는 경우 채널별 probe 포함)
- `openclaw health --json` — 실행 중인 Gateway에 전체 health 스냅샷 요청(WS 전용, direct Baileys socket 없음)
- WhatsApp/WebChat에서 `/status` 를 단독 메시지로 보내면 agent 호출 없이 상태 응답을 받을 수 있음
- 로그: `/tmp/openclaw/openclaw-*.log` 를 tail 하면서 `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound` 로 필터링

## 심층 진단

- 디스크의 creds: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (`mtime` 이 최근이어야 함)
- 세션 저장소: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (경로는 config에서 override 가능). 개수와 최근 수신자는 `status` 에 표시됨
- 재연결 흐름: 로그에 status code 409–515 또는 `loggedOut` 이 보이면 `openclaw channels logout && openclaw channels login --verbose` 실행
  (참고: QR 로그인 흐름은 페어링 후 status 515에 대해 자동으로 한 번 재시작됨)

## 실패했을 때

- `logged out` 또는 status 409–515 → `openclaw channels logout` 후 `openclaw channels login` 으로 다시 연결
- Gateway에 도달할 수 없음 → 시작: `openclaw gateway --port 18789` (포트가 사용 중이면 `--force`)
- 인바운드 메시지가 없음 → 연결된 폰이 online인지, 발신자가 허용되었는지(`channels.whatsapp.allowFrom`) 확인. 그룹 채팅이면 allowlist + mention 규칙이 맞는지 확인(`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`)

## 전용 "health" 명령

`openclaw health --json` 은 실행 중인 Gateway에 health 스냅샷을 요청합니다(CLI에서 채널 소켓에 직접 붙지 않음). 가능한 경우 연결된 creds/auth age, 채널별 probe 요약, session-store 요약, probe duration을 보고합니다. Gateway에 도달할 수 없거나 probe가 실패/타임아웃되면 non-zero로 종료합니다. 기본 10초를 바꾸려면 `--timeout <ms>` 를 사용하세요.
