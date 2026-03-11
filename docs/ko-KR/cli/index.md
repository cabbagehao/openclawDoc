---
summary: "`openclaw` 명령어, 서브 명령 및 옵션을 위한 OpenClaw CLI 레퍼런스"
read_when:
  - CLI 명령어나 옵션을 추가 또는 수정할 때
  - 새로운 CLI 인터페이스를 문서화할 때
title: "CLI 레퍼런스"
---

# CLI 레퍼런스

이 페이지는 현재 CLI의 동작 방식을 설명합니다. 명령어가 변경될 경우 이 문서도 함께 업데이트해야 합니다.

## 명령어 페이지

- [`setup`](/cli/setup)
- [`onboard`](/cli/onboard)
- [`configure`](/cli/configure)
- [`config`](/cli/config)
- [`completion`](/cli/completion)
- [`doctor`](/cli/doctor)
- [`dashboard`](/cli/dashboard)
- [`backup`](/cli/backup)
- [`reset`](/cli/reset)
- [`uninstall`](/cli/uninstall)
- [`update`](/cli/update)
- [`message`](/cli/message)
- [`agent`](/cli/agent)
- [`agents`](/cli/agents)
- [`acp`](/cli/acp)
- [`status`](/cli/status)
- [`health`](/cli/health)
- [`sessions`](/cli/sessions)
- [`gateway`](/cli/gateway)
- [`logs`](/cli/logs)
- [`system`](/cli/system)
- [`models`](/cli/models)
- [`memory`](/cli/memory)
- [`directory`](/cli/directory)
- [`nodes`](/cli/nodes)
- [`devices`](/cli/devices)
- [`node`](/cli/node)
- [`approvals`](/cli/approvals)
- [`sandbox`](/cli/sandbox)
- [`tui`](/cli/tui)
- [`browser`](/cli/browser)
- [`cron`](/cli/cron)
- [`dns`](/cli/dns)
- [`docs`](/cli/docs)
- [`hooks`](/cli/hooks)
- [`webhooks`](/cli/webhooks)
- [`pairing`](/cli/pairing)
- [`qr`](/cli/qr)
- [`plugins`](/cli/plugins) (플러그인 명령어)
- [`channels`](/cli/channels)
- [`security`](/cli/security)
- [`secrets`](/cli/secrets)
- [`skills`](/cli/skills)
- [`daemon`](/cli/daemon) (gateway 서비스 명령용 레거시 별칭)
- [`clawbot`](/cli/clawbot) (레거시 별칭 네임스페이스)
- [`voicecall`](/cli/voicecall) (설치된 경우 사용 가능한 플러그인)

## 전역 플래그

- `--dev`: 상태를 `~/.openclaw-dev`로 분리하고 기본 포트를 변경함.
- `--profile <name>`: 상태를 `~/.openclaw-<name>`로 분리함.
- `--no-color`: ANSI 색상을 비활성화함.
- `--update`: `openclaw update`의 축약형(소스 설치 전용).
- `-V`, `--version`, `-v`: 버전을 출력하고 종료함.

## 출력 스타일링

- ANSI 색상 및 진행률 표시기는 TTY 세션에서만 렌더링됨.
- OSC-8 하이퍼링크는 지원되는 터미널에서 클릭 가능한 링크로 표시되며, 미지원 시 일반 URL로 대체됨.
- `--json`(및 지원되는 경우 `--plain`)은 깔끔한 출력을 위해 스타일링을 비활성화함.
- `--no-color`는 ANSI 스타일링을 비활성화하며, `NO_COLOR=1` 환경 변수도 준수함.
- 장시간 실행되는 명령어는 진행률 표시기(OSC 9;4, 지원 시)를 표시함.

## 색상 팔레트

OpenClaw는 CLI 출력에 'lobster' 팔레트를 사용함.

- `accent` (#FF5A2D): 제목, 라벨, 주요 하이라이트.
- `accentBright` (#FF7A3D): 명령어 이름, 강조.
- `accentDim` (#D14A22): 보조 하이라이트 텍스트.
- `info` (#FF8A5B): 정보성 값.
- `success` (#2FBF71): 성공 상태.
- `warn` (#FFB020): 경고, 폴백(Fallback), 주의 사항.
- `error` (#E23D2D): 오류, 실패.
- `muted` (#8B7F77): 비강조 텍스트, 메타데이터.

팔레트의 데이터 단일 원천(SSOT): `src/terminal/palette.ts` (일명 “lobster seam”).

## 명령어 트리

```
openclaw [--dev] [--profile <name>] <command>
  setup
  onboard
  configure
  config
    get
    set
    unset
  completion
  doctor
  dashboard
  backup
    create
    verify
  security
    audit
  secrets
    reload
    migrate
  reset
  uninstall
  update
  channels
    list
    status
    logs
    add
    remove
    login
    logout
  directory
  skills
    list
    info
    check
  plugins
    list
    info
    install
    enable
    disable
    doctor
  memory
    status
    index
    search
  message
  agent
  agents
    list
    add
    delete
  acp
  status
  health
  sessions
  gateway
    call
    health
    status
    probe
    discover
    install
    uninstall
    start
    stop
    restart
    run
  daemon
    status
    install
    uninstall
    start
    stop
    restart
  logs
  system
    event
    heartbeat last|enable|disable
    presence
  models
    list
    status
    set
    set-image
    aliases list|add|remove
    fallbacks list|add|remove|clear
    image-fallbacks list|add|remove|clear
    scan
    auth add|setup-token|paste-token
    auth order get|set|clear
  sandbox
    list
    recreate
    explain
  cron
    status
    list
    add
    edit
    rm
    enable
    disable
    runs
    run
  nodes
  devices
  node
    run
    status
    install
    uninstall
    start
    stop
    restart
  approvals
    get
    set
    allowlist add|remove
  browser
    status
    start
    stop
    reset-profile
    tabs
    open
    focus
    close
    profiles
    create-profile
    delete-profile
    screenshot
    snapshot
    navigate
    resize
    click
    type
    press
    hover
    drag
    select
    upload
    fill
    dialog
    wait
    evaluate
    console
    pdf
  hooks
    list
    info
    check
    enable
    disable
    install
    update
  webhooks
    gmail setup|run
  pairing
    list
    approve
  qr
  clawbot
    qr
  docs
  dns
    setup
  tui
```

참고: 플러그인은 추가 최상위 명령어를 더할 수 있음(예: `openclaw voicecall`).

## 보안

- `openclaw security audit` — 일반적인 보안 취약점을 기준으로 설정 및 로컬 상태를 점검함.
- `openclaw security audit --deep` — 최선의 노력을 다하는(best-effort) 방식으로 실시간 Gateway 프로브를 실행함.
- `openclaw security audit --fix` — 안전한 기본값을 적용하고 `chmod`를 통해 상태/설정 권한을 조정함.

## 시크릿 (Secrets)

- `openclaw secrets reload` — 참조(Reference)를 다시 해석하고 런타임 스냅샷을 원자적으로 교체함.
- `openclaw secrets audit` — 평문 잔여물, 해석되지 않은 참조, 우선순위 편차 등을 검사함.
- `openclaw secrets configure` — 공급자 설정, SecretRef 매핑, 사전 점검 및 적용을 위한 대화형 도우미임.
- `openclaw secrets apply --from <plan.json>` — 이전에 생성된 계획을 적용함(`--dry-run` 지원).

## 플러그인

확장 기능 및 관련 설정을 관리함.

- `openclaw plugins list` — 사용 가능한 플러그인을 나열함(머신 판독용 출력은 `--json` 사용).
- `openclaw plugins info <id>` — 플러그인 상세 정보를 표시함.
- `openclaw plugins install <path|.tgz|npm-spec>` — 플러그인을 설치함(또는 `plugins.load.paths`에 경로 추가).
- `openclaw plugins enable <id>` / `disable <id>` — 특정 플러그인의 활성화 여부를 토글함.
- `openclaw plugins doctor` — 플러그인 로드 오류를 보고함.

대부분의 플러그인 변경 사항은 gateway 재시작이 필요함. 자세한 내용은 [/plugin](/tools/plugin) 참조.

## 메모리

`MEMORY.md` 및 `memory/*.md` 파일에 대한 벡터 검색을 수행함.

- `openclaw memory status` — 인덱스 통계를 표시함.
- `openclaw memory index` — 메모리 파일을 다시 인덱싱함.
- `openclaw memory search "<query>"`(또는 `--query "<query>"`) — 메모리에 대해 시맨틱 검색을 수행함.

## 채팅 슬래시 명령어

채팅 메시지는 `/...` 형태의 명령어(텍스트 및 네이티브)를 지원함. [/tools/slash-commands](/tools/slash-commands) 참조.

주요 명령어:

- `/status`: 빠른 진단용.
- `/config`: 영구적인 설정 변경용.
- `/debug`: 런타임 전용 설정 오버라이드(메모리에만 저장되며 `commands.debug: true` 필요).

## 설정 및 온보딩

### `setup`

설정 및 워크스페이스를 초기화함.

옵션:

- `--workspace <dir>`: 에이전트 워크스페이스 경로(기본값 `~/.openclaw/workspace`).
- `--wizard`: 온보딩 마법사를 실행함.
- `--non-interactive`: 사용자 프롬프트 없이 마법사를 실행함.
- `--mode <local|remote>`: 마법사 모드 선택.
- `--remote-url <url>`: 원격 Gateway URL.
- `--remote-token <token>`: 원격 Gateway 토큰.

마법사 플래그(`--non-interactive`, `--mode`, `--remote-url`, `--remote-token`) 중 하나라도 지정되면 마법사가 자동으로 실행됨.

### `onboard`

Gateway, 워크스페이스, 스킬을 설정하는 대화형 마법사임.

옵션:

- `--workspace <dir>`
- `--reset`: 마법사 실행 전 설정, 자격 증명, 세션을 초기화함.
- `--reset-scope <config|config+creds+sessions|full>`: 초기화 범위를 지정함 (기본값 `config+creds+sessions`, 워크스페이스까지 제거하려면 `full` 사용).
- `--non-interactive`
- `--mode <local|remote>`
- `--flow <quickstart|advanced|manual>` (`manual`은 `advanced`의 별칭).
- `--auth-choice <...>`: 인증 방식 선택(Anthropic, OpenAI, OpenRouter 등 다양한 공급자 지원).
- `--secret-input-mode <plaintext|ref>`: 기본값 `plaintext`. 평문 키 대신 공급자의 기본 환경 변수 참조(SecretRef)를 저장하려면 `ref` 사용.
- `--install-daemon`: 데몬 서비스 설치 여부.
- `--daemon-runtime <node|bun>`: 데몬 실행 환경 선택.
- `--node-manager <npm|pnpm|bun>`: 패키지 매니저 선택 (`pnpm` 권장).

### `configure`

모델, 채널, 스킬, Gateway를 설정하는 대화형 마법사임.

### `config`

비대화형 설정 도구(get/set/unset/file/validate)임. 하위 명령 없이 실행하면 마법사가 시작됨.

서브 명령:

- `config get <path>`: 특정 경로의 설정 값을 출력함.
- `config set <path> <value>`: 값을 설정함 (JSON5 또는 원시 문자열).
- `config unset <path>`: 특정 설정을 제거함.
- `config file`: 현재 활성화된 설정 파일 경로를 출력함.
- `config validate`: Gateway를 시작하지 않고 현재 설정을 스키마에 따라 검증함.

## 채널 관리

### `channels`

채팅 채널 계정(WhatsApp, Telegram, Discord, Slack 등)을 관리함.

서브 명령:

- `channels list`: 설정된 채널 및 인증 프로필을 나열함.
- `channels status`: Gateway 연결성 및 채널 상태를 확인함.
- `channels logs`: Gateway 로그 파일에서 최근 채널 관련 로그를 표시함.
- `channels add`: 새로운 채널 계정을 추가함.
- `channels remove`: 계정을 제거하거나 비활성화함.

자세한 내용: [/concepts/oauth](/concepts/oauth)

### `skills`

사용 가능한 스킬 목록과 준비 상태를 확인함.

### `pairing`

채널 간 DM 페어링 요청을 승인함.

### `devices`

Gateway 장치 페어링 및 역할별 토큰을 관리함.

## 메시징 및 에이전트

### `message`

통합된 발신 메시징 및 채널 작업을 수행함. [/cli/message](/cli/message) 참조.

### `agent`

Gateway를 통해(또는 `--local` 모드로) 에이전트의 단일 턴을 실행함.

### `agents`

격리된 에이전트(워크스페이스, 인증, 라우팅)를 관리함.

### `acp`

IDE를 Gateway에 연결하는 ACP 브리지를 실행함. [`acp`](/cli/acp) 참조.

### `status`

연결된 세션 상태와 최근 수신자 정보를 표시함.

## Gateway 관리

### `gateway`

WebSocket Gateway를 실행함. 다양한 네트워크 및 인증 옵션을 지원함.

### `gateway service`

Gateway 서비스(launchd, systemd 등)를 관리(install, start, stop, restart)함.

### `logs`

Gateway의 파일 로그를 실시간으로 스트리밍함.

## 모델 관리

모델 설정 및 폴백 전략은 [/concepts/models](/concepts/models) 참조.

### `models list` / `models status`

사용 가능한 모델 목록과 인증 프로필의 상태(OAuth 만료 등)를 확인함.

### `models scan`

사용 가능한 모델을 자동으로 스캔하고 기본 모델을 설정함.

## 시스템 및 작업 예약

### `system`

시스템 이벤트 제어 및 Heartbeat 설정을 관리함.

### `cron`

예약된 작업을 관리함. [/automation/cron-jobs](/automation/cron-jobs) 참조.

## 노드 및 브라우저

### `node`

헤드리스 노드 호스트를 실행하거나 서비스로 관리함.

### `nodes`

Gateway에 페어링된 노드를 대상으로 명령(invoke, run, notify)을 실행하거나 카메라/화면 제어를 수행함.

### `browser`

전용 브라우저 인스턴스를 제어(navigate, screenshot, click, type 등)함. [`openclaw browser`](/cli/browser) 참조.

---

### `docs [query...]`

실시간 문서 인덱스를 검색함.

### `tui`

Gateway에 연결된 터미널 기반 사용자 인터페이스(TUI)를 실행함.
