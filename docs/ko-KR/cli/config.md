---
summary: "CLI reference for `openclaw config` (get/set/unset/file/validate)"
description: "path 기반으로 OpenClaw config를 조회·수정·삭제·검증하는 `openclaw config` 명령의 표기법과 JSON5 value 처리 방식을 설명합니다."
read_when:
  - non-interactive하게 config를 읽거나 수정할 때
title: "config"
x-i18n:
  source_path: "cli/config.md"
---

# `openclaw config`

config helper입니다. path 기준으로 get/set/unset/validate를 수행하고, 현재 active config file도 출력할 수 있습니다.
subcommand 없이 실행하면 configure wizard를 엽니다. (`openclaw configure`와 동일)

## Examples

```bash
openclaw config file
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config unset tools.web.search.apiKey
openclaw config validate
openclaw config validate --json
```

## Paths

path는 dot notation 또는 bracket notation을 사용합니다.

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

특정 agent를 대상으로 할 때는 agent list index를 사용합니다.

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Values

value는 가능하면 JSON5로 parse하고, 아니면 string으로 취급합니다.
JSON5 parsing을 강제하려면 `--strict-json`을 사용하세요. `--json`은 legacy alias로 계속 지원됩니다.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

## Subcommands

- `config file`: active config file path를 출력합니다. (`OPENCLAW_CONFIG_PATH` 또는 default location 기준)

설정 변경 후에는 gateway를 재시작하세요.

## Validate

gateway를 실제로 시작하지 않고, 현재 config를 active schema에 대해 검증합니다.

```bash
openclaw config validate
openclaw config validate --json
```
