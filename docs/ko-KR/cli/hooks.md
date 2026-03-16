---
summary: "CLI reference for `openclaw hooks` (agent hooks)"
description: "agent hook을 조회·활성화·비활성화·설치·업데이트하는 `openclaw hooks` 명령과 bundled hook의 역할을 정리합니다."
read_when:
  - agent hook을 관리하고 싶을 때
  - hook을 설치하거나 업데이트하려고 할 때
title: "hooks"
x-i18n:
  source_path: "cli/hooks.md"
---

# `openclaw hooks`

agent hook을 관리합니다. hook은 `/new`, `/reset`, gateway startup 같은 command/event에 반응하는 event-driven automation입니다.

Related:

- Hooks: [Hooks](/automation/hooks)
- Plugin hooks: [Plugins](/tools/plugin#plugin-hooks)

## List All Hooks

```bash
openclaw hooks list
```

workspace, managed, bundled directory에서 발견된 모든 hook을 나열합니다.

**Options:**

- `--eligible`: 요구 사항을 충족한 eligible hook만 표시
- `--json`: JSON 출력
- `-v, --verbose`: missing requirement를 포함한 상세 정보 표시

**Example output:**

```text
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new command is issued
```

**Example (verbose):**

```bash
openclaw hooks list --verbose
```

eligible하지 않은 hook의 missing requirement도 보여줍니다.

**Example (JSON):**

```bash
openclaw hooks list --json
```

programmatic use를 위한 structured JSON을 반환합니다.

## Get Hook Information

```bash
openclaw hooks info <name>
```

특정 hook의 상세 정보를 보여줍니다.

**Arguments:**

- `<name>`: hook 이름 (예: `session-memory`)

**Options:**

- `--json`: JSON 출력

**Example:**

```bash
openclaw hooks info session-memory
```

**Output:**

```text
💾 session-memory ✓ Ready

Save session context to memory when /new command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new

Requirements:
  Config: ✓ workspace.dir
```

## Check Hooks Eligibility

```bash
openclaw hooks check
```

hook eligibility 상태의 요약을 보여줍니다. (ready / not ready 개수)

**Options:**

- `--json`: JSON 출력

**Example output:**

```text
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Enable a Hook

```bash
openclaw hooks enable <name>
```

특정 hook을 config (`~/.openclaw/config.json`)에 추가해 활성화합니다.

**Note:** plugin이 관리하는 hook은 `openclaw hooks list`에서 `plugin:<id>`로 보이며, 여기서 enable/disable할 수 없습니다. 대신 plugin을 enable/disable해야 합니다.

**Arguments:**

- `<name>`: hook 이름 (예: `session-memory`)

**Example:**

```bash
openclaw hooks enable session-memory
```

**Output:**

```text
✓ Enabled hook: 💾 session-memory
```

**What it does:**

- hook이 존재하고 eligible한지 확인
- config의 `hooks.internal.entries.<name>.enabled = true`로 업데이트
- config를 디스크에 저장

**After enabling:**

- hook이 다시 로드되도록 gateway를 재시작하세요. (macOS에서는 menu bar app restart, dev에서는 gateway process restart)

## Disable a Hook

```bash
openclaw hooks disable <name>
```

config를 업데이트해 특정 hook을 비활성화합니다.

**Arguments:**

- `<name>`: hook 이름 (예: `command-logger`)

**Example:**

```bash
openclaw hooks disable command-logger
```

**Output:**

```text
⏸ Disabled hook: 📝 command-logger
```

**After disabling:**

- hook이 다시 로드되도록 gateway를 재시작하세요.

## Install Hooks

```bash
openclaw hooks install <path-or-spec>
openclaw hooks install <npm-spec> --pin
```

local folder/archive 또는 npm에서 hook pack을 설치합니다.

npm spec은 **registry-only**입니다. (package name + optional exact version 또는 dist-tag) Git/URL/file spec과 semver range는 거부됩니다. dependency install은 안전을 위해 `--ignore-scripts`로 실행됩니다.

bare spec이나 `@latest`는 stable track으로 간주합니다. npm이 이를 prerelease로 resolve하면 OpenClaw는 진행을 멈추고 `@beta`, `@rc`, 또는 exact prerelease version처럼 명시적 prerelease opt-in을 요구합니다.

**What it does:**

- hook pack을 `~/.openclaw/hooks/<id>`로 복사
- 설치된 hook을 `hooks.internal.entries.*`에 활성화
- 설치 정보를 `hooks.internal.installs`에 기록

**Options:**

- `-l, --link`: local directory를 복사하지 않고 link (`hooks.internal.load.extraDirs`에 추가)
- `--pin`: npm install을 resolved exact `name@version` 형태로 기록

**Supported archives:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Examples:**

```bash
# Local directory
openclaw hooks install ./my-hook-pack

# Local archive
openclaw hooks install ./my-hook-pack.zip

# NPM package
openclaw hooks install @openclaw/my-hook-pack

# Link a local directory without copying
openclaw hooks install -l ./my-hook-pack
```

## Update Hooks

```bash
openclaw hooks update <id>
openclaw hooks update --all
```

설치된 hook pack을 업데이트합니다. (npm install만 지원)

**Options:**

- `--all`: 추적 중인 hook pack 전체 업데이트
- `--dry-run`: 쓰기 없이 변경 예정만 표시

저장된 integrity hash가 있고, 새로 가져온 artifact hash가 달라지면 OpenClaw는 진행 전에 경고를 출력하고 확인을 요구합니다. CI나 non-interactive run에서는 global `--yes`로 prompt를 건너뛸 수 있습니다.

## Bundled Hooks

### session-memory

`/new`를 실행할 때 session context를 memory에 저장합니다.

**Enable:**

```bash
openclaw hooks enable session-memory
```

**Output:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**See:** [session-memory documentation](/automation/hooks#session-memory)

### bootstrap-extra-files

`agent:bootstrap` 동안 monorepo-local `AGENTS.md`, `TOOLS.md` 같은 추가 bootstrap file을 주입합니다.

**Enable:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**See:** [bootstrap-extra-files documentation](/automation/hooks#bootstrap-extra-files)

### command-logger

모든 command event를 중앙 audit file에 기록합니다.

**Enable:**

```bash
openclaw hooks enable command-logger
```

**Output:** `~/.openclaw/logs/commands.log`

**View logs:**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**See:** [command-logger documentation](/automation/hooks#command-logger)

### boot-md

gateway가 시작될 때 (`channels` 시작 이후) `BOOT.md`를 실행합니다.

**Events**: `gateway:startup`

**Enable:**

```bash
openclaw hooks enable boot-md
```

**See:** [boot-md documentation](/automation/hooks#boot-md)
