---
summary: "터미널 UI(TUI): 어느 머신에서나 Gateway에 연결"
read_when:
  - TUI를 처음 쓰는 사람에게 친절한 안내가 필요할 때
  - TUI 기능, 명령, 단축키 전체 목록이 필요할 때
title: "TUI"
x-i18n:
  source_path: "web/tui.md"
---

# TUI (터미널 UI)

## 빠른 시작

1. Gateway를 시작합니다.

```bash
openclaw gateway
```

2. TUI를 엽니다.

```bash
openclaw tui
```

3. 메시지를 입력하고 Enter를 누릅니다.

원격 Gateway의 경우:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Gateway가 password 인증을 사용한다면 `--password`를 사용하세요.

## 화면 구성

* 헤더: 연결 URL, 현재 agent, 현재 session
* 채팅 로그: 사용자 메시지, assistant 응답, 시스템 알림, 도구 카드
* 상태 줄: 연결/실행 상태(connecting, running, streaming, idle, error)
* 하단 상태 줄: 연결 상태 + agent + session + model + think/verbose/reasoning + token 수 + deliver
* 입력창: 자동완성이 있는 텍스트 편집기

## 개념 모델: agents + sessions

* Agents는 고유 slug입니다(예: `main`, `research`). Gateway가 목록을 제공합니다.
* Sessions는 현재 agent에 속합니다.
* Session key는 `agent:<agentId>:<sessionKey>` 형식으로 저장됩니다.
  * `/session main`을 입력하면 TUI는 이를 `agent:<currentAgent>:main`으로 확장합니다.
  * `/session agent:other:main`을 입력하면 해당 agent session으로 명시적으로 전환합니다.
* Session 범위:
  * `per-sender`(기본값): 각 agent는 여러 session을 가질 수 있습니다.
  * `global`: TUI는 항상 `global` session을 사용합니다(picker가 비어 있을 수 있음).
* 현재 agent와 session은 항상 footer에 표시됩니다.

## 전송 + 전달

* 메시지는 Gateway로 보내지며, 제공업체로의 전달은 기본적으로 꺼져 있습니다.
* 전달을 켜려면:
  * `/deliver on`
  * 또는 Settings 패널
  * 또는 `openclaw tui --deliver`로 시작

## 선택기 + 오버레이

* 모델 선택기: 사용 가능한 model 목록을 보고 session override를 설정
* 에이전트 선택기: 다른 agent 선택
* 세션 선택기: 현재 agent의 session만 표시
* 설정: deliver, tool output 확장, thinking 표시 전환

## 키보드 단축키

* Enter: 메시지 전송
* Esc: 활성 실행 중단
* Ctrl+C: 입력 지우기(두 번 누르면 종료)
* Ctrl+D: 종료
* Ctrl+L: model picker
* Ctrl+G: agent picker
* Ctrl+P: session picker
* Ctrl+O: tool output 확장 토글
* Ctrl+T: thinking 표시 토글(history 다시 로드)

## Slash commands

핵심:

* `/help`
* `/status`
* `/agent <id>` (또는 `/agents`)
* `/session <key>` (또는 `/sessions`)
* `/model <provider/model>` (또는 `/models`)

Session 제어:

* `/think <off|minimal|low|medium|high>`
* `/verbose <on|full|off>`
* `/reasoning <on|off|stream>`
* `/usage <off|tokens|full>`
* `/elevated <on|off|ask|full>` (별칭: `/elev`)
* `/activation <mention|always>`
* `/deliver <on|off>`

Session 생명주기:

* `/new` 또는 `/reset` (session 초기화)
* `/abort` (활성 실행 중단)
* `/settings`
* `/exit`

기타 Gateway slash command(예: `/context`)는 Gateway로 전달되어 시스템 출력으로 표시됩니다. 자세한 내용은 [Slash commands](/tools/slash-commands)를 참고하세요.

## 로컬 셸 명령

* 줄 앞에 `!`를 붙이면 TUI host에서 로컬 셸 명령을 실행합니다.
* TUI는 세션마다 한 번 로컬 실행 허용 여부를 묻고, 거부하면 해당 세션에서는 `!`가 비활성화됩니다.
* 명령은 TUI working directory에서 새 비대화형 셸로 실행됩니다(`cd`/환경 변수는 유지되지 않음).
* 로컬 셸 명령의 환경에는 `OPENCLAW_SHELL=tui-local`이 전달됩니다.
* 단독 `!`는 일반 메시지로 전송되며, 앞에 공백이 있으면 로컬 exec로 처리되지 않습니다.

## 도구 출력

* 도구 호출은 인자와 결과를 포함한 카드로 표시됩니다.
* Ctrl+O로 접힘/펼침 보기를 전환할 수 있습니다.
* 도구 실행 중에는 partial update가 같은 카드에 스트리밍됩니다.

## 터미널 색상

* TUI는 assistant 본문 텍스트를 터미널 기본 전경색으로 유지하므로, 다크/라이트 터미널 모두에서 읽기 쉽습니다.
* 밝은 배경 터미널인데 자동 감지가 틀렸다면 `openclaw tui`를 실행하기 전에 `OPENCLAW_THEME=light`를 설정하세요.
* 원래의 어두운 팔레트를 강제로 쓰려면 `OPENCLAW_THEME=dark`를 설정하세요.

## History + Streaming

* 연결 시 TUI는 최근 history를 불러옵니다(기본값 200개 메시지).
* 스트리밍 응답은 최종 확정될 때까지 제자리에서 갱신됩니다.
* 더 풍부한 도구 카드를 위해 agent tool event도 함께 수신합니다.

## 연결 세부 정보

* TUI는 `mode: "tui"`로 Gateway에 등록됩니다.
* 재연결이 발생하면 시스템 메시지를 표시하고, 이벤트 누락도 로그에 드러냅니다.

## 옵션

* `--url <url>`: Gateway WebSocket URL(config 또는 `ws://127.0.0.1:<port>`가 기본값)
* `--token <token>`: Gateway token(필요 시)
* `--password <password>`: Gateway password(필요 시)
* `--session <key>`: Session key(기본값 `main`, 범위가 global이면 `global`)
* `--deliver`: assistant 응답을 제공업체에 전달(기본값 꺼짐)
* `--thinking <level>`: 전송 시 thinking level override
* `--timeout-ms <ms>`: agent timeout(ms 단위, 기본값은 `agents.defaults.timeoutSeconds`)

참고: `--url`을 지정하면 TUI는 config 또는 환경 자격 증명으로 대체하지 않습니다.
`--token` 또는 `--password`를 명시적으로 전달해야 하며, 없으면 오류입니다.

## 문제 해결

메시지를 보냈는데 출력이 없을 때:

* TUI에서 `/status`를 실행해 Gateway가 연결되어 있고 idle/busy 상태인지 확인합니다.
* Gateway 로그 확인: `openclaw logs --follow`
* agent가 실행 가능한지 확인: `openclaw status` 및 `openclaw models status`
* 채팅 채널로 메시지가 가야 한다면 전달을 켜세요(`/deliver on` 또는 `--deliver`)
* `--history-limit <n>`: 불러올 history 항목 수(기본값 200)

## 연결 문제 해결

* `disconnected`: Gateway가 실행 중인지, `--url/--token/--password`가 올바른지 확인하세요.
* picker에 agent가 없음: `openclaw agents list`와 routing config를 점검하세요.
* session picker가 비어 있음: global 범위일 수 있거나 아직 session이 없을 수 있습니다.
