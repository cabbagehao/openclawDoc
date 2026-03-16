---
summary: "OpenClaw CLI reference for `openclaw` commands, subcommands, and options"
description: "OpenClaw CLI의 전체 명령 구조와 주요 subcommand, global flag, 관리 흐름을 한 페이지에서 확인할 수 있는 종합 레퍼런스입니다."
read_when:
  - CLI 명령이나 옵션을 추가 또는 수정할 때
  - 새로운 CLI surface를 문서화할 때
title: "CLI Reference"
x-i18n:
  source_path: "cli/index.md"
---

# CLI reference

이 페이지는 현재 CLI 동작을 설명합니다. 명령이 바뀌면 이 문서도 함께 업데이트해야 합니다.

## Command pages

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
- [`plugins`](/cli/plugins) (plugin commands)
- [`channels`](/cli/channels)
- [`security`](/cli/security)
- [`secrets`](/cli/secrets)
- [`skills`](/cli/skills)
- [`daemon`](/cli/daemon) (gateway service command용 legacy alias)
- [`clawbot`](/cli/clawbot) (legacy alias namespace)
- [`voicecall`](/cli/voicecall) (plugin; 설치된 경우)

## Global flags

- `--dev`: 상태를 `~/.openclaw-dev` 아래로 분리하고 기본 port를 이동합니다.
- `--profile <name>`: 상태를 `~/.openclaw-<name>` 아래로 분리합니다.
- `--no-color`: ANSI color를 비활성화합니다.
- `--update`: `openclaw update`의 shorthand입니다. (source install 전용)
- `-V`, `--version`, `-v`: version을 출력하고 종료합니다.

## Output styling

- ANSI color와 progress indicator는 TTY session에서만 렌더링됩니다.
- OSC-8 hyperlink는 지원되는 terminal에서 clickable link로 렌더링되고, 그렇지 않으면 plain URL로 fallback합니다.
- `--json`(그리고 지원되는 경우 `--plain`)은 깔끔한 output을 위해 styling을 비활성화합니다.
- `--no-color`는 ANSI styling을 끄며, `NO_COLOR=1`도 존중합니다.
- 오래 실행되는 명령은 progress indicator를 표시합니다. (지원되면 OSC 9;4)

## Color palette

OpenClaw는 CLI 출력에 lobster palette를 사용합니다.

- `accent` (#FF5A2D): heading, label, primary highlight
- `accentBright` (#FF7A3D): command name, emphasis
- `accentDim` (#D14A22): secondary highlight text
- `info` (#FF8A5B): informational value
- `success` (#2FBF71): success state
- `warn` (#FFB020): warning, fallback, attention
- `error` (#E23D2D): error, failure
- `muted` (#8B7F77): de-emphasis, metadata

palette source of truth: `src/terminal/palette.ts` (aka “lobster seam”)

## Command tree

```text
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

참고: plugin은 추가 top-level command를 더할 수 있습니다. (예: `openclaw voicecall`)

## Security

- `openclaw security audit` — config와 local state를 일반적인 security foot-gun 기준으로 audit합니다.
- `openclaw security audit --deep` — best-effort live Gateway probe를 실행합니다.
- `openclaw security audit --fix` — 안전한 기본값을 강화하고 state/config permission을 조입니다.

## Secrets

- `openclaw secrets reload` — ref를 다시 resolve하고 runtime snapshot을 atomic하게 교체합니다.
- `openclaw secrets audit` — plaintext residue, unresolved ref, precedence drift를 스캔합니다.
- `openclaw secrets configure` — provider setup, SecretRef mapping, preflight, apply를 위한 interactive helper입니다.
- `openclaw secrets apply --from <plan.json>` — 이전에 생성한 plan을 적용합니다. (`--dry-run` 지원)

## Plugins

extension과 그 config를 관리합니다.

- `openclaw plugins list` — plugin을 discover합니다. (machine output은 `--json`)
- `openclaw plugins info <id>` — plugin 상세 정보를 표시합니다.
- `openclaw plugins install <path|.tgz|npm-spec>` — plugin을 설치하거나 plugin path를 `plugins.load.paths`에 추가합니다.
- `openclaw plugins enable <id>` / `disable <id>` — `plugins.entries.<id>.enabled`를 토글합니다.
- `openclaw plugins doctor` — plugin load error를 보고합니다.

대부분의 plugin 변경은 gateway restart가 필요합니다. 자세한 내용은 [/plugin](/tools/plugin)을 참고하세요.

## Memory

`MEMORY.md`와 `memory/*.md`에 대한 vector search입니다.

- `openclaw memory status` — index 통계를 보여 줍니다.
- `openclaw memory index` — memory file을 다시 인덱싱합니다.
- `openclaw memory search "<query>"` (또는 `--query "<query>"`) — memory 위에서 semantic search를 실행합니다.

## Chat slash commands

chat message는 `/...` command를 지원합니다. (text와 native)
자세한 내용은 [/tools/slash-commands](/tools/slash-commands)를 참고하세요.

주요 항목:

- `/status` — 빠른 진단
- `/config` — persisted config 변경
- `/debug` — runtime-only config override (disk가 아닌 memory, `commands.debug: true` 필요)

## Setup + onboarding

### `setup`

config와 workspace를 초기화합니다.

Options:

- `--workspace <dir>`: agent workspace path (기본값 `~/.openclaw/workspace`)
- `--wizard`: onboarding wizard 실행
- `--non-interactive`: prompt 없이 wizard 실행
- `--mode <local|remote>`: wizard mode
- `--remote-url <url>`: remote Gateway URL
- `--remote-token <token>`: remote Gateway token

wizard flag(`--non-interactive`, `--mode`, `--remote-url`, `--remote-token`) 중 하나라도 있으면 wizard가 자동 실행됩니다.

### `onboard`

gateway, workspace, skill을 설정하는 interactive wizard입니다.

Options:

- `--workspace <dir>`
- `--reset` (wizard 전에 config + credential + session reset)
- `--reset-scope <config|config+creds+sessions|full>` (기본값 `config+creds+sessions`, workspace까지 제거하려면 `full`)
- `--non-interactive`
- `--mode <local|remote>`
- `--flow <quickstart|advanced|manual>` (`manual`은 `advanced` alias)
- `--auth-choice <setup-token|token|chutes|openai-codex|openai-api-key|openrouter-api-key|ai-gateway-api-key|moonshot-api-key|moonshot-api-key-cn|kimi-code-api-key|synthetic-api-key|venice-api-key|gemini-api-key|zai-api-key|mistral-api-key|apiKey|minimax-api|minimax-api-lightning|opencode-zen|opencode-go|custom-api-key|skip>`
- `--token-provider <id>` (non-interactive, `--auth-choice token`과 함께 사용)
- `--token <token>` (non-interactive, `--auth-choice token`과 함께 사용)
- `--token-profile-id <id>` (non-interactive, 기본값 `<provider>:manual`)
- `--token-expires-in <duration>` (non-interactive, 예: `365d`, `12h`)
- `--secret-input-mode <plaintext|ref>` (기본값 `plaintext`, provider default env ref를 저장하려면 `ref`)
- `--anthropic-api-key <key>`
- `--openai-api-key <key>`
- `--mistral-api-key <key>`
- `--openrouter-api-key <key>`
- `--ai-gateway-api-key <key>`
- `--moonshot-api-key <key>`
- `--kimi-code-api-key <key>`
- `--gemini-api-key <key>`
- `--zai-api-key <key>`
- `--minimax-api-key <key>`
- `--opencode-zen-api-key <key>`
- `--opencode-go-api-key <key>`
- `--custom-base-url <url>` (non-interactive, `--auth-choice custom-api-key`용)
- `--custom-model-id <id>` (non-interactive, `--auth-choice custom-api-key`용)
- `--custom-api-key <key>` (non-interactive, optional, 생략하면 `CUSTOM_API_KEY` 사용)
- `--custom-provider-id <id>` (non-interactive, optional custom provider id)
- `--custom-compatibility <openai|anthropic>` (non-interactive, optional, 기본값 `openai`)
- `--gateway-port <port>`
- `--gateway-bind <loopback|lan|tailnet|auto|custom>`
- `--gateway-auth <token|password>`
- `--gateway-token <token>`
- `--gateway-token-ref-env <name>` (non-interactive, `gateway.auth.token`을 env SecretRef로 저장, 해당 env var가 설정되어 있어야 하며 `--gateway-token`과 함께 사용 불가)
- `--gateway-password <password>`
- `--remote-url <url>`
- `--remote-token <token>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--install-daemon`
- `--no-install-daemon` (alias: `--skip-daemon`)
- `--daemon-runtime <node|bun>`
- `--skip-channels`
- `--skip-skills`
- `--skip-health`
- `--skip-ui`
- `--node-manager <npm|pnpm|bun>` (`pnpm` 권장, Gateway runtime에는 bun 비권장)
- `--json`

### `configure`

interactive configuration wizard입니다. (model, channel, skill, gateway)

### `config`

non-interactive config helper입니다. (get/set/unset/file/validate)
subcommand 없이 `openclaw config`를 실행하면 wizard가 시작됩니다.

Subcommands:

- `config get <path>`: config value 출력 (dot/bracket path)
- `config set <path> <value>`: value 설정 (JSON5 또는 raw string)
- `config unset <path>`: value 제거
- `config file`: active config file path 출력
- `config validate`: gateway를 시작하지 않고 현재 config를 schema 기준으로 validate
- `config validate --json`: machine-readable JSON output

### `doctor`

health check와 quick fix를 제공합니다. (config + gateway + legacy service)

Options:

- `--no-workspace-suggestions`: workspace memory hint 비활성화
- `--yes`: prompt 없이 default 허용
- `--non-interactive`: prompt를 건너뛰고 safe migration만 적용
- `--deep`: system service를 스캔하여 추가 gateway install 탐지

## Channel helpers

### `channels`

chat channel account를 관리합니다. (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/MS Teams)

Subcommands:

- `channels list`: configured channel과 auth profile 표시
- `channels status`: gateway reachability와 channel health 확인 (`--probe`는 추가 check 실행, gateway health probe는 `openclaw health` 또는 `openclaw status --deep` 사용)
- 팁: `channels status`는 일반적인 misconfiguration을 감지하면 suggested fix와 함께 warning을 출력하고, 이후 `openclaw doctor`를 안내합니다.
- `channels logs`: gateway log file에서 최근 channel log 표시
- `channels add`: flag가 없으면 wizard-style setup, flag가 있으면 non-interactive mode
  - single-account top-level config를 쓰는 channel에 non-default account를 추가하면, OpenClaw는 새 account를 쓰기 전에 account-scoped value를 `channels.<channel>.accounts.default`로 이동합니다.
  - non-interactive `channels add`는 binding을 자동 생성하거나 업그레이드하지 않습니다. channel-only binding은 계속 default account에 매치됩니다.
- `channels remove`: 기본 동작은 disable이며, prompt 없이 config entry를 삭제하려면 `--delete` 사용
- `channels login`: interactive channel login (WhatsApp Web only)
- `channels logout`: channel session logout (지원되는 경우)

Common options:

- `--channel <name>`: `whatsapp|telegram|discord|googlechat|slack|mattermost|signal|imessage|msteams`
- `--account <id>`: channel account id (기본값 `default`)
- `--name <label>`: account display name

`channels login` options:

- `--channel <channel>` (기본값 `whatsapp`, `whatsapp`/`web` 지원)
- `--account <id>`
- `--verbose`

`channels logout` options:

- `--channel <channel>` (기본값 `whatsapp`)
- `--account <id>`

`channels list` options:

- `--no-usage`: model provider usage/quota snapshot 생략 (OAuth/API-backed only)
- `--json`: JSON output (`--no-usage`가 없으면 usage 포함)

자세한 내용: [/concepts/oauth](/concepts/oauth)

Examples:

```bash
openclaw channels add --channel telegram --account alerts --name "Alerts Bot" --token $TELEGRAM_BOT_TOKEN
openclaw channels add --channel discord --account work --name "Work Bot" --token $DISCORD_BOT_TOKEN
openclaw channels remove --channel discord --account work --delete
openclaw channels status --probe
openclaw status --deep
```

### `skills`

available skill과 readiness 정보를 조회합니다.

Subcommands:

- `skills list`: skill 목록 (subcommand가 없을 때 기본)
- `skills info <name>`: 특정 skill 상세 정보
- `skills check`: ready vs missing requirement 요약

Options:

- `--eligible`: ready한 skill만 표시
- `--json`: JSON output (styling 없음)
- `-v`, `--verbose`: missing requirement detail 포함

팁: skill 검색, 설치, sync에는 `npx clawhub`를 사용하세요.

### `pairing`

channel 전반의 DM pairing request를 승인합니다.

Subcommands:

- `pairing list [channel] [--channel <channel>] [--account <id>] [--json]`
- `pairing approve <channel> <code> [--account <id>] [--notify]`
- `pairing approve --channel <channel> [--account <id>] <code> [--notify]`

### `devices`

gateway device pairing entry와 role별 device token을 관리합니다.

Subcommands:

- `devices list [--json]`
- `devices approve [requestId] [--latest]`
- `devices reject <requestId>`
- `devices remove <deviceId>`
- `devices clear --yes [--pending]`
- `devices rotate --device <id> --role <role> [--scope <scope...>]`
- `devices revoke --device <id> --role <role>`

### `webhooks gmail`

Gmail Pub/Sub hook setup + runner입니다. 자세한 내용은 [/automation/gmail-pubsub](/automation/gmail-pubsub)를 참고하세요.

Subcommands:

- `webhooks gmail setup` (`--account <email>` 필수, `--project`, `--topic`, `--subscription`, `--label`, `--hook-url`, `--hook-token`, `--push-token`, `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes`, `--tailscale`, `--tailscale-path`, `--tailscale-target`, `--push-endpoint`, `--json` 지원)
- `webhooks gmail run` (동일한 flag를 runtime override로 지원)

### `dns setup`

wide-area discovery DNS helper입니다. (CoreDNS + Tailscale)
자세한 내용은 [/gateway/discovery](/gateway/discovery)를 참고하세요.

Options:

- `--apply`: CoreDNS config 설치 또는 업데이트 (sudo 필요, macOS only)

## Messaging + agent

### `message`

unified outbound messaging과 channel action 명령입니다.

참고: [/cli/message](/cli/message)

Subcommands:

- `message send|poll|react|reactions|read|edit|delete|pin|unpin|pins|permissions|search|timeout|kick|ban`
- `message thread <create|list|reply>`
- `message emoji <list|upload>`
- `message sticker <send|upload>`
- `message role <info|add|remove>`
- `message channel <info|list>`
- `message member info`
- `message voice status`
- `message event <list|create>`

Examples:

- `openclaw message send --target +15555550123 --message "Hi"`
- `openclaw message poll --channel discord --target channel:123 --poll-question "Snack?" --poll-option Pizza --poll-option Sushi`

### `agent`

Gateway를 통해 agent turn 하나를 실행합니다. (`--local` embedded mode 가능)

Required:

- `--message <text>`

Options:

- `--to <dest>` (session key와 optional delivery용)
- `--session-id <id>`
- `--thinking <off|minimal|low|medium|high|xhigh>` (GPT-5.2 + Codex model only)
- `--verbose <on|full|off>`
- `--channel <whatsapp|telegram|discord|slack|mattermost|signal|imessage|msteams>`
- `--local`
- `--deliver`
- `--json`
- `--timeout <seconds>`

### `agents`

isolated agent를 관리합니다. (workspace + auth + routing)

#### `agents list`

configured agent를 나열합니다.

Options:

- `--json`
- `--bindings`

#### `agents add [name]`

새 isolated agent를 추가합니다. flag가 없으면 guided wizard가 실행되며,
flag 또는 `--non-interactive`가 있으면 non-interactive mode로 동작합니다.
non-interactive mode에서는 `--workspace`가 필수입니다.

Options:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (repeatable)
- `--non-interactive`
- `--json`

binding spec은 `channel[:accountId]`를 사용합니다.
`accountId`를 생략하면 OpenClaw는 channel default나 plugin hook을 통해 account scope를 해석할 수 있고,
그렇지 않으면 explicit account scope 없는 channel binding으로 남습니다.

#### `agents bindings`

routing binding을 나열합니다.

Options:

- `--agent <id>`
- `--json`

#### `agents bind`

agent에 routing binding을 추가합니다.

Options:

- `--agent <id>`
- `--bind <channel[:accountId]>` (repeatable)
- `--json`

#### `agents unbind`

agent의 routing binding을 제거합니다.

Options:

- `--agent <id>`
- `--bind <channel[:accountId]>` (repeatable)
- `--all`
- `--json`

#### `agents delete <id>`

agent를 삭제하고 workspace + state를 prune합니다.

Options:

- `--force`
- `--json`

### `acp`

IDE를 Gateway에 연결하는 ACP bridge를 실행합니다.

전체 option과 예시는 [`acp`](/cli/acp)를 참고하세요.

### `status`

linked session health와 최근 recipient를 보여 줍니다.

Options:

- `--json`
- `--all` (full diagnosis, read-only, pasteable)
- `--deep` (channel probe)
- `--usage` (model provider usage/quota 표시)
- `--timeout <ms>`
- `--verbose`
- `--debug` (alias for `--verbose`)

Notes:

- 가능한 경우 overview에 Gateway + node host service 상태가 포함됩니다.

### Usage tracking

OAuth/API credential이 available할 때 OpenClaw는 provider usage/quota를 보여 줄 수 있습니다.

Surface:

- `/status` (가능하면 짧은 provider usage line 추가)
- `openclaw status --usage` (전체 provider breakdown 출력)
- macOS menu bar (Context 아래 Usage section)

Notes:

- 데이터는 provider usage endpoint에서 직접 가져오며 estimate를 쓰지 않습니다.
- provider: Anthropic, GitHub Copilot, OpenAI Codex OAuth, 그리고 해당 provider plugin이 켜져 있을 때 Gemini CLI/Antigravity
- 일치하는 credential이 없으면 usage는 숨겨집니다.
- 자세한 내용: [Usage tracking](/concepts/usage-tracking)

### `health`

실행 중인 Gateway에서 health를 가져옵니다.

Options:

- `--json`
- `--timeout <ms>`
- `--verbose`

### `sessions`

저장된 conversation session을 나열합니다.

Options:

- `--json`
- `--verbose`
- `--store <path>`
- `--active <minutes>`

## Reset / Uninstall

### `reset`

local config와 state를 reset합니다. (CLI는 유지)

Options:

- `--scope <config|config+creds+sessions|full>`
- `--yes`
- `--non-interactive`
- `--dry-run`

Notes:

- `--non-interactive`에는 `--scope`와 `--yes`가 모두 필요합니다.

### `uninstall`

gateway service와 local data를 uninstall합니다. (CLI는 유지)

Options:

- `--service`
- `--state`
- `--workspace`
- `--app`
- `--all`
- `--yes`
- `--non-interactive`
- `--dry-run`

Notes:

- `--non-interactive`에는 `--yes`와 explicit scope 또는 `--all`이 필요합니다.

## Gateway

### `gateway`

WebSocket Gateway를 실행합니다.

Options:

- `--port <port>`
- `--bind <loopback|tailnet|lan|auto|custom>`
- `--token <token>`
- `--auth <token|password>`
- `--password <password>`
- `--password-file <path>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--allow-unconfigured`
- `--dev`
- `--reset` (dev config + credential + session + workspace reset)
- `--force` (port의 기존 listener 종료)
- `--verbose`
- `--claude-cli-logs`
- `--ws-log <auto|full|compact>`
- `--compact` (`--ws-log compact` alias)
- `--raw-stream`
- `--raw-stream-path <path>`

### `gateway service`

Gateway service를 관리합니다. (launchd/systemd/schtasks)

Subcommands:

- `gateway status` (기본적으로 Gateway RPC probe)
- `gateway install` (service install)
- `gateway uninstall`
- `gateway start`
- `gateway stop`
- `gateway restart`

Notes:

- `gateway status`는 기본적으로 service의 resolved port/config를 사용해 Gateway RPC를 probe합니다. (`--url/--token/--password`로 override 가능)
- `gateway status`는 script용 `--no-probe`, `--deep`, `--json`을 지원합니다.
- `gateway status`는 탐지 가능한 경우 legacy 또는 extra gateway service도 보여 줍니다. (`--deep`는 system-level scan 추가) profile 이름의 OpenClaw service는 first-class 취급되며 “extra”로 플래그되지 않습니다.
- `gateway status`는 CLI가 사용하는 config path와 service가 사용할 가능성이 높은 config(service env)를 함께 출력하고, resolved probe target URL도 보여 줍니다.
- Linux systemd install에서는 status token-drift check가 `Environment=`와 `EnvironmentFile=` unit source를 모두 포함합니다.
- `gateway install|uninstall|start|stop|restart`는 script용 `--json`을 지원합니다. (기본 output은 human-friendly 유지)
- `gateway install` 기본 runtime은 Node이며 bun은 **권장되지 않습니다**. (WhatsApp/Telegram bug)
- `gateway install` option: `--port`, `--runtime`, `--token`, `--force`, `--json`

### `logs`

RPC를 통해 Gateway file log를 tail합니다.

Notes:

- TTY session에서는 colorized structured view를 렌더링하고, non-TTY는 plain text로 fallback합니다.
- `--json`은 line-delimited JSON을 출력합니다. (한 줄당 하나의 log event)

Examples:

```bash
openclaw logs --follow
openclaw logs --limit 200
openclaw logs --plain
openclaw logs --json
openclaw logs --no-color
```

### `gateway <subcommand>`

Gateway CLI helper입니다. (RPC subcommand에는 `--url`, `--token`, `--password`, `--timeout`, `--expect-final` 사용)
`--url`을 넘기면 CLI는 config나 env credential을 자동 적용하지 않습니다.
이 경우 `--token` 또는 `--password`를 명시해야 하며, explicit credential이 없으면 오류입니다.

Subcommands:

- `gateway call <method> [--params <json>]`
- `gateway health`
- `gateway status`
- `gateway probe`
- `gateway discover`
- `gateway install|uninstall|start|stop|restart`
- `gateway run`

Common RPC:

- `config.apply` (validate + write config + restart + wake)
- `config.patch` (partial update merge + restart + wake)
- `update.run` (update + restart + wake)

팁: `config.set`/`config.apply`/`config.patch`를 직접 호출할 때는,
config가 이미 있으면 `config.get`에서 받은 `baseHash`를 함께 넘기세요.

## Models

fallback 동작과 scanning 전략은 [/concepts/models](/concepts/models)를 참고하세요.

Anthropic setup-token 예시:

```bash
claude setup-token
openclaw models auth setup-token --provider anthropic
openclaw models status
```

policy 참고: 이것은 기술적 호환성입니다. Anthropic은 과거 Claude Code 외부의 일부 subscription usage를 막은 적이 있으므로, production 의존 전에는 현재 약관을 확인하세요.

### `models` (root)

`openclaw models`는 `models status`의 alias입니다.

Root options:

- `--status-json` (`models status --json` alias)
- `--status-plain` (`models status --plain` alias)

### `models list`

Options:

- `--all`
- `--local`
- `--provider <name>`
- `--json`
- `--plain`

### `models status`

Options:

- `--json`
- `--plain`
- `--check` (exit 1=expired/missing, 2=expiring)
- `--probe` (configured auth profile에 live probe 실행)
- `--probe-provider <name>`
- `--probe-profile <id>` (repeat 또는 comma-separated)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`

항상 auth overview와 auth store profile의 OAuth expiry status를 포함합니다.
`--probe`는 live request를 실행하므로 token을 소모하고 rate limit를 유발할 수 있습니다.

### `models set <model>`

`agents.defaults.model.primary`를 설정합니다.

### `models set-image <model>`

`agents.defaults.imageModel.primary`를 설정합니다.

### `models aliases list|add|remove`

Options:

- `list`: `--json`, `--plain`
- `add <alias> <model>`
- `remove <alias>`

### `models fallbacks list|add|remove|clear`

Options:

- `list`: `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models image-fallbacks list|add|remove|clear`

Options:

- `list`: `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models scan`

Options:

- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>`
- `--concurrency <n>`
- `--no-probe`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

### `models auth add|setup-token|paste-token`

Options:

- `add`: interactive auth helper
- `setup-token`: `--provider <name>` (기본값 `anthropic`), `--yes`
- `paste-token`: `--provider <name>`, `--profile-id <id>`, `--expires-in <duration>`

### `models auth order get|set|clear`

Options:

- `get`: `--provider <name>`, `--agent <id>`, `--json`
- `set`: `--provider <name>`, `--agent <id>`, `<profileIds...>`
- `clear`: `--provider <name>`, `--agent <id>`

## System

### `system event`

system event를 enqueue하고 필요하면 heartbeat를 트리거합니다. (Gateway RPC)

Required:

- `--text <text>`

Options:

- `--mode <now|next-heartbeat>`
- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system heartbeat last|enable|disable`

heartbeat 제어 명령입니다. (Gateway RPC)

Options:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system presence`

system presence entry를 나열합니다. (Gateway RPC)

Options:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

## Cron

scheduled job를 관리합니다. (Gateway RPC)
자세한 내용은 [/automation/cron-jobs](/automation/cron-jobs)를 참고하세요.

Subcommands:

- `cron status [--json]`
- `cron list [--all] [--json]` (기본은 table output, raw는 `--json`)
- `cron add` (alias: `create`, `--name`과 정확히 하나의 schedule `--at` | `--every` | `--cron`, 그리고 정확히 하나의 payload `--system-event` | `--message` 필요)
- `cron edit <id>` (field patch)
- `cron rm <id>` (alias: `remove`, `delete`)
- `cron enable <id>`
- `cron disable <id>`
- `cron runs --id <id> [--limit <n>]`
- `cron run <id> [--force]`

모든 `cron` 명령은 `--url`, `--token`, `--timeout`, `--expect-final`을 받습니다.

## Node host

`node`는 **headless node host**를 실행하거나 background service로 관리합니다.
자세한 내용은 [`openclaw node`](/cli/node)를 참고하세요.

Subcommands:

- `node run --host <gateway-host> --port 18789`
- `node status`
- `node install [--host <gateway-host>] [--port <port>] [--tls] [--tls-fingerprint <sha256>] [--node-id <id>] [--display-name <name>] [--runtime <node|bun>] [--force]`
- `node uninstall`
- `node stop`
- `node restart`

Auth notes:

- `node`는 env/config에서 gateway auth를 resolve하며 `--token`/`--password` flag는 없습니다. 순서는 `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, 그다음 `gateway.auth.*`입니다. local mode에서는 `gateway.remote.*`를 의도적으로 무시하고, `gateway.mode=remote`에서는 remote precedence rule에 따라 `gateway.remote.*`가 참여합니다.
- legacy `CLAWDBOT_GATEWAY_*` env var는 의도적으로 무시됩니다.

## Nodes

`nodes`는 Gateway에 연결되어 paired node를 대상으로 동작합니다. 자세한 내용은 [/nodes](/nodes)를 참고하세요.

Common options:

- `--url`, `--token`, `--timeout`, `--json`

Subcommands:

- `nodes status [--connected] [--last-connected <duration>]`
- `nodes describe --node <id|name|ip>`
- `nodes list [--connected] [--last-connected <duration>]`
- `nodes pending`
- `nodes approve <requestId>`
- `nodes reject <requestId>`
- `nodes rename --node <id|name|ip> --name <displayName>`
- `nodes invoke --node <id|name|ip> --command <command> [--params <json>] [--invoke-timeout <ms>] [--idempotency-key <key>]`
- `nodes run --node <id|name|ip> [--cwd <path>] [--env KEY=VAL] [--command-timeout <ms>] [--needs-screen-recording] [--invoke-timeout <ms>] <command...>` (mac node 또는 headless node host)
- `nodes notify --node <id|name|ip> [--title <text>] [--body <text>] [--sound <name>] [--priority <passive|active|timeSensitive>] [--delivery <system|overlay|auto>] [--invoke-timeout <ms>]` (mac only)

Camera:

- `nodes camera list --node <id|name|ip>`
- `nodes camera snap --node <id|name|ip> [--facing front|back|both] [--device-id <id>] [--max-width <px>] [--quality <0-1>] [--delay-ms <ms>] [--invoke-timeout <ms>]`
- `nodes camera clip --node <id|name|ip> [--facing front|back] [--device-id <id>] [--duration <ms|10s|1m>] [--no-audio] [--invoke-timeout <ms>]`

Canvas + screen:

- `nodes canvas snapshot --node <id|name|ip> [--format png|jpg|jpeg] [--max-width <px>] [--quality <0-1>] [--invoke-timeout <ms>]`
- `nodes canvas present --node <id|name|ip> [--target <urlOrPath>] [--x <px>] [--y <px>] [--width <px>] [--height <px>] [--invoke-timeout <ms>]`
- `nodes canvas hide --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas navigate <url> --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas eval [<js>] --node <id|name|ip> [--js <code>] [--invoke-timeout <ms>]`
- `nodes canvas a2ui push --node <id|name|ip> (--jsonl <path> | --text <text>) [--invoke-timeout <ms>]`
- `nodes canvas a2ui reset --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes screen record --node <id|name|ip> [--screen <index>] [--duration <ms|10s>] [--fps <n>] [--no-audio] [--out <path>] [--invoke-timeout <ms>]`

Location:

- `nodes location get --node <id|name|ip> [--max-age <ms>] [--accuracy <coarse|balanced|precise>] [--location-timeout <ms>] [--invoke-timeout <ms>]`

## Browser

browser control CLI입니다. (dedicated Chrome/Brave/Edge/Chromium)
[`openclaw browser`](/cli/browser)와 [Browser tool](/tools/browser)을 함께 참고하세요.

Common options:

- `--url`, `--token`, `--timeout`, `--json`
- `--browser-profile <name>`

Manage:

- `browser status`
- `browser start`
- `browser stop`
- `browser reset-profile`
- `browser tabs`
- `browser open <url>`
- `browser focus <targetId>`
- `browser close [targetId]`
- `browser profiles`
- `browser create-profile --name <name> [--color <hex>] [--cdp-url <url>]`
- `browser delete-profile --name <name>`

Inspect:

- `browser screenshot [targetId] [--full-page] [--ref <ref>] [--element <selector>] [--type png|jpeg]`
- `browser snapshot [--format aria|ai] [--target-id <id>] [--limit <n>] [--interactive] [--compact] [--depth <n>] [--selector <sel>] [--out <path>]`

Actions:

- `browser navigate <url> [--target-id <id>]`
- `browser resize <width> <height> [--target-id <id>]`
- `browser click <ref> [--double] [--button <left|right|middle>] [--modifiers <csv>] [--target-id <id>]`
- `browser type <ref> <text> [--submit] [--slowly] [--target-id <id>]`
- `browser press <key> [--target-id <id>]`
- `browser hover <ref> [--target-id <id>]`
- `browser drag <startRef> <endRef> [--target-id <id>]`
- `browser select <ref> <values...> [--target-id <id>]`
- `browser upload <paths...> [--ref <ref>] [--input-ref <ref>] [--element <selector>] [--target-id <id>] [--timeout-ms <ms>]`
- `browser fill [--fields <json>] [--fields-file <path>] [--target-id <id>]`
- `browser dialog --accept|--dismiss [--prompt <text>] [--target-id <id>] [--timeout-ms <ms>]`
- `browser wait [--time <ms>] [--text <value>] [--text-gone <value>] [--target-id <id>]`
- `browser evaluate --fn <code> [--ref <ref>] [--target-id <id>]`
- `browser console [--level <error|warn|info>] [--target-id <id>]`
- `browser pdf [--target-id <id>]`

## Docs search

### `docs [query...]`

live docs index를 검색합니다.

## TUI

### `tui`

Gateway에 연결된 terminal UI를 엽니다.

Options:

- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--session <key>`
- `--deliver`
- `--thinking <level>`
- `--message <text>`
- `--timeout-ms <ms>` (기본값 `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`
